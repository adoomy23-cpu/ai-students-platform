const messages = {
  unauthenticated: "انتهت الجلسة. سجّل الدخول مجددًا.",
  forbidden: "هذا الحساب غير مخوّل لإدارة المنصة.",
  invalid_request: "تعذر تنفيذ الطلب. تحقق من البيانات المدخلة.",
  database_error: "تعذر تنفيذ العملية. حاول لاحقًا أو راجع صلاحيات قاعدة البيانات.",
};
export function safeAccessMessage(code) { return Object.hasOwn(messages, code) ? messages[code] : "تعذر الاتصال أو التحقق من الصلاحيات. حاول مرة أخرى."; }
export async function fetchAccountAccess(token, { signal, fetcher = fetch } = {}) {
  if (!token) return { status: "visitor", role: "visitor" };
  try {
    const response = await fetcher("/api/account/access", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) });
    if (response.status === 401) return { status: "expired", role: null };
    if (!response.ok) return { status: "error", role: null };
    const body = await response.json();
    if (body.authenticated !== true || !["admin", "student", null].includes(body.role)) return { status: "error", role: null };
    if (body.role === "student" && (body.student?.state !== "approved" || !Number.isSafeInteger(body.student.profile?.id) || body.student.profile.id <= 0)) return { status: "error", role: null };
    if (body.student && !["approved", "pending", "suspended", "rejected", "missing", "profile_unavailable", "verification_failed"].includes(body.student.state)) return { status: "error", role: null };
    if (["verification_failed", "profile_unavailable"].includes(body.student?.state)) return { status: "error", role: null, student: body.student };
    return { status: "authenticated", role: body.role, ...(body.student ? { student: body.student } : {}) };
  } catch { return { status: "error", role: null }; }
}
