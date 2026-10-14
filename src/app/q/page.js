"use client";

import SchoolIcon from "../../components/brand/SchoolIcon";
import { Button, Card, EmptyState, Feedback, PageSurface } from "../../components/platform/PlatformUI";

import { useEffect, useState } from "react";
import { requestStudent } from "../../lib/student/browser-client";


export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loadedRevision, setLoadedRevision] = useState(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    requestStudent("practice.load", {}, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      setLoadedRevision(revision);
      if (result.error || !Array.isArray(result.data?.questions) || result.data.questions.length === 0) setMessage("تعذر تحميل الاختبار التجريبي. أعد المحاولة.");
      else { setQuestions(result.data.questions); setMessage(""); }
    }).catch(() => {
      if (controller.signal.aborted) return;
      setLoadedRevision(revision);
      setMessage("تعذر تحميل الاختبار التجريبي. أعد المحاولة.");
    });
    return () => controller.abort();
  }, [revision]);
  const question = questions[current];

  async function nextQuestion() {
    if (selected === null || sending) return;
    const nextAnswers = [...answers, selected];
    if (current < questions.length - 1) {
      setAnswers(nextAnswers);
      setCurrent(prev => prev + 1);
      setSelected(null);
      return;
    }
    setSending(true); setMessage("");
    try {
      const result = await requestStudent("practice.submit", { answers: nextAnswers });
      if (result.error || !Number.isFinite(result.data?.score)) { setMessage("تعذر التحقق من النتيجة. أعد المحاولة."); return; }
      setScore(result.data.score);
      setFinished(true);
    } finally { setSending(false); }
  }

  function restartQuiz() {
    setAnswers([]);
    setMessage("");
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (loadedRevision !== revision) return <PageSurface style={styles.page}><EmptyState loading>جارٍ تحميل الاختبار…</EmptyState></PageSurface>;
  if (!question) return <PageSurface style={styles.page}><Feedback tone="error">{message || "الاختبار غير متاح."}</Feedback><Button icon="clock" onClick={() => setRevision(value => value + 1)}>إعادة المحاولة</Button></PageSurface>;
  if (finished) {

    return (
    <PageSurface style={styles.page}>
    <Card as="div" style={styles.card}>
    <div style={styles.emoji}><SchoolIcon name="trophy" size={22} /></div>
    <h1 style={styles.title}>أحسنت!</h1>

    <p style={styles.text}>لقد أكملت الاختبار بنجاح</p>

    <div style={styles.score}>
    نتيجتك
    <strong style={styles.scoreNumber}>
    {score} / {questions.length}
    </strong>
    </div>

    <Button variant="primary" icon="clock" style={styles.button} onClick={restartQuiz}>
    <SchoolIcon name="clock" size={22} /> أعد الاختبار
    </Button>


    </Card>
    </PageSurface>
  );
  }

  return (
  <PageSurface style={styles.page}>
  <div style={styles.wrapper}>
  <div className="platform-heading" style={styles.header}>
  <span><SchoolIcon name="spark" size={22} /></span>
  <h1 className="platform-heading" style={styles.headerTitle}>
  اختبار الذكاء الاصطناعي التجريبي
  </h1>
  <p style={styles.subtitle}>
  اختر الإجابة الصحيحة واختبر معلوماتك
  </p>
  </div>

  <div style={styles.progressText}>
  السؤال {current + 1} من {questions.length}
  </div>

  <div style={styles.progress}>
  <div
  style={{
      ...styles.progressBar,
      width: `${((current + 1) / questions.length) * 100}%`,
    }}
  />
  </div>

  <Card as="div" style={styles.card}>
  <h2 style={styles.question}>{question.question}</h2>

  <div className="platform-grid" style={styles.options}>
  {question.options.map((option, index) => (
    <Button variant="choice" aria-pressed={selected === index}
    key={index}
    onClick={() => setSelected(index)}
    style={{
        ...styles.option,
        ...(selected === index
        ? styles.selectedOption
        : {}),
      }}
    >
    {option}
    </Button>
  ))}
  </div>

  {message && <Feedback tone="error">{message}</Feedback>}
  <Button variant="primary"
  onClick={nextQuestion}
  disabled={selected === null || sending}
  style={{
      ...styles.button,
      opacity: selected === null ? 0.5 : 1,
    }}
  >
  {sending ? "جارٍ التحقق…" : current === questions.length - 1
    ? "عرض النتيجة"
    : "السؤال التالي ←"}
  </Button>
  </Card>


  </div>
  </PageSurface>
);
}

const styles = {
  page: {
    minHeight: "360px",
    background:
    "var(--gold-soft)",
    padding: "35px 18px",
    direction: "rtl",
    fontFamily: "var(--font-body)",
  },

  wrapper: {
    maxWidth: "650px",
    margin: "0 auto",
  },

  header: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "42px",
  },

  headerTitle: {
    fontSize: "28px",
    margin: "10px 0",
    color: "var(--ink)",
  },

  subtitle: {
    fontSize: "15px",
    color: "var(--muted)",
  },

  progressText: {
    fontSize: "14px",
    marginBottom: "8px",
    color: "var(--muted)",
  },

  progress: {
    height: "9px",
    background: "var(--surface-soft)",
    borderRadius: "20px",
    overflow: "hidden",
    marginBottom: "22px",
  },

  progressBar: {
    height: "100%",
    background: "var(--brand-gold)",
    borderRadius: "20px",
    transition: "0.3s",
  },

  card: {
    background: "var(--surface)",
    borderRadius: "24px",
    padding: "28px 20px",
    boxShadow: "var(--shadow-sm)",
    textAlign: "center",
  },

  question: {
    fontSize: "22px",
    color: "var(--ink)",
    marginBottom: "25px",
  },

  options: {
    display: "grid",
    gap: "12px",
    marginBottom: "25px",
  },

  option: {
    width: "100%",
    padding: "16px",
    border: "2px solid var(--line)",
    borderRadius: "14px",
    background: "var(--surface)",
    cursor: "pointer",
    fontSize: "16px",
    textAlign: "right",
    color: "var(--ink-soft)",
  },

  selectedOption: {
    border: "2px solid var(--brand-copper)",
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
  },

  button: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "15px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  home: {
    display: "block",
    marginTop: "22px",
    textAlign: "center",
    color: "var(--copper-ink)",
    textDecoration: "none",
  },

  emoji: {
    fontSize: "65px",
  },

  title: {
    fontSize: "32px",
    color: "var(--ink)",
  },

  text: {
    color: "var(--muted)",
  },

  score: {
    margin: "25px 0",
    padding: "20px",
    background: "var(--surface-soft)",
    borderRadius: "18px",
    fontSize: "17px",
  },

  scoreNumber: {
    display: "block",
    fontSize: "clamp(26px, 4vw, 34px)",
    color: "var(--copper-ink)",
    marginTop: "8px",
  },
};
