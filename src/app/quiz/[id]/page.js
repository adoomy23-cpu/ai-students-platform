"use client";

import { useDialogs } from "../../../components/platform/DialogProvider";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { EmptyState, Feedback, Button, Card, PageSurface } from "../../../components/platform/PlatformUI";

import ContentImage from "../../../components/ui/ContentImage";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccess } from "../../../components/platform/AuthProvider";
import StudentIdentity from "../../../components/student/StudentIdentity";
import { requestStudent } from "../../../lib/student/browser-client";

async function requestQuiz(quizId) {
  return requestStudent("quiz.load", { id: quizId });
}

export default function QuizPage() {
  const { notify } = useDialogs();
  const access = useAccess();
  const studentId = access.student?.profile?.id;
  const [submitting, setSubmitting] = useState(false);
  const params = useParams();
  const quizId = Number(params?.id);

  const [quiz, setQuiz] = useState(null);
  const [loadedQuizId, setLoadedQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [studentReady, setStudentReady] = useState(false);

  useEffect(() => {
    if (!Number.isSafeInteger(quizId) || quizId <= 0) return;
    let active = true;

    requestQuiz(quizId)
      .then(({ data, error }) => {
      if (!active) return;
      setLoadedQuizId(quizId);
      setError("");

      if (error) {
          setError("تعذر تحميل الاختبار.");
        setLoading(false);
        return;
      }

      if (!data?.quiz) {
        setError("الاختبار غير متاح حاليًا.");
        setLoading(false);
        return;
      }

      setAnswers({});
      setResult(null);
      setStudentReady(false);
      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setLoading(false);
      })
      .catch(() => {
      if (!active) return;
      setLoadedQuizId(quizId);
      setError("تعذر تحميل الاختبار. حاول مرة أخرى لاحقًا.");
      setLoading(false);
      });
    return () => { active = false; };
  }, [quizId]);

  function chooseAnswer(questionId, optionId) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  if (!Number.isSafeInteger(quizId) || quizId <= 0) {
    return <PageSurface dir="rtl" style={styles.center}><Feedback tone="error">معرّف الاختبار غير صالح.</Feedback></PageSurface>;
  }

  if (loading || loadedQuizId !== quizId) {
    return (
      <PageSurface dir="rtl" style={styles.center}>
        <EmptyState loading>جاري تحميل الاختبار...</EmptyState>
      </PageSurface>
    );
  }

  if (error) {
    return (
      <PageSurface dir="rtl" style={styles.center}>
        <Feedback tone="error"><h2>تعذر فتح الاختبار</h2><p>{error}</p></Feedback>
      </PageSurface>
    );
  }

  if (!studentReady) {
    return <PageSurface dir="rtl" style={styles.page}><div style={styles.container}>
      <Card style={{ maxWidth: "650px", margin: "24px auto", padding: "24px" }}>
        <h1>قبل أن تبدأ الاختبار</h1><p>ستُحفظ النتيجة باسم حسابك المعتمد.</p>
        <StudentIdentity />
        <Button variant="primary" icon="rocket" disabled={!studentId} onClick={() => setStudentReady(true)}>ابدأ الاختبار</Button>
      </Card>
    </div></PageSurface>;
  }

  async function submitQuiz() {
    if (submitting) return;
    if (!studentId) {
      await notify("تعذر التحقق من هوية الطالب. أعد تسجيل الدخول.");
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      await notify("أجب عن جميع الأسئلة أولاً");
      return;
    }

    setSubmitting(true);
    const { data, error } = await requestStudent("quiz.submit", { id: quizId, answers });
    setSubmitting(false);

    if (error || !data || !Number.isFinite(Number(data.score)) || !Number.isFinite(Number(data.total_points))) {
      await notify("تعذر إرسال الإجابات أو التحقق من النتيجة. حاول لاحقًا.");
      return;
    }

    setResult({
      score: Number(data.score),
      totalPoints: Number(data.total_points),
    });
  }

  if (result) {
    const percentage =
      result.totalPoints > 0
        ? Math.round((result.score / result.totalPoints) * 100)
        : 0;

    const message =
      percentage >= 90 ? "ممتاز جدًا! أداء رائع" :
      percentage >= 75 ? "أحسنت! نتيجة جميلة" :
      percentage >= 50 ? "جيد! استمر في التقدم" :
      "محاولة جميلة، وبالتدريب ستكون أفضل";

    return (
      <PageSurface dir="rtl" style={styles.resultPage}>
        <Card as="section" style={styles.resultCard}>
          <div style={styles.resultEmoji}>
            <SchoolIcon name="trophy" size={54} />
          </div>

          <div style={styles.resultBadge}>اكتمل الاختبار بنجاح</div>

          <h1 style={styles.resultTitle}>أحسنت يا بطل!</h1>

          <p style={styles.resultStudent}>
            {access.student?.profile?.name || "الطالب"}
          </p>

          <div style={styles.scoreCircle}>
            <strong style={styles.scoreNumber}>{result.score}</strong>
            <span style={styles.scoreTotal}>من {result.totalPoints}</span>
          </div>

          <div style={styles.percentage}>{percentage}%</div>

          <p style={styles.resultMessage}>{message}</p>


        </Card>
      </PageSurface>
    );
  }

  const answered = Object.keys(answers).length;

  return (
    <PageSurface dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <section className="platform-hero" style={styles.hero}>
          <div style={styles.robot}><SchoolIcon name="spark" size={32} /></div>
          <div>
            <div style={styles.badge}>اختبار تفاعلي</div>
            <h1 style={styles.title}>{quiz.title}</h1>
            {quiz.description && (
              <p style={styles.description}>{quiz.description}</p>
            )}
          </div>
        </section>

        <section style={styles.info}>
          <span><b>{questions.length}</b> أسئلة</span>
          <span><b>{answered}</b> تمت الإجابة</span>
          {quiz.time_limit_minutes && (
            <span><SchoolIcon name="clock" size={22} /> <b>{quiz.time_limit_minutes}</b> دقيقة</span>
          )}
        </section>

        <div style={styles.progress}>
          <div
            style={{
              ...styles.progressValue,
              width: questions.length
                ? `${(answered / questions.length) * 100}%`
                : "0%",
            }}
          />
        </div>

        <div className="platform-grid" style={styles.questions}>
          {questions.map((question, index) => (
            <Card as="section" key={question.id} style={styles.card}>
              <div style={styles.questionTop}>
                <span style={styles.number}>السؤال {index + 1}</span>
                <span>{question.points || 1} نقطة</span>
              </div>

              <h2 style={styles.question}>
                {question.question_text}
              </h2>

              {question.image_url && (
                <ContentImage
                  src={question.image_url}
                  alt=""
                  style={styles.image}
                />
              )}

              <div className="platform-grid" style={styles.options}>
                {(question.options || []).map((option) => {
                  const selected =
                    answers[question.id] === option.id;

                  return (
                    <Button variant="choice" aria-pressed={selected}
                      type="button"
                      key={option.id}
                      onClick={() =>
                        chooseAnswer(question.id, option.id)
                      }
                      style={{
                        ...styles.option,
                        ...(selected ? styles.selected : {}),
                      }}
                    >
                      <span style={styles.circle}>
                        {selected ? "✓" : ""}
                      </span>
                      {option.option_text}
                    </Button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {questions.length > 0 && (
          <section style={styles.finish}>
            <p>
              أجبت عن {answered} من {questions.length} أسئلة
            </p>

            <Button variant="primary" icon="check"
              type="button"
              onClick={submitQuiz}
              disabled={submitting || answered !== questions.length}
              style={{
                ...styles.finishButton,
                opacity:
                  answered === questions.length ? 1 : 0.45,
              }}
            >
              {submitting ? "جارٍ إرسال الإجابات…" : "إنهاء الاختبار وإرسال الإجابات"}
            </Button>
          </section>
        )}
      </div>
    </PageSurface>
  );
}

const resultStyles = {
  resultPage: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "var(--font-body)",
  },
  resultCard: {
    width: "100%",
    maxWidth: "520px",
    background: "var(--surface)",
    borderRadius: "28px",
    padding: "40px 24px",
    textAlign: "center",
    boxShadow: "var(--shadow-sm)",
  },
  resultEmoji: {
    fontSize: "64px",
    marginBottom: "12px",
  },
  resultBadge: {
    display: "inline-block",
    background: "var(--surface-soft)",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "14px",
    marginBottom: "15px",
  },
  resultTitle: {
    fontSize: "30px",
    margin: "8px 0",
  },
  resultStudent: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "22px",
  },
  scoreCircle: {
    width: "150px",
    height: "150px",
    margin: "0 auto 15px",
    borderRadius: "50%",
    background: "var(--surface-soft)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "8px solid var(--line)",
  },
  scoreNumber: {
    fontSize: "48px",
    lineHeight: "1",
  },
  scoreTotal: {
    marginTop: "8px",
    fontSize: "16px",
  },
  percentage: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  resultMessage: {
    fontSize: "19px",
    marginBottom: "28px",
  },
  homeButton: {
    display: "block",
    padding: "15px 20px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "17px",
  },
};

const styles = {
  ...resultStyles,
  page: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    padding: "24px 16px 36px",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },
  container: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  hero: {
    background: "var(--gold-soft)",
    color: "var(--ink)",
    borderRadius: "26px",
    padding: "28px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  robot: {
    fontSize: "42px",
    background: "rgba(255,255,255,.15)",
    width: "72px",
    height: "72px",
    borderRadius: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,.18)",
    padding: "6px 12px",
    borderRadius: "20px",
  },
  title: {
    margin: "8px 0 0",
    fontSize: "28px",
  },
  description: {
    lineHeight: 1.8,
  },
  info: {
    background: "white",
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    display: "flex",
    gap: "28px",
    flexWrap: "wrap",
  },
  progress: {
    height: "8px",
    background: "var(--surface-soft)",
    borderRadius: "10px",
    margin: "18px 0 26px",
    overflow: "hidden",
  },
  progressValue: {
    height: "100%",
    background: "var(--brand-gold)",
  },
  questions: {
    display: "grid",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "22px",
    padding: "24px",
    border: "1px solid var(--line)",
  },
  questionTop: {
    display: "flex",
    justifyContent: "space-between",
  },
  number: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "6px 12px",
    borderRadius: "20px",
  },
  question: {
    margin: "20px 0",
    fontSize: "20px",
    lineHeight: 1.8,
  },
  image: {
    width: "100%",
    maxHeight: "320px",
    objectFit: "contain",
    marginBottom: "18px",
  },
  options: {
    display: "grid",
    gap: "11px",
  },
  option: {
    padding: "15px",
    background: "white",
    border: "1px solid var(--line)",
    borderRadius: "15px",
    textAlign: "right",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  selected: {
    background: "var(--surface-soft)",
    border: "2px solid var(--brand-copper)",
  },
  circle: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "2px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  finish: {
    marginTop: "28px",
    padding: "22px",
    background: "white",
    borderRadius: "20px",
    textAlign: "center",
  },
  finishButton: {
    width: "100%",
    padding: "16px",
    border: 0,
    borderRadius: "14px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontSize: "17px",
    fontWeight: "700",
  },
  center: {
    minHeight: "360px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-body)",
  },
};
