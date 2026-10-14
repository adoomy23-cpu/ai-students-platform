"use client";
import { useEffect, useId, useRef, useState } from "react";
import SchoolIcon from "./SchoolIcon";
import NavigationGroups from "./NavigationGroups";
import { bindDisclosureDismissal } from "../../lib/disclosure.mjs";

export default function MobileNavigation({ groups, pathname, onSignOut, signingOut }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef(null);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    return bindDisclosureDismissal(document, {
      contains: (target) => rootRef.current?.contains(target),
      dismiss: () => setOpen(false),
      restoreFocus: () => toggleRef.current?.focus(),
    });
  }, [open]);
  return <div className="school-mobile-navigation" ref={rootRef} onBlur={(event) => {
    if (event.relatedTarget && !rootRef.current?.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={toggleRef} type="button" className="school-menu-toggle" aria-expanded={open}
      aria-controls={menuId} aria-label={open ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"} onClick={() => setOpen((value) => !value)}>
      <SchoolIcon name={open ? "close" : "menu"} />
    </button>
    <nav id={menuId} className="school-mobile-menu" aria-label="قائمة التنقل الرئيسية" hidden={!open}>
      <NavigationGroups groups={groups} pathname={pathname} onSelect={() => setOpen(false)} onSignOut={onSignOut} signingOut={signingOut} />
    </nav>
  </div>;
}
