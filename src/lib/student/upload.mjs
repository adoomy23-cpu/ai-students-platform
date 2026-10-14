import { privateJson } from "../auth/server-access.mjs";
import { sameSiteRequest } from "../admin/handler.mjs";
import { authorizeStudent } from "./handler.mjs";
const limit = 10 * 1024 * 1024;
const errorResponse = (code, status) => privateJson({ error: { code } }, status);
export async function handleStudentUpload(request, createUserClient, makeId = () => crypto.randomUUID()) {
  if (!sameSiteRequest(request)) return errorResponse("forbidden", 403);
  const access = await authorizeStudent(request, createUserClient);
  if (access.status !== 200) return errorResponse(access.code, access.status);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) return errorResponse("invalid_request", 400);
  const reader = request.body?.getReader();
  if (!reader) return errorResponse("invalid_request", 400);
  let size = 0; const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit + 65536) { await reader.cancel(); return errorResponse("file_too_large", 413); }
      chunks.push(value);
    }
  } catch { return errorResponse("invalid_request", 400); }
  finally { reader.releaseLock(); }
  try {
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") } }).formData();
    if ([...form.keys()].length !== 3) return errorResponse("invalid_request", 400);
    const id = Number(form.get("challengeId")); const kind = form.get("kind"); const file = form.get("file");
    if (!Number.isSafeInteger(id) || id <= 0 || !["image", "file"].includes(kind) || !(file instanceof File) || file.size <= 0 || file.size > limit) return errorResponse("invalid_request", 400);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const images = { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"], "image/gif": ["gif"] };
    const allowedExt = ["pdf", "txt", "doc", "docx", "ppt", "pptx", "xlsx", "zip", "sb3"];
    if (kind === "image" ? !Object.hasOwn(images, file.type) || !images[file.type].includes(ext) : !allowedExt.includes(ext)) return errorResponse("invalid_file", 400);
    const { client, student } = access;
    const challenge = await client.from("challenges").select("id,allow_image,allow_file").eq("id", id).eq("status", "published").single();
    if (challenge.error || !challenge.data || challenge.data[kind === "image" ? "allow_image" : "allow_file"] !== true) return errorResponse("forbidden", 403);
    const path = `challenges/${id}/${student.id}/${makeId()}-${kind}.${ext}`;
    const result = await client.storage.from("student-private").upload(path, file, { cacheControl: "3600", upsert: false });
    if (result.error) return errorResponse("database_error", 502);
    return privateJson({ data: { path }, error: null });
  } catch { return errorResponse("database_error", 502); }
}
