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
export function navigationForRole(role) {
  return role === "admin" ? [...publicNavigation, ...adminNavigation] :
    role === "visitor" ? [...publicNavigation, { href: "/login", label: "دخول المعلم", icon: "shield" }] : [...publicNavigation];
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
  return check.userId === account.userId && check.revision === account.revision && check.verified === true ? "admin" : "student";
}
