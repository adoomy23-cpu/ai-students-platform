"use client";
import { useStudentAccountRedirect } from "../../components/student/useStudentAccountRedirect";
import AccountPage from "../../components/student/AccountPage";
import StudentStatus from "../../components/student/StudentStatus";
export default function PendingApprovalPage() {
  useStudentAccountRedirect({ approvedOnly: true });
  return <AccountPage title="حالة حسابك" description="تابع اعتماد طلبك دون إنشاء حساب جديد." icon="clock"><StudentStatus /></AccountPage>;
}
