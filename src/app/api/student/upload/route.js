import { createUserScopedClient } from "../../../../lib/auth/supabase-server";
import { handleStudentUpload } from "../../../../lib/student/upload.mjs";
export const runtime = "nodejs";
export async function POST(request) { return handleStudentUpload(request, (token) => createUserScopedClient(token, 40000)); }
