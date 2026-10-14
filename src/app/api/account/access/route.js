import { createUserScopedClient } from "../../../../lib/auth/supabase-server";
import { handleAccessRequest } from "../../../../lib/auth/server-access.mjs";
export const runtime = "nodejs";
export async function GET(request) { return handleAccessRequest(request, (token) => createUserScopedClient(token, 12000)); }
