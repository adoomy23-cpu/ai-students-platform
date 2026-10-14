// Server-side authorization, injected clients allow offline security tests.
// Never return the JWT, user record, email, or database diagnostic text.
export async function authorizeRequest(request, createUserClient) {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  if (!match || match[1].length > 16384) return { status: 401, code: "unauthenticated" };
  try {
    const client = createUserClient(match[1]);
    if (!client) return { status: 503, code: "unavailable" };
    const { data, error } = await client.auth.getUser(match[1]);
    if (error) {
      const denied = [400, 401, 403].includes(error.status);
      return { status: denied ? 401 : 503, code: denied ? "unauthenticated" : "verification_failed" };
    }
    if (typeof data?.user?.id !== "string" || !data.user.id) return { status: 401, code: "unauthenticated" };
    const check = await client.rpc("is_admin");
    if (check.error || typeof check.data !== "boolean") return { status: 503, code: "verification_failed" };
    return { status: 200, role: check.data === true ? "admin" : null, client };
  } catch {
    return { status: 503, code: "verification_failed" };
  }
}
export function privateJson(body, status = 200) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0",
    "Vary": "Authorization", "X-Content-Type-Options": "nosniff",
  } });
}
export async function handleAccessRequest(request, createUserClient) {
  const access = await authorizeRequest(request, createUserClient);
  if (access.status !== 200) return privateJson({ error: { code: access.code } }, access.status);
  // Non-admin does not prove student approval. That contract is not available.
  return privateJson({ role: access.role, authenticated: true });
}
