"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SchoolBrand from "../brand/SchoolBrand";
import SchoolIcon from "../brand/SchoolIcon";
import MobileNavigation from "../brand/MobileNavigation";
import { NavigationRoleContext } from "./NavigationRole";
import { DialogProvider } from "./DialogProvider";
import { BackLink } from "./PlatformUI";
import { adminNavigation, backDestination, isCurrentDestination, navigationForRole, resolveNavigationRole } from "../../config/navigation.mjs";

// Navigation visibility only. Authorization remains enforced by the existing
// login flow and database policies; no student profile RPC contract is assumed.
async function loadNavigationClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return (await import("../../lib/supabase")).supabase;
}
function useNavigationRole() {
  const [account, setAccount] = useState({ userId: null, client: null, revision: 0 });
  const [adminCheck, setAdminCheck] = useState({ userId: null, verified: false, revision: -1 });
  useEffect(() => {
    let active = true;
    let subscription;
    loadNavigationClient().then(async (client) => {
      if (!client || !active) return;
      // Subscribe first. Ignore a stale getSession response if an auth event arrives.
      let changed = false;
      subscription = client.auth.onAuthStateChange((_event, session) => {
        changed = true;
        if (active) setAccount((current) => ({ userId: session?.user?.id || null, client, revision: current.revision + 1 }));
      }).data.subscription;
      const { data, error } = await client.auth.getSession();
      if (active && !changed && !error) setAccount((current) => ({ userId: data.session?.user?.id || null, client, revision: current.revision + 1 }));
    }).catch(() => { /* Public navigation remains usable on connection failure. */ });
    return () => { active = false; subscription?.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!account.userId || !account.client) return;
    let active = true;
    account.client.rpc("is_admin").then(({ data, error }) => {
      if (active) setAdminCheck({ userId: account.userId, verified: !error && data === true, revision: account.revision });
    }).catch(() => {
      if (active) setAdminCheck({ userId: account.userId, verified: false, revision: account.revision });
    });
    return () => { active = false; };
  }, [account]);
  return resolveNavigationRole(account, adminCheck);
}
export default function PlatformShell({ children }) {
  const pathname = usePathname() || "/";
  const role = useNavigationRole();
  const links = navigationForRole(role);
  const back = backDestination(pathname);
  return <div className="school-home platform-shell">
    <a className="school-skip" href="#main-content">انتقل إلى المحتوى</a>
    <header className="school-header">
      <div className="school-container school-header-inner"><SchoolBrand />
        <nav className="school-desktop-navigation" aria-label="التنقل الرئيسي">
          {links.filter((link) => !link.href.startsWith("/admin/") && !(pathname.startsWith("/admin") && link.href === "/admin")).map((link) => <Link key={link.href} href={link.href} aria-current={isCurrentDestination(link.href, pathname) ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <MobileNavigation key={pathname} links={links} pathname={pathname} role={role} />
      </div>
    </header>
    <NavigationRoleContext.Provider value={role}><DialogProvider key={pathname}>
      {role === "admin" && pathname.startsWith("/admin") && <nav className="school-container platform-admin-nav" aria-label="أقسام لوحة المعلم">
        {adminNavigation.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrentDestination(link.href, pathname) ? "page" : undefined}><SchoolIcon name={link.icon} size={18} />{link.label}</Link>)}
      </nav>}
      {back && <div className="school-container platform-back-row"><BackLink {...back} /></div>}
      {children}
    </DialogProvider></NavigationRoleContext.Provider>
    <footer className="school-footer"><div className="school-container platform-footer-inner">
      <span>مدارس الفكر التربوي</span><span>منصة الذكاء الاصطناعي · نتعلّم التقنية بوعي وإبداع</span>
      <small>للصفوف الأول إلى السادس</small>
    </div></footer>
  </div>;
}
