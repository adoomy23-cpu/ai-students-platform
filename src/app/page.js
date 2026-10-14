import { createElement as h } from "react";
import Link from "next/link";
import { platformIdentity, learningPaths } from "../config/platform.mjs";
import Icon from "../components/ui/Icon";
import RobotIllustration from "../components/home/RobotIllustration";
import PublishedQuizzes from "../components/home/PublishedQuizzes";

function Brand() {
  return h(Link, { href: "/", className: "ph-brand", "aria-label": "منصة الذكاء الاصطناعي، الرئيسية" },
    h("span", { className: "ph-brand-symbol", "aria-hidden": "true" }, h(Icon, { name: "spark" })),
    h("span", null, h("strong", null, platformIdentity.name), h("small", { lang: "en", dir: "ltr" }, platformIdentity.shortName)));
}
function NavLinks() {
  return [
    h("a", { key: "home", href: "#home", "aria-current": "page" }, "الرئيسية"),
    h("a", { key: "explore", href: "#explore" }, "تعلّم واستكشف"),
    h(Link, { key: "challenges", href: "/challenges" }, "التحديات"),
    h("a", { key: "quizzes", href: "#quizzes" }, "الاختبارات"),
    h("a", { key: "honor", href: "#honor" }, "لوحة الشرف"),
  ];
}
function SectionHeading({ eyebrow, title, text, id }) {
  return h("div", { className: "ph-section-heading" },
    h("span", { className: "ph-eyebrow" }, eyebrow), h("h2", { id }, title), h("p", null, text));
}
export default function Home() {
  return h("div", { className: "platform-home" },
    h("a", { className: "ph-skip", href: "#main-content" }, "انتقل إلى المحتوى"),
    h("div", { className: "ph-topline" }, h(Icon, { name: "spark" }), "مساحة للتعلّم والإبداع من الصف الأول إلى السادس"),
    h("header", { className: "ph-header" }, h("div", { className: "ph-container ph-header-inner" },
      h(Brand), h("nav", { className: "ph-desktop-nav", "aria-label": "التنقل الرئيسي" }, h(NavLinks)),
      h(Link, { href: "/login", className: "ph-button ph-button-navy ph-teacher-link" }, "دخول المعلم", h(Icon, { name: "arrow" })),
      h("details", { className: "ph-mobile-nav" },
        h("summary", { "aria-label": "قائمة التنقل" }, h(Icon, { name: "menu" }), h("span", null, "القائمة")),
        h("nav", { "aria-label": "التنقل على الجوال" }, h(NavLinks), h(Link, { href: "/login" }, "دخول المعلم"))))),
    h("main", { id: "main-content" },
      h("section", { id: "home", className: "ph-hero ph-container", "aria-labelledby": "hero-title" },
        h("div", { className: "ph-hero-copy" },
          h("span", { className: "ph-pill" }, h("span", { className: "ph-dot" }), "أفكار صغيرة. مستقبل كبير."),
          h("h1", { id: "hero-title" }, "فضولك اليوم،", h("br"), h("span", null, "إبداعك غدًا.")),
          h("p", { className: "ph-hero-description" }, "اكتشف عالم الذكاء الاصطناعي بطريقة ممتعة. تعلّم، جرّب، وتحدَّ نفسك… فكل فكرة مميزة تبدأ بسؤال!"),
          h("div", { className: "ph-hero-actions" },
            h("a", { href: "#explore", className: "ph-button ph-button-blue" }, "ابدأ رحلة التعلّم", h(Icon, { name: "arrow" })),
            h(Link, { href: "/challenges", className: "ph-button ph-button-outline" }, h(Icon, { name: "rocket" }), "استكشف التحديات")),
          h("div", { className: "ph-hero-note" }, h(Icon, { name: "shield" }), "نتعلّم التقنية بوعي، ونستخدمها بإبداع")),
        h("div", { className: "ph-hero-art" }, h(RobotIllustration),
          h("div", { className: "ph-float ph-float-top" }, h("span", { className: "ph-icon-tile ph-tone-orange" }, h(Icon, { name: "rocket" })), h("div", null, h("strong", null, "كل فكرة تستحق التجربة"), h("small", null, "أطلق خيالك"))),
          h("div", { className: "ph-float ph-float-bottom" }, h("span", { className: "ph-icon-tile ph-tone-blue" }, h(Icon, { name: "spark" })), h("div", null, h("strong", null, "أنت بطل رحلتك"), h("small", null, "تعلّم بطريقتك"))))),
      h("section", { className: "ph-values ph-container", "aria-label": "رحلتك في المنصة" },
        ...[{ icon: "book", title: "تعلّم ببساطة", text: "دروس وأفكار قريبة من عالمك" }, { icon: "rocket", title: "جرّب بشجاعة", text: "تحديات تفتح باب الإبداع" }, { icon: "trophy", title: "احتفل بتقدّمك", text: "كل خطوة إنجاز يستحق الفخر" }].map((item) =>
          h("div", { className: "ph-value", key: item.title }, h(Icon, { name: item.icon }), h("div", null, h("strong", null, item.title), h("span", null, item.text))))),
      h("section", { id: "explore", className: "ph-section ph-container", "aria-labelledby": "explore-title" },
        h(SectionHeading, { eyebrow: "عالم من الاكتشاف", title: "ماذا تريد أن تجرّب اليوم؟", text: "اختر بداية رحلتك، واترك فضولك يقودك إلى شيء جديد.", id: "explore-title" }),
        h("div", { className: "ph-path-grid" }, ...learningPaths.map((path, index) =>
          h("article", { className: "ph-path-card ph-path-" + path.tone, key: path.title },
            h("div", { className: "ph-card-top" }, h("span", { className: "ph-icon-tile ph-tone-" + path.tone }, h(Icon, { name: path.icon })), h("span", { className: "ph-card-index", "aria-hidden": "true" }, "0" + (index + 1))),
            h("h3", null, path.title), h("p", null, path.text),
            h(Link, { href: path.href, className: "ph-text-link" }, path.label, h(Icon, { name: "arrow" }))))),
        h("div", { className: "ph-learning-note" }, h(Icon, { name: "play" }), h("p", null, "تحب التعلّم بالمشاهدة؟ ", h(Link, { href: "/content" }, "استكشف الفيديوهات والمحتوى التعليمي")))),
      h("section", { id: "quizzes", className: "ph-quizzes-section", "aria-labelledby": "quizzes-title" }, h("div", { className: "ph-container" },
        h(SectionHeading, { eyebrow: "خطوة جديدة في رحلتك", title: "جاهز لتحدّي معلوماتك؟", text: "اختبارات منشورة تساعدك على اكتشاف ما تعلّمته.", id: "quizzes-title" }), h(PublishedQuizzes))),
      h("section", { className: "ph-section ph-container ph-community", "aria-label": "أعمال الطلاب ولوحة الشرف" },
        h("article", { id: "student-work", className: "ph-work-card" },
          h("span", { className: "ph-eyebrow" }, "أفكار تصنع الفرق"), h("h2", null, "مساحة لإبداعك"),
          h("p", null, "ارسم، اكتب، وابتكر. يمكنك إرسال عملك من داخل التحديات المتاحة."),
          h(Link, { href: "/challenges", className: "ph-text-link" }, "شارك في تحدٍّ", h(Icon, { name: "arrow" })),
          h("div", { className: "ph-work-illustration", "aria-hidden": "true" }, h(Icon, { name: "pencil" }), h(Icon, { name: "spark" }))),
        h("article", { id: "honor", className: "ph-honor-card" },
          h("span", { className: "ph-eyebrow" }, "نجوم المنصة"), h("h2", null, "كل إبداع يستحق التقدير"),
          h("p", null, "مساحة مخصصة للاحتفاء بالأعمال المميزة. عرض أعمال الطلاب المعتمدة سيُتاح في مرحلة قادمة."),
          h("span", { className: "ph-coming-soon" }, "لوحة الشرف قريبًا"), h(Icon, { name: "trophy", className: "ph-honor-trophy" }))),
      h("section", { className: "ph-teacher-section ph-container", "aria-labelledby": "teacher-title" },
        h("span", { className: "ph-icon-tile ph-tone-blue" }, h(Icon, { name: "book" })),
        h("div", null, h("h2", { id: "teacher-title" }, "للمعلم… مساحة تقود فيها الإبداع"), h("p", null, "تابع محتوى المنصة والاختبارات ونتائج الطلاب من لوحة الإدارة.")),
        h(Link, { href: "/login", className: "ph-button ph-button-navy" }, "دخول المعلم", h(Icon, { name: "arrow" })))),
    h("footer", { className: "ph-footer" }, h("div", { className: "ph-container ph-footer-inner" },
      h("div", null, h(Brand), h("p", null, platformIdentity.tagline)),
      h("nav", { "aria-label": "روابط التذييل" }, h(Link, { href: "/content" }, "المحتوى التعليمي"), h(Link, { href: "/challenges" }, "التحديات"), h(Link, { href: "/login" }, "دخول المعلم")),
      h("small", null, "منصة تعليمية لصناعة جيل يتعلّم التقنية بوعي وإبداع"))));
}

