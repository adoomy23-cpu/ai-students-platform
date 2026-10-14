"use client";
import { useEffect, useState } from "react";
import { useAccess } from "../../components/platform/AuthProvider";
import { Button, EmptyState, Feedback, Input, Select } from "../../components/platform/PlatformUI";
import AccountPage from "../../components/student/AccountPage";
import StudentStatus from "../../components/student/StudentStatus";
import { requestStudent } from "../../lib/student/browser-client";
import styles from "../../components/student/accounts.module.css";
export default function CompleteProfilePage() {
  const access = useAccess();
  const [name, setName] = useState(""); const [gradeId, setGradeId] = useState(""); const [classroomChoice, setClassroomChoice] = useState("");
  const [options, setOptions] = useState(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const canRead = access.status === "authenticated" && access.role !== "admin";
  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    requestStudent("enrollment.options", {}, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (result.error) setMessage("تعذر قراءة الصفوف والفصول. حاول لاحقًا؛ لم تُحفظ أي بيانات.");
      else setOptions(result.data);
    });
    return () => controller.abort();
  }, [canRead, access.accountEpoch]);
  const classrooms = options?.classrooms?.filter(item => String(item.grade_id) === gradeId && item.is_active === true) || [];
  const classroomId = classrooms.some(item => String(item.id) === classroomChoice) ? classroomChoice : "";
  async function submit(event) {
    event.preventDefault();
    if (!options?.canSubmit || busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await requestStudent("enrollment.submit", { name: name.trim(), gradeId: Number(gradeId), classroomId: Number(classroomId) });
      // Kept closed until the existing register_student contract is inspected.
      // A successful response is not fabricated, and no direct INSERT fallback exists.
      if (result.error) setMessage("لم يُرسل الطلب. يجب التحقق من دالة التسجيل وصلاحياتها أولًا.");
      else access.refresh();
    } finally { setBusy(false); }
  }
  const hasProfile = ["approved", "pending", "suspended", "rejected"].includes(access.student?.state);
  return <AccountPage title="الملف الدراسي" description="اسمك وصفك وفصلك، ثم مراجعة المعلم." icon="pencil">
    {!canRead || hasProfile ? <StudentStatus /> : <div className={styles.stack}>
      <Feedback tone="warning">إرسال طلب الاعتماد غير متاح حتى نتحقق من تعريف دالة التسجيل الحالية وسياسات الوصول. لن نُنشئ ملفًا مكررًا أو نغيّر سجلًا موجودًا.</Feedback>
      {access.student?.state === "profile_unavailable" && <Feedback>تعذر إثبات غياب الملف؛ قد يكون مخفيًا بسبب الصلاحيات.</Feedback>}
      {!options && !message && <EmptyState loading>جارٍ قراءة الصفوف والفصول…</EmptyState>}
      <form className={styles.form} onSubmit={submit} aria-busy={busy}>
        <div className={styles.field}><label htmlFor="student-name">اسم الطالب</label><Input id="student-name" autoComplete="name" maxLength={100} required value={name} onChange={event => setName(event.target.value)} disabled={busy} /></div>
        <div className={styles.field}><label htmlFor="student-grade">الصف الدراسي</label><Select id="student-grade" value={gradeId} required disabled={!options || busy} onChange={event => { setGradeId(event.target.value); setClassroomChoice(""); }}><option value="">اختر الصف</option>{options?.grades?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
        <div className={styles.field}><label htmlFor="student-classroom">الفصل</label><Select id="student-classroom" value={classroomId} required disabled={!classrooms.length || busy} onChange={event => setClassroomChoice(event.target.value)}><option value="">اختر الفصل</option>{classrooms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
        {message && <Feedback tone="error">{message}</Feedback>}
        <Button type="submit" icon="check" disabled={!options?.canSubmit || !name.trim() || !classroomId || busy} aria-describedby="enrollment-unavailable">{busy ? "جارٍ الإرسال…" : "إرسال طلب الاعتماد"}</Button>
        <small id="enrollment-unavailable">الزر معطّل مؤقتًا لحماية البيانات حتى اكتمال التحقق من الربط.</small>
      </form>
      <Button variant="secondary" icon="clock" onClick={access.refresh}>إعادة التحقق من حسابي</Button>
    </div>}
  </AccountPage>;
}
