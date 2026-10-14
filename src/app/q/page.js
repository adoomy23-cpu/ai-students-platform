"use client";

import SchoolIcon from "../../components/brand/SchoolIcon";
import { Button, Card, PageSurface } from "../../components/platform/PlatformUI";

import { useState } from "react";

const questions = [
  {
    question: "ما المقصود بالذكاء الاصطناعي؟",
    options: [
      "تقنية تجعل الأجهزة تنفذ مهامًا تحتاج إلى ذكاء",
      "نوع من أنواع الإنترنت",
      "برنامج للرسم فقط",
      "جهاز لتخزين الملفات",
    ],
    correct: 0,
  },
  {
    question: "هل يستطيع الذكاء الاصطناعي التعلم من البيانات؟",
    options: ["نعم", "لا"],
    correct: 0,
  },
  {
    question: "هل يمكن للذكاء الاصطناعي أن يخطئ؟",
    options: ["نعم، قد يخطئ", "لا، لا يخطئ أبدًا"],
    correct: 0,
  },
];

export default function QuizPage() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[current];

  function nextQuestion() {
    if (selected === null) return;

    if (selected === question.correct) {
      setScore((prev) => prev + 1);
    }

    if (current < questions.length - 1) {
      setCurrent((prev) => prev + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  function restartQuiz() {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const finalScore =
    score + (selected === question.correct ? 1 : 0);

    return (
    <PageSurface style={styles.page}>
    <Card as="div" style={styles.card}>
    <div style={styles.emoji}><SchoolIcon name="trophy" size={22} /></div>
    <h1 style={styles.title}>أحسنت!</h1>

    <p style={styles.text}>لقد أكملت الاختبار بنجاح</p>

    <div style={styles.score}>
    نتيجتك
    <strong style={styles.scoreNumber}>
    {finalScore} / {questions.length}
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

  <Button variant="primary"
  onClick={nextQuestion}
  disabled={selected === null}
  style={{
      ...styles.button,
      opacity: selected === null ? 0.5 : 1,
    }}
  >
  {current === questions.length - 1
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
