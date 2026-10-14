import { canAccessStudent } from "../lib/student/profile.mjs";
export const publicNavigation = [
  { href: "/", label: "الرئيسية", icon: "compass" },
  { href: "/content", label: "المحتوى التعليمي", icon: "book" },
  { href: "/quizzes", label: "الاختبارات", icon: "check" },
  { href: "/challenges", label: "التحديات", icon: "rocket" },
];
export const adminNavigation = [
  { href: "/admin", label: "لوحة المعلم", icon: "teacher" },
  { href: "/admin/students", label: "الطلاب", icon: "users" },
  { href: "/admin/classrooms", label: "الصفوف والفصول", icon: "book" },
  { href: "/admin/content", label: "إدارة المحتوى", icon: "pencil" },
  { href: "/admin/quizzes", label: "إدارة الاختبارات", icon: "check" },
  { href: "/admin/challenges", label: "التحديات المنشورة", icon: "rocket" },
  { href: "/admin/results", label: "النتائج", icon: "trophy" },
];
export const studentEntryNavigation = [
  { href: "/student-login", label: "دخول الطالب", icon: "users" },
  { href: "/register", label: "إنشاء حساب طالب", icon: "pencil" },
];
export function navigationForRole(role) {
  return role === "admin" ? [...adminNavigation] :
    role === "visitor" ? [...publicNavigation, ...studentEntryNavigation, { href: "/login", label: "دخول المعلم", icon: "shield" }] : [...publicNavigation];
}
export function canAccessAdmin(access) {
  return access.status === "authenticated" && access.role === "admin" && access.signingOut !== true;
}
export function navigationGroupsForAccess(access) {
  const administrator = canAccessAdmin(access);
  const groups = [{ id: "sections", label: administrator ? "إدارة المنصة" : "رحلة التعلّم", links: administrator ? [...adminNavigation] : [...publicNavigation] }];
  if (access.canSignOut) groups.push({ id: "account", label: "الحساب", links: [
    ...(!administrator && access.status === "authenticated" ? [{ href: canAccessStudent(access) || access.student?.state === "missing" ? "/complete-profile" : "/pending-approval", label: "حسابي", icon: "users" }] : []),
    ...(access.status === "expired" ? [...studentEntryNavigation, { href: "/login", label: "دخول المعلم", icon: "shield" }] : []),
    { action: "signOut", label: "تسجيل الخروج", icon: "logout" },
  ] });
  else if (!["loading", "verifying"].includes(access.status)) groups.push({ id: "account", label: "الدخول", links: [...studentEntryNavigation, { href: "/login", label: "دخول المعلم", icon: "shield" }] });
  return groups;
}
export function isCurrentDestination(href, pathname) {
  if (href.includes("#")) return false;
  if (href === "/" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
export function backDestination(pathname) {
  if (pathname === "/" || pathname === "/admin") return null;
  if (pathname.startsWith("/admin/quizzes/")) return { href: "/admin/quizzes", label: "العودة للاختبارات" };
  if (pathname.startsWith("/admin/")) return { href: "/admin", label: "العودة للوحة المعلم" };
  if (pathname.startsWith("/challenges/")) return { href: "/challenges", label: "العودة للتحديات" };
  if (pathname.startsWith("/quiz/")) return { href: "/quizzes", label: "العودة للاختبارات" };
  return { href: "/", label: "رجوع إلى المنصة" };
}

export function resolveNavigationRole(account, check) {
  if (!account.userId) return "visitor";
  return check.userId === account.userId && check.revision === account.revision && check.verified === true ? "admin" : null;
}
