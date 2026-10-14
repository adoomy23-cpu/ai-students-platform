"use client";
import { Activity, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "../platform/AuthProvider";
import { canAccessStudent, studentDestination } from "../../lib/student/profile.mjs";
import AccountPage from "./AccountPage";
import StudentStatus from "./StudentStatus";
export default function StudentBoundary({ children }) {
  const access = useAccess();
  const router = useRouter();
  const allowed = canAccessStudent(access);
  const destination = studentDestination(access);
  useEffect(() => {
    if (!allowed && destination && destination !== "/admin") router.replace(destination);
  }, [allowed, destination, router]);
  const retain = allowed || (access.retainStudent && ["verifying", "error"].includes(access.status) && !access.signingOut);
  return <>
    {retain && <Activity key={access.accountEpoch} mode={allowed ? "visible" : "hidden"}>{children}</Activity>}
    {!allowed && <AccountPage title="حساب الطالب" description="الأنشطة متاحة للحسابات المعتمدة فقط." icon="shield"><StudentStatus /></AccountPage>}
  </>;
}
