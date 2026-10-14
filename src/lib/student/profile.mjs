// Only columns evidenced in the existing app and the project owner's schema
// description. Never guess an RPC envelope or accept a browser-supplied user ID.
export const enrollmentContract = Object.freeze({ verified: false });
const positiveId = (value) => Number.isSafeInteger(value) && value > 0;
const failed = (state) => ({ state, profile: null });
export function classifyStudent(row, userId) {
  if (!row || row.user_id !== userId || !positiveId(row.id)) return failed("verification_failed");
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
export async function inspectOwnStudent(client, userId, { selfVisibilityVerified = false } = {}) {
  try {
    const result = await client.from("students")
      .select("id,user_id,student_name,classroom_id,approval_status,is_active")
      .eq("user_id", userId).limit(2);
    if (result.error || !Array.isArray(result.data)) return failed("verification_failed");
    // An empty SELECT under unknown RLS can mean a hidden existing profile.
    // Production never labels it 'missing' until visibility is verified.
    if (!result.data.length) return failed(selfVisibilityVerified ? "missing" : "profile_unavailable");
    if (result.data.length !== 1) return failed("verification_failed");
    const student = classifyStudent(result.data[0], userId);
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
  profile_unavailable: "لم نتمكن من إثبات وجود ملفك الدراسي أو غيابه. قد تمنع صلاحيات قاعدة البيانات ظهوره؛ لن نُنشئ ملفًا مكررًا.",
  verification_failed: "تعذر التحقق من حالة حسابك. هذا لا يعني أن ملفك ناقص أو أن طلبك مرفوض.",
});
