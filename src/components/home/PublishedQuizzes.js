"use client";
import { createElement as h, useEffect, useState } from "react";
import Link from "next/link";
import { readPublishedQuizzes } from "../../lib/published-quizzes.mjs";
import Icon from "../ui/Icon";
export default function PublishedQuizzes() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [state, setState] = useState(() => ({ status: configured ? "loading" : "unavailable", quizzes: [] }));
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!configured) return;
    let active = true;
    async function load() {
      try {
        const { supabase } = await import("../../lib/supabase");
        const result = await readPublishedQuizzes(supabase);
        if (active) setState(result);
      } catch {
        if (active) setState({ status: "error", quizzes: [] });
      }
    }
    load();
    return () => { active = false; };
  }, [configured, retry]);
  if (state.status === "ready") {
    return h("div", { className: "ph-quiz-grid" }, ...state.quizzes.map((quiz) =>
      h("article", { className: "ph-quiz-card", key: quiz.id },
        h("span", { className: "ph-icon-tile ph-tone-blue" }, h(Icon, { name: "check" })),
        h("span", { className: "ph-tag" }, "اختبار منشور"), h("h3", null, quiz.title),
        h("p", null, "اقرأ الأسئلة بهدوء، واجعل كل محاولة فرصة للتعلّم."),
        h(Link, { href: `/quiz/${quiz.id}`, className: "ph-text-link" }, "ابدأ الاختبار", h(Icon, { name: "arrow" })))));
  }
  const messages = {
    loading: ["نجهّز اختباراتك", "لحظات قليلة لعرض الاختبارات المتاحة."],
    empty: ["المغامرة القادمة تبدأ قريبًا", "لا توجد اختبارات منشورة الآن. استكشف المحتوى أو شارك في تحدٍّ."],
    unavailable: ["الاختبارات غير متاحة حاليًا", "يمكنك متابعة رحلتك في المحتوى والتحديات."],
    error: ["تعذّر تحميل الاختبارات", "حاول مرة أخرى بعد قليل، أو تابع استكشاف المحتوى."],
  };
  const [title, text] = messages[state.status];
  return h("div", { className: "ph-empty", role: "status", "aria-live": "polite", "aria-busy": state.status === "loading" },
    h("span", { className: "ph-icon-tile ph-tone-blue" }, h(Icon, { name: "spark" })),
    h("div", null, h("h3", null, title), h("p", null, text)),
    state.status === "error" ? h("button", { className: "ph-button ph-button-outline", type: "button", onClick: () => { setState({ status: "loading", quizzes: [] }); setRetry((value) => value + 1); } }, "إعادة المحاولة")
      : h(Link, { href: "/content", className: "ph-text-link" }, "استكشف المحتوى", h(Icon, { name: "arrow" })));
}
