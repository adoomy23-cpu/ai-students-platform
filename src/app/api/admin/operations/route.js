import { createUserScopedClient } from "../../../../lib/auth/supabase-server";
import { handleAdminRequest } from "../../../../lib/admin/handler.mjs";
export const runtime = "nodejs";
export async function POST(request) { return handleAdminRequest(request, createUserScopedClient); }
