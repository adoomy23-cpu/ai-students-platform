"use client";
import Link from "next/link";
import SchoolIcon from "../brand/SchoolIcon";
import { useNavigationRoleContext } from "../platform/NavigationRole";

export default function TeacherPanel() {
  const role = useNavigationRoleContext();
  if (role === "student") return null;
  return <section className="school-teacher-panel school-container" aria-labelledby="teacher-title">
    <span className="school-icon-tile school-tone-stone"><SchoolIcon name="teacher" size={27} /></span>
    <div><h2 id="teacher-title">وراء كل فكرة، معلّم يلهم.</h2><p>تابع المحتوى والاختبارات ونتائج الطلاب من لوحة الإدارة.</p></div>
    <Link href={role === "admin" ? "/admin" : "/login"} className="school-button school-button-outline">{role === "admin" ? "لوحة المعلم" : "دخول المعلم"}<SchoolIcon name="arrow" size={18} /></Link>
  </section>;
}
