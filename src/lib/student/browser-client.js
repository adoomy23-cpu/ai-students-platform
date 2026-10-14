export async function loadStudentClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return (await import("../supabase")).supabase;
}
export function authMessage(error) {
  if (error?.code === "email_not_confirmed") return "أكّد بريدك الإلكتروني أولًا باستخدام الرسالة المرسلة إليك.";
  if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(error?.code)) return "انتظر قليلًا قبل إعادة المحاولة.";
  if (error?.code === "weak_password") return "اختر كلمة مرور أقوى توافق متطلبات المدرسة.";
  return "تعذر إكمال الطلب. تحقق من بياناتك واتصالك ثم حاول مجددًا.";
}
export async function requestStudent(action, payload = {}, { signal } = {}) {
  try {
    const client = await loadStudentClient();
    if (!client) return { data: null, error: { code: "unavailable" } };
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return { data: null, error: { code: "unauthenticated" } };
    const response = await fetch("/api/student/operations", { method: "POST", cache: "no-store", headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000) });
    const body = await response.json();
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event("alfikr:access-invalidated"));
    return response.ok ? body : { data: null, error: body.error || { code: "verification_failed" } };
  } catch { return { data: null, error: { code: "verification_failed" } }; }
}
export async function uploadStudentFile(challengeId, kind, file) {
  try {
    const client = await loadStudentClient();
    if (!client) return { error: true };
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token) return { error: true };
    const form = new FormData();
    form.set("challengeId", String(challengeId)); form.set("kind", kind); form.set("file", file);
    const response = await fetch("/api/student/upload", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` }, body: form, signal: AbortSignal.timeout(45000), cache: "no-store" });
    if (response.status === 401 || response.status === 403) window.dispatchEvent(new Event("alfikr:access-invalidated"));
    return response.ok ? await response.json() : { error: true };
  } catch { return { error: true }; }
}
