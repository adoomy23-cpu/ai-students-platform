import { createUserScopedClient } from "../../../../lib/auth/supabase-server";
import { handleStudentRequest } from "../../../../lib/student/handler.mjs";
export const runtime = "nodejs";
export async function POST(request) { return handleStudentRequest(request, createUserScopedClient); }
