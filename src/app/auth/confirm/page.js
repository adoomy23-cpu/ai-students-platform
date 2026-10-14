"use client";
import { useStudentAccountRedirect } from "../../../components/student/useStudentAccountRedirect";
import AccountPage from "../../../components/student/AccountPage";
import StudentStatus from "../../../components/student/StudentStatus";
import { ActionLink, Feedback } from "../../../components/platform/PlatformUI";
export default function ConfirmAccountPage() {
  const access = useStudentAccountRedirect();
  // Existing Supabase browser client uses its standard implicit email-link
  // session detection. Never print, log or pass the URL's tokens to the UI.
  return <AccountPage title="تأكيد البريد" description="نتحقق من جلسة حسابك بعد فتح رابط التأكيد." icon="shield">
    <StudentStatus />
    {access.status === "visitor" && <Feedback>إذا انتهى الرابط أو فُتح في جهاز آخر، سجّل دخولك بعد تأكيد البريد.</Feedback>}
    <ActionLink href="/student-login" variant="secondary">العودة لدخول الطالب</ActionLink>
  </AccountPage>;
}
