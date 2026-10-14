"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SchoolIcon from "./SchoolIcon";
import { isCurrentDestination } from "../../config/navigation.mjs";

export default function MobileNavigation({ links, pathname, role }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handleKey(event) {
      if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
    }
    function handleOutside(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handleOutside);
    return () => { document.removeEventListener("keydown", handleKey); document.removeEventListener("pointerdown", handleOutside); };
  }, [open]);
  return <div className="school-mobile-navigation" ref={rootRef}>
    <button ref={toggleRef} type="button" className="school-menu-toggle" aria-expanded={open}
      aria-controls="school-mobile-menu" aria-label={open ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"} onClick={() => setOpen((value) => !value)}>
      <SchoolIcon name={open ? "close" : "menu"} />
    </button>
    <nav id="school-mobile-menu" className="school-mobile-menu" aria-label="قائمة التنقل الشاملة" hidden={!open}>
      <span className="school-menu-label">{role === "admin" ? "التعلّم وإدارة المنصة" : "رحلتك في عالم الذكاء الاصطناعي"}</span>
      {links.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrentDestination(link.href, pathname) ? "page" : undefined} onClick={() => setOpen(false)}>
        <SchoolIcon name={link.icon} size={20} /><span>{link.label}</span><SchoolIcon name="chevron" size={16} />
      </Link>)}
    </nav>
  </div>;
}
