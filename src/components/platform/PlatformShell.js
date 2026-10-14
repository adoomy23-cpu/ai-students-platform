"use client";
import { usePathname } from "next/navigation";
import SchoolBrand from "../brand/SchoolBrand";
import MobileNavigation from "../brand/MobileNavigation";
import NavigationGroups from "../brand/NavigationGroups";
import StudentIdentity from "../student/StudentIdentity";
import AuthProvider, { useAccess } from "./AuthProvider";
import { NavigationRoleContext } from "./NavigationRole";
import { DialogProvider } from "./DialogProvider";
import { BackLink, Button } from "./PlatformUI";
import { backDestination, navigationGroupsForAccess, canAccessAdmin } from "../../config/navigation.mjs";

function ShellContent({ children }) {
  const pathname = usePathname() || "/";
  const access = useAccess();
  const groups = navigationGroupsForAccess(access);
  const back = pathname.startsWith("/admin") && !canAccessAdmin(access) ? null : backDestination(pathname);
  return <div className="school-home platform-shell">
    <a className="school-skip" href={pathname.startsWith("/admin") && !canAccessAdmin(access) ? "#admin-access-status" : "#main-content"}>انتقل إلى المحتوى</a>
    <header className="school-header">
      <div className="school-container school-header-inner"><SchoolBrand />
        <nav className="school-desktop-navigation" aria-label="التنقل الرئيسي">
          <NavigationGroups groups={groups} pathname={pathname} onSignOut={access.signOut} signingOut={access.signingOut} />
        </nav>
        <MobileNavigation key={`${pathname}:${access.status}:${access.role || "none"}`} groups={groups} pathname={pathname} onSignOut={access.signOut} signingOut={access.signingOut} />
      </div>
    </header>
    <NavigationRoleContext.Provider value={access.role}><DialogProvider key={`${pathname}:${access.accountEpoch}`} scopeKey={`${access.accountEpoch}:${access.status}:${access.role || "none"}:${access.student?.state || "none"}`}>
      {["error", "expired", "unavailable"].includes(access.status) && <div className="school-container platform-session-notice" role="status">
        <span>{access.status === "expired" ? "انتهت الجلسة. سجّل الدخول مجددًا." : "تعذر التحقق من الجلسة. يمكنك تصفح الأقسام العامة."}</span>
        <Button variant="secondary" icon="clock" onClick={access.refresh}>إعادة التحقق</Button>
      </div>}
      {access.status === "authenticated" && access.student?.profile && <div className="school-container student-account-strip"><StudentIdentity compact /></div>}
      {back && <div className="school-container platform-back-row"><BackLink {...back} /></div>}
      {children}
    </DialogProvider></NavigationRoleContext.Provider>
    <footer className="school-footer"><div className="school-container platform-footer-inner">
      <span>مدارس الفكر التربوي</span><span>منصة الذكاء الاصطناعي · نتعلّم التقنية بوعي وإبداع</span>
      <small>للصفوف الأول إلى السادس</small>
    </div></footer>
  </div>;
}
export default function PlatformShell({ children }) { return <AuthProvider><ShellContent>{children}</ShellContent></AuthProvider>; }
