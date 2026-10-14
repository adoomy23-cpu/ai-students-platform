import { createUserScopedClient } from "../../../../lib/auth/supabase-server";
import { handleAccessRequest } from "../../../../lib/auth/server-access.mjs";
import { inspectOwnStudent } from "../../../../lib/student/profile.mjs";
export const runtime = "nodejs";
export async function GET(request) { return handleAccessRequest(request, (token) => createUserScopedClient(token, 12000), inspectOwnStudent); }
