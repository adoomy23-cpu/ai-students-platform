"use client";
import { useAccess } from "../platform/AuthProvider";
import { ActionLink, Button, EmptyState, Feedback, StatusBadge } from "../platform/PlatformUI";
import { studentMessages, canAccessStudent } from "../../lib/student/profile.mjs";
import StudentIdentity from "./StudentIdentity";
import styles from "./accounts.module.css";
export default function StudentStatus() {
  const access = useAccess();
  if (["loading", "verifying"].includes(access.status)) return <EmptyState loading>نتحقق من جلسة حسابك…</EmptyState>;
  if (access.role === "admin" && access.status === "authenticated") return <><Feedback>هذا حساب معلم. حسابات الطلاب مستقلة عن إدارة المنصة.</Feedback><ActionLink href="/admin">لوحة المعلم</ActionLink></>;
  if (["visitor", "expired"].includes(access.status)) return <><Feedback>سجّل دخول الطالب لعرض حالة حسابك.</Feedback><div className={styles.actions}><ActionLink href="/student-login">دخول الطالب</ActionLink><ActionLink href="/register" variant="secondary">إنشاء حساب</ActionLink></div></>;
  const state = access.student?.state;
  return <div className={styles.stack}>
    <StudentIdentity />
    {canAccessStudent(access) ? <><StatusBadge tone="success">حساب معتمد</StatusBadge><Feedback tone="success">أهلًا بك! يمكنك الآن بدء الأنشطة.</Feedback><ActionLink href="/quizzes">ابدأ رحلتك</ActionLink></> : <>
      {state === "pending" && <StatusBadge tone="warning">بانتظار الاعتماد</StatusBadge>}
      {["suspended", "rejected"].includes(state) && <StatusBadge tone="error">{state === "suspended" ? "حساب موقوف" : "طلب غير معتمد"}</StatusBadge>}
      <Feedback tone={state === "pending" || state === "missing" ? "info" : "error"}>{studentMessages[state] || "تعذر الاتصال أو التحقق من حالة حسابك. لن تُتاح وظائف الطلاب حتى ينجح التحقق."}</Feedback>
      <div className={styles.actions}>
        <Button icon="clock" onClick={access.refresh}>تحديث الحالة</Button>
        {["missing", "profile_unavailable"].includes(state) && <ActionLink href="/complete-profile" variant="secondary">الملف الدراسي</ActionLink>}
        {access.canSignOut && <Button variant="secondary" icon="logout" onClick={access.signOut} disabled={access.signingOut}>تسجيل الخروج</Button>}
      </div>
    </>}
  </div>;
}
