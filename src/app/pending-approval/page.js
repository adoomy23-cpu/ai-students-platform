import AccountPage from "../../components/student/AccountPage";
import StudentStatus from "../../components/student/StudentStatus";
export default function PendingApprovalPage() { return <AccountPage title="حالة حسابك" description="تابع اعتماد طلبك دون إنشاء حساب جديد." icon="clock"><StudentStatus /></AccountPage>; }
