// Presentation defaults. Persisted branding awaits a verified Supabase contract.
export const platformIdentity = Object.freeze({
  name: "منصة الذكاء الاصطناعي",
  shortName: "AI Students",
  tagline: "نتعلّم اليوم، ونبتكر الغد",
});
export const learningPaths = Object.freeze([
  { icon: "book", title: "تعلّم واستكشف", text: "أفكار كبيرة، بخطوات صغيرة. اكتشف الدروس والفيديوهات والأنشطة التعليمية.", href: "/content", label: "استكشف المحتوى", tone: "blue" },
  { icon: "rocket", title: "تحدَّ نفسك", text: "حوّل فكرتك إلى إبداع، وشارك في تحديات الذكاء الاصطناعي.", href: "/challenges", label: "شاهد التحديات", tone: "orange" },
  { icon: "spark", title: "اختبر ما تعلّمت", text: "كل سؤال فرصة جديدة للتعلّم. اكتشف الاختبارات المنشورة أدناه.", href: "#quizzes", label: "استكشف الاختبارات", tone: "navy" },
]);
