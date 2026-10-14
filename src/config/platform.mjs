// Presentation defaults. Persisted branding awaits a verified Supabase contract.
export const platformIdentity = Object.freeze({
  name: "منصة الذكاء الاصطناعي",
  shortName: "AI Students",
  schoolName: "مدارس الفكر التربوية",
  tagline: "نتعلّم. نجرّب. نبتكر.",
});
export const learningPaths = Object.freeze([
  { icon: "book", title: "تعلّم واستكشف", text: "دروس وفيديوهات تقرّب إليك الأفكار الكبيرة، بخطوات بسيطة.", href: "/content", label: "استكشف المحتوى", tone: "gold" },
  { icon: "rocket", title: "جرّب فكرتك", text: "تحديات تفتح باب الخيال. حوّل ما تعلّمته إلى عمل من إبداعك.", href: "/challenges", label: "شاهد التحديات", tone: "copper" },
  { icon: "spark", title: "اختبر معرفتك", text: "أسئلة تساعدك على اكتشاف ما تعلّمته. كل محاولة بداية جديدة.", href: "#quizzes", label: "استكشف الاختبارات", tone: "stone" },
]);
