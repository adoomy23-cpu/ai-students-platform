"use client";
import { Activity } from "react";
import { useAccess } from "./AuthProvider";
import { ActionLink, Button, EmptyState, Feedback, PageSurface } from "./PlatformUI";
import { canAccessAdmin } from "../../config/navigation.mjs";

export default function AdminBoundary({ children }) {
  const access = useAccess();
  const allowed = canAccessAdmin(access);
  const retain = allowed || (access.retainAdmin && ["verifying", "error"].includes(access.status) && !access.signingOut);
  return <>
    {retain && <Activity key={access.accountEpoch} mode={allowed ? "visible" : "hidden"}>{children}</Activity>}
    {!allowed && <PageSurface id="admin-access-status" className="platform-access-page">
    <div className="platform-access-card">
      {["loading", "verifying"].includes(access.status) ? <EmptyState loading>نتحقق من صلاحية الدخول إلى لوحة المعلم…</EmptyState> :
        <><Feedback tone="error">{["error", "unavailable"].includes(access.status) ? "تعذر التحقق من الصلاحيات. أدوات الإدارة محجوبة حتى ينجح التحقق." : access.status === "authenticated" ? "هذا الحساب غير مخوّل لدخول لوحة الإدارة." : "سجّل دخول المعلم للوصول إلى لوحة الإدارة."}</Feedback>
        <div className="platform-access-actions"><ActionLink href="/login" variant="secondary">دخول المعلم</ActionLink><Button onClick={access.refresh} icon="clock">إعادة التحقق</Button></div></>}
    </div>
  </PageSurface>}
  </>;
}
