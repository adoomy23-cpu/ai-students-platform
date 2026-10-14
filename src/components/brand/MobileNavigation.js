"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SchoolIcon from "./SchoolIcon";

const links = [
  { href: "#home", label: "الرئيسية", icon: "compass" },
  { href: "#explore", label: "تعلّم واستكشف", icon: "book" },
  { href: "/challenges", label: "التحديات", icon: "rocket" },
  { href: "#quizzes", label: "الاختبارات", icon: "check" },
  { href: "#honor", label: "لوحة الشرف", icon: "trophy" },
];

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="school-mobile-navigation">
      <button ref={toggleRef} type="button" className="school-menu-toggle" aria-expanded={open} aria-controls="school-mobile-menu" aria-label={open ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"} onClick={() => setOpen((value) => !value)}>
        <SchoolIcon name={open ? "close" : "menu"} />
      </button>
      <nav id="school-mobile-menu" className="school-mobile-menu" aria-label="قائمة التنقل على الجوال" hidden={!open}>
        <span className="school-menu-label">إلى أين تأخذك فكرتك؟</span>
        {links.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            <SchoolIcon name={link.icon} size={20} /><span>{link.label}</span><SchoolIcon name="chevron" size={16} />
          </Link>
        ))}
        <Link href="/login" className="school-menu-teacher" onClick={() => setOpen(false)}><SchoolIcon name="teacher" size={20} />دخول المعلم</Link>
      </nav>
    </div>
  );
}
