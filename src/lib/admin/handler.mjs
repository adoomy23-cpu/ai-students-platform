import { authorizeRequest, privateJson } from "../auth/server-access.mjs";
import { adminOperations } from "./operations.mjs";

export async function readLimitedJson(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("invalid");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid");
  let size = 0;
  const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 262144) { await reader.cancel(); throw new Error("too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export function sameSiteRequest(request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser callers still need verified Bearer auth.
  try {
    const url = new URL(origin);
    if (!["https:", "http:"].includes(url.protocol)) return false;
    // Codespaces/hosting proxies terminate HTTPS before the Next.js server.
    // Host checks never authorize a user: the verified JWT and is_admin do.
    const hosts = [new URL(request.url).host, request.headers.get("host"),
      request.headers.get("x-forwarded-host")?.split(",")[0].trim()].filter(Boolean).map((host) => host.toLowerCase());
    return hosts.includes(url.host.toLowerCase());
  } catch { return false; }
}
export async function handleAdminRequest(request, createUserClient) {
  if (!sameSiteRequest(request)) return privateJson({ error: { code: "forbidden" } }, 403);
  const access = await authorizeRequest(request, createUserClient);
  if (access.status !== 200) return privateJson({ error: { code: access.code } }, access.status);
  if (access.role !== "admin") return privateJson({ error: { code: "forbidden" } }, 403);
  let body;
  try { body = await readLimitedJson(request); }
  catch (error) { return privateJson({ error: { code: "invalid_request" } }, error.message === "too_large" ? 413 : 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 2 ||
      typeof body.action !== "string" || !Object.hasOwn(body, "payload") || !Object.hasOwn(adminOperations, body.action)) {
    return privateJson({ error: { code: "invalid_request" } }, 400);
  }
  const operation = adminOperations[body.action];
  if (!operation.validate(body.payload)) return privateJson({ error: { code: "invalid_request" } }, 400);
  try {
    const { data, error } = await operation.run(access.client, body.payload);
    if (error) return privateJson({ error: { code: "database_error" } }, 502);
    return privateJson({ data: data ?? null, error: null });
  } catch { return privateJson({ error: { code: "database_error" } }, 502); }
}
