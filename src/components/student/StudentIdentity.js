"use client";
import { useAccess } from "../platform/AuthProvider";
import SchoolIcon from "../brand/SchoolIcon";
export default function StudentIdentity({ compact = false }) {
  const access = useAccess();
  const profile = access.student?.profile;
  if (!profile) return null;
  return <div className={`student-identity ${compact ? "student-identity-compact" : ""}`}>
    <span className="student-identity-icon"><SchoolIcon name="users" size={20} /></span>
    <div><strong>{profile.name}</strong><span>{profile.grade || "الصف غير متاح"} · {profile.classroom ? `فصل ${profile.classroom}` : "الفصل غير متاح"}</span></div>
  </div>;
}
