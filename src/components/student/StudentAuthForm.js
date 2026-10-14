"use client";
import { useState } from "react";
import { useStudentAccountRedirect } from "./useStudentAccountRedirect";
import { authMessage, loadStudentClient } from "../../lib/student/browser-client";
import { ActionLink, Button, Feedback, Input } from "../platform/PlatformUI";
import AccountPage from "./AccountPage";
import StudentStatus from "./StudentStatus";
import styles from "./accounts.module.css";
export default function StudentAuthForm({ register = false }) {
  const access = useStudentAccountRedirect();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState(""); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [sent, setSent] = useState(false);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    if (register && password !== repeat) { setMessage("كلمتا المرور غير متطابقتين."); return; }
    setBusy(true); setMessage("");
    try {
      const client = await loadStudentClient();
      if (!client) { setMessage("إعدادات الاتصال غير متاحة. يرجى مراجعة المدرسة."); return; }
      const credentials = { email: email.trim(), password };
      const result = register ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: new URL("/auth/confirm", window.location.origin).href } }) : await client.auth.signInWithPassword(credentials);
      if (result.error) { setMessage(authMessage(result.error)); return; }
      setPassword(""); setRepeat("");
      if (!result.data?.session?.access_token) {
        if (register) { setSent(true); setMessage("تحقق من بريدك لتأكيد الحساب إن كان التسجيل متاحًا. لا تشارك رسالة التأكيد أو كلمة مرورك."); }
        else setMessage("لم تُنشأ جلسة دخول. أكّد بريدك ثم حاول مجددًا.");
        return;
      }
      await access.refresh();
    } catch { setMessage("تعذر الاتصال. حاول مجددًا دون مشاركة بيانات دخولك."); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy) return; setBusy(true); setMessage("");
    try {
      const client = await loadStudentClient();
      if (!client) { setMessage("إعدادات الاتصال غير متاحة."); return; }
      const { error } = await client.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: new URL("/auth/confirm", window.location.origin).href } });
      setMessage(error ? authMessage(error) : "إذا كان الحساب ينتظر التأكيد، ستصلك رسالة جديدة. تحقق من البريد غير المرغوب فيه أيضًا.");
    } catch { setMessage("تعذر إرسال الرسالة. حاول لاحقًا."); }
    finally { setBusy(false); }
  }
  return <AccountPage title={register ? "إنشاء حساب طالب" : "دخول الطالب"} description={register ? "أنشئ حسابك، أكّد بريدك، ثم أكمل ملفك الدراسي." : "سجّل دخولك لمتابعة أنشطة صفك."}>
    {access.canSignOut && !busy ? <StudentStatus /> : <>
      {!sent && <form onSubmit={submit} className={styles.form} aria-busy={busy}>
        <div className={styles.field}><label htmlFor="student-email">البريد الإلكتروني</label><Input id="student-email" type="email" autoComplete="email" dir="ltr" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></div>
        <div className={styles.field}><label htmlFor="student-password">كلمة المرور</label><Input id="student-password" type="password" autoComplete={register ? "new-password" : "current-password"} dir="ltr" minLength={register ? 8 : undefined} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />{register && <small>8 أحرف على الأقل، ولا تشاركها مع أحد.</small>}</div>
        {register && <div className={styles.field}><label htmlFor="student-password-repeat">تأكيد كلمة المرور</label><Input id="student-password-repeat" type="password" autoComplete="new-password" dir="ltr" required maxLength={128} value={repeat} onChange={event => setRepeat(event.target.value)} disabled={busy} /></div>}
        {message && <Feedback tone="error">{message}</Feedback>}
        <Button type="submit" icon={busy ? "clock" : "arrow"} disabled={busy}>{busy ? "جارٍ المتابعة…" : register ? "إنشاء الحساب" : "تسجيل الدخول"}</Button>
      </form>}
      {sent && <div className={styles.stack}><Feedback>{message}</Feedback><Button variant="secondary" icon="clock" onClick={resend} disabled={busy}>إعادة إرسال رسالة التأكيد</Button></div>}
      <div className={styles.links}><span>{register ? "لديك حساب؟" : "تبدأ رحلتك معنا؟"}</span><ActionLink href={register ? "/student-login" : "/register"} variant="secondary">{register ? "دخول الطالب" : "إنشاء حساب طالب"}</ActionLink></div>
    </>}
  </AccountPage>;
}
