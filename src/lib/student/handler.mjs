import { authorizeRequest, privateJson } from "../auth/server-access.mjs";
import { readLimitedJson, sameSiteRequest } from "../admin/handler.mjs";
import { inspectOwnStudent, enrollmentContract } from "./profile.mjs";
const positiveId = (id) => Number.isSafeInteger(id) && id > 0;
const exact = (p, keys) => p && typeof p === "object" && !Array.isArray(p) && Object.keys(p).length === keys.length && keys.every(key => Object.hasOwn(p, key));
const errorResponse = (code, status) => privateJson({ error: { code } }, status);
export async function authorizeStudent(request, createUserClient) {
  const access = await authorizeRequest(request, createUserClient);
  if (access.status !== 200) return access;
  // Teaching access is independent; never impersonate a student automatically.
  if (access.role === "admin") return { status: 403, code: "student_required" };
  const student = await inspectOwnStudent(access.client, access.userId);
  if (student.state === "verification_failed" || student.state === "profile_unavailable") return { status: 503, code: student.state };
  if (student.state !== "approved") return { status: 403, code: student.state };
  return { ...access, student: student.profile };
}
export async function handleStudentRequest(request, createUserClient) {
  if (!sameSiteRequest(request)) return errorResponse("forbidden", 403);
  let body;
  try { body = await readLimitedJson(request); }
  catch (error) { return errorResponse("invalid_request", error.message === "too_large" ? 413 : 400); }
  if (!exact(body, ["action", "payload"]) || typeof body.action !== "string") return errorResponse("invalid_request", 400);
  if (body.action === "enrollment.options" || body.action === "enrollment.submit") {
    const access = await authorizeRequest(request, createUserClient);
    if (access.status !== 200) return errorResponse(access.code, access.status);
    if (access.role === "admin") return errorResponse("student_required", 403);
    // register_student arguments, return type and invariants are NOT available.
    // No guessed RPC or direct students INSERT/UPDATE is executed.
    if (body.action === "enrollment.submit") return errorResponse("contract_unverified", 503);
    if (!exact(body.payload, [])) return errorResponse("invalid_request", 400);
    try {
      const [grades, classrooms] = await Promise.all([
        access.client.from("grades").select("id,name").order("id"),
        access.client.from("classrooms").select("id,grade_id,name,is_active").eq("is_active", true).order("id"),
      ]);
      if (grades.error || classrooms.error || !Array.isArray(grades.data) || !Array.isArray(classrooms.data)) return errorResponse("database_error", 502);
      return privateJson({ data: { grades: grades.data, classrooms: classrooms.data, canSubmit: enrollmentContract.verified }, error: null });
    } catch { return errorResponse("database_error", 502); }
  }
  const validators = {
    "quiz.load": (p) => exact(p, ["id"]) && positiveId(p.id),
    "quiz.submit": (p) => exact(p, ["id", "answers"]) && positiveId(p.id) && p.answers && typeof p.answers === "object" && !Array.isArray(p.answers) && Object.keys(p.answers).length <= 500 && Object.entries(p.answers).every(([key, value]) => /^[1-9]\d*$/.test(key) && positiveId(Number(key)) && positiveId(value)),
    "challenge.load": (p) => exact(p, ["id"]) && positiveId(p.id),
    "challenge.submit": (p) => exact(p, ["id", "text", "imagePath", "filePath"]) && positiveId(p.id) && (p.text === null || (typeof p.text === "string" && p.text.length <= 32000)),
  };
  if (!Object.hasOwn(validators, body.action) || !validators[body.action](body.payload)) return errorResponse("invalid_request", 400);
  const access = await authorizeStudent(request, createUserClient);
  if (access.status !== 200) return errorResponse(access.code, access.status);
  const { client, student } = access;
  const p = body.payload;
  try {
    let result;
    if (body.action === "quiz.load") result = await client.rpc("get_quiz_for_student", { p_quiz_id: p.id });
    if (body.action === "quiz.submit") result = await client.rpc("submit_quiz_attempt", { p_quiz_id: p.id, p_student_id: student.id, p_answers: p.answers });
    if (body.action === "challenge.load") result = await client.from("challenges").select("*").eq("id", p.id).eq("status", "published").single();
    if (body.action === "challenge.submit") {
      const challenge = await client.from("challenges").select("id,allow_text,allow_image,allow_file").eq("id", p.id).eq("status", "published").single();
      if (challenge.error || !challenge.data) return errorResponse("database_error", 502);
      const prefix = `challenges/${p.id}/${student.id}/`;
      // Only server-generated paths under the authenticated student's folder.
      const validPath = (path) => path === null || (typeof path === "string" && path.startsWith(prefix) && /^[a-zA-Z0-9._-]+$/.test(path.slice(prefix.length)) && !path.slice(prefix.length).includes(".."));
      if (!validPath(p.imagePath) || !validPath(p.filePath)) return errorResponse("invalid_request", 400);
      const text = challenge.data.allow_text && p.text?.trim() ? p.text.trim() : null;
      const image = challenge.data.allow_image ? p.imagePath : null;
      const file = challenge.data.allow_file ? p.filePath : null;
      if (!text && !image && !file) return errorResponse("invalid_request", 400);
      result = await client.from("challenge_submissions").insert({ challenge_id: p.id, student_id: student.id, submission_text: text, image_url: image, file_url: file, status: "submitted" });
    }
    if (!result || result.error) return errorResponse("database_error", 502);
    return privateJson({ data: result.data ?? null, error: null });
  } catch { return errorResponse("database_error", 502); }
}
