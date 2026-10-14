// Only columns evidenced in the existing app and the project owner's schema
// description. Never guess an RPC envelope or accept a browser-supplied user ID.
export const enrollmentContract = Object.freeze({ verified: false });
const positiveId = (value) => Number.isSafeInteger(value) && value > 0;
const failed = (state) => ({ state, profile: null });
export function classifyStudent(row, userId) {
  if (typeof userId !== "string" || !userId || !row || row.user_id !== userId || !positiveId(row.id)) return failed("verification_failed");
  if (typeof row.approval_status !== "string" || typeof row.is_active !== "boolean") return failed("verification_failed");
  // Unknown status labels never grant access. These labels must be checked
  // against the live constraints/enum before account restoration is approved.
  let state;
  if (row.approval_status === "approved") state = row.is_active ? "approved" : "suspended";
  else if (row.approval_status === "pending") state = "pending";
  else if (["suspended", "rejected"].includes(row.approval_status)) state = row.approval_status;
  else return failed("verification_failed");
  if (typeof row.student_name !== "string" || !row.student_name.trim()) return failed("verification_failed");
  return { state, profile: { id: row.id, name: row.student_name, classroomId: row.classroom_id, grade: null, classroom: null } };
}
// The no-argument function and authenticated EXECUTE/SECURITY DEFINER scope
// were confirmed by the project owner. Its full output contract is still needed.
// Validate the returned value at runtime; never invent aliases or JSON wrappers.
export async function inspectOwnStudent(client, userId, { emptyMeansMissingVerified = false } = {}) {
  try {
    const result = await client.rpc("get_my_student_profile");
    if (result.error) return failed("verification_failed");
    if (result.data === null || (Array.isArray(result.data) && result.data.length === 0)) {
      // A function may filter pending/stopped records or use an INNER JOIN.
      // Only its complete definition can establish that empty means absent.
      return failed(emptyMeansMissingVerified ? "missing" : "profile_unavailable");
    }
    const rows = Array.isArray(result.data) ? result.data : [result.data];
    if (rows.length !== 1) return failed("verification_failed");
    // Require the actual, known student columns and matching owner. A differently
    // shaped RPC result fails closed pending its verified field mapping.
    const student = classifyStudent(rows[0], userId);
    if (!student.profile || !positiveId(student.profile.classroomId)) return student;
    try {
    const classroom = await client.from("classrooms").select("id,name,grade_id").eq("id", student.profile.classroomId).maybeSingle();
    // Location display must never override verified approval or send an
    // approved student to /complete-profile on a failed location query.
    if (classroom.error || !classroom.data || classroom.data.id !== student.profile.classroomId) return student;
    student.profile.classroom = typeof classroom.data.name === "string" ? classroom.data.name : null;
    if (positiveId(classroom.data.grade_id)) {
      const grade = await client.from("grades").select("id,name").eq("id", classroom.data.grade_id).maybeSingle();
      if (!grade.error && grade.data?.id === classroom.data.grade_id && typeof grade.data.name === "string") student.profile.grade = grade.data.name;
    }
    } catch { /* Location lookup failures do not change approval. */ }
    return student;
  } catch { return failed("verification_failed"); }
}
export function canAccessStudent(access) {
  return access.status === "authenticated" && access.role === "student" && access.student?.state === "approved" && positiveId(access.student.profile?.id) && !access.signingOut;
}
export function studentDestination(access) {
  if (access.status === "authenticated" && access.role === "admin") return "/admin";
  if (canAccessStudent(access)) return "/quizzes";
  if (access.status === "visitor" || access.status === "expired") return "/student-login";
  if (access.status !== "authenticated") return null;
  if (access.student?.state === "missing") return "/complete-profile";
  if (["pending", "suspended", "rejected"].includes(access.student?.state)) return "/pending-approval";
  return null;
}
export const studentMessages = Object.freeze({
  pending: "طلبك بانتظار مراجعة المعلم. ستُتاح الأنشطة بعد اعتماد حسابك.",
  suspended: "حسابك موقوف حاليًا. تواصل مع معلمك قبل متابعة الأنشطة.",
  rejected: "لم يُعتمد طلبك. تواصل مع معلمك لمراجعة البيانات.",
  missing: "أكمل ملفك الدراسي وأرسل طلب الاعتماد.",
  profile_unavailable: "أعادت دالة الملف الدراسي نتيجة فارغة ولم نتأكد من دلالتها. أعد المحاولة أو تواصل مع معلمك؛ لن نُنشئ ملفًا مكررًا.",
  verification_failed: "تعذر التحقق من حالة حسابك. هذا لا يعني أن ملفك ناقص أو أن طلبك مرفوض.",
});
