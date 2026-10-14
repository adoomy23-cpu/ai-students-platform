// Presentation defaults. Persisted branding awaits a verified Supabase contract.
export const platformIdentity = Object.freeze({
  name: "منصة الذكاء الاصطناعي",
  shortName: "AI Students",
  schoolName: "مدارس الفكر التربوي",
  tagline: "نتعلّم. نجرّب. نبتكر.",
});
export const learningPaths = Object.freeze([
  { icon: "book", title: "تعلّم", text: "دروس وفيديوهات", href: "/content", tone: "gold" },
  { icon: "rocket", title: "تحدَّ", text: "جرّب وشارك", href: "/challenges", tone: "copper" },
  { icon: "check", title: "اختبر", text: "راجع معلوماتك", href: "/quizzes", tone: "stone" },
]);
