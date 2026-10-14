"use client";
import { useCallback, useEffect, useState } from "react";
import { requestAdmin } from "../../lib/admin/client";
import { Button, Card, EmptyState, Feedback, StatusBadge } from "../platform/PlatformUI";
export default function ApprovalRequests() {
  const [records, setRecords] = useState(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const receive = useCallback(result => {
    if (result.error || !Array.isArray(result.data)) setMessage("تعذر قراءة طلبات الاعتماد. تحقق من أعمدة الجدول وصلاحيات المدير.");
    else { setRecords(result.data); setMessage(""); }
  }, []);
  useEffect(() => {
    let active = true;
    requestAdmin("students.approvals", {}).then(result => { if (active) receive(result); }).catch(() => { if (active) setMessage("تعذر الاتصال لقراءة الطلبات."); });
    return () => { active = false; };
  }, [receive]);
  async function reload() {
    if (busy) return; setBusy(true);
    try { receive(await requestAdmin("students.approvals", {})); }
    finally { setBusy(false); }
  }
  const pending = records?.filter(item => item.approval_status === "pending") || [];
  return <Card>
    <div className="platform-heading"><div><h2>طلبات اعتماد الحسابات</h2><p>مراجعة الطلبات المرتبطة بحسابات الطلاب.</p></div><Button variant="secondary" icon="clock" onClick={reload} disabled={busy}>تحديث الطلبات</Button></div>
    <Feedback tone="warning">الاعتماد موقوف في هذه النسخة حتى يُراجع عقد الاعتماد وصلاحياته في Supabase. تفعيل الطالب في القائمة الحالية لا يغيّر حالة الاعتماد.</Feedback>
    {message ? <Feedback tone="error">{message}</Feedback> : records === null ? <EmptyState loading>جارٍ قراءة الطلبات…</EmptyState> : pending.length === 0 ? <EmptyState>لا توجد طلبات معلّقة ظاهرة لهذا الحساب.</EmptyState> : <div className="platform-grid">
      {pending.map(item => <Card key={item.id}><h3>{item.student_name}</h3><StatusBadge tone="warning">بانتظار الاعتماد</StatusBadge><p>الفصل رقم {item.classroom_id || "غير متاح"}</p><Button icon="check" disabled>اعتماد الحساب — يحتاج التحقق من الربط</Button></Card>)}
    </div>}
  </Card>;
}
