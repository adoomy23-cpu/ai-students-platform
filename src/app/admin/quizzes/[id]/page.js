"use client";

import SchoolIcon from "../../../../components/brand/SchoolIcon";
import { Button, EmptyState, Feedback, PageSurface } from "../../../../components/platform/PlatformUI";

import ContentImage from "../../../../components/ui/ContentImage";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { requestAdmin } from "../../../../lib/admin/client";

async function requestQuiz(quizId) {
  const { data, error } = await requestAdmin("quizzes.preview", { id: quizId });
  return { data, error };
}

export default function QuizPage() {
  const params = useParams();
  const quizId = Number(params?.id);

  const [quiz, setQuiz] = useState(null);
  const [loadedQuizId, setLoadedQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isSafeInteger(quizId) || quizId <= 0) return;
    let active = true;

    requestQuiz(quizId)
      .then(({ data, error }) => {
      if (!active) return;
      setLoadedQuizId(quizId);
      setError("");

      if (error) {
        console.error(error);
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

  function selectAnswer(questionId, optionId) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  if (!Number.isSafeInteger(quizId) || quizId <= 0) {
    return <PageSurface dir="rtl" style={styles.center}>معرّف الاختبار غير صالح.</PageSurface>;
  }

  if (loading || loadedQuizId !== quizId) {
    return (
      <PageSurface style={styles.center} dir="rtl">
        <div style={{ fontSize: 48 }}><SchoolIcon name="spark" size={22} /></div>
        <h2>جاري تحميل الاختبار...</h2>
      </PageSurface>
    );
  }

  if (error) {
    return (
      <PageSurface style={styles.center} dir="rtl">
        <Feedback tone="error"><h2>تعذر فتح الاختبار</h2><p>{error}</p></Feedback>
      </PageSurface>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>
        <section className="platform-hero" style={styles.hero}>
          <div style={styles.robot}><SchoolIcon name="spark" size={32} /></div>

          <div>
            <div style={styles.badge}>اختبار تفاعلي</div>

            <h1 style={styles.title}>
              {quiz.title}
            </h1>

            {quiz.description && (
              <p style={styles.description}>
                {quiz.description}
              </p>
            )}
          </div>
        </section>

        <section className="platform-grid" style={styles.stats}>
          <div>
            <strong>{questions.length}</strong>
            <span> أسئلة</span>
          </div>

          <div>
            <strong>{answeredCount}</strong>
            <span> تمت الإجابة</span>
          </div>

          {quiz.time_limit_minutes && (
            <div>
              <SchoolIcon name="clock" size={22} />{" "}
              <strong>
                {quiz.time_limit_minutes}
              </strong>
              <span> دقيقة</span>
            </div>
          )}
        </section>

        <div style={styles.progress}>
          <div
            style={{
              ...styles.progressValue,
              width:
                questions.length > 0
                  ? `${
                      (answeredCount /
                        questions.length) *
                      100
                    }%`
                  : "0%",
            }}
          />
        </div>

        <section className="platform-grid" style={styles.questions}>
          {questions.map((question, index) => (
            <article
              key={question.id}
              style={styles.questionCard}
            >
              <div style={styles.questionHeader}>
                <span style={styles.number}>
                  السؤال {index + 1}
                </span>

                <span style={styles.points}>
                  {question.points || 1} نقطة
                </span>
              </div>

              <h2 style={styles.questionText}>
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
                {(question.options || []).map(
                  (option) => {
                    const selected =
                      answers[question.id] ===
                      option.id;

                    return (
                      <Button variant="choice" aria-pressed={selected}
                        key={option.id}
                        type="button"
                        onClick={() =>
                          selectAnswer(
                            question.id,
                            option.id
                          )
                        }
                        style={{
                          ...styles.option,
                          ...(selected
                            ? styles.selected
                            : {}),
                        }}
                      >
                        <span
                          style={{
                            ...styles.circle,
                            ...(selected
                              ? styles.circleSelected
                              : {}),
                          }}
                        >
                          {selected ? "✓" : ""}
                        </span>

                        <span>
                          {option.option_text}
                        </span>
                      </Button>
                    );
                  }
                )}
              </div>
            </article>
          ))}
        </section>

        {questions.length === 0 && (
          <EmptyState style={styles.empty}>
            لا توجد أسئلة في هذا الاختبار.
          </EmptyState>
        )}

        {questions.length > 0 && (
          <section style={styles.finish}>
            <p>
              أجبت عن {answeredCount} من{" "}
              {questions.length} أسئلة
            </p>

            <Button variant="primary" icon="check"
              type="button"
              disabled={
                answeredCount !== questions.length
              }
              style={{
                ...styles.finishButton,
                opacity:
                  answeredCount === questions.length
                    ? 1
                    : 0.45,
              }}
            >
              إنهاء الاختبار وإرسال الإجابات
            </Button>
          </section>
        )}
      </div>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    padding: "24px 16px 36px",
    background: "var(--surface-soft)",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },

  container: {
    maxWidth: 850,
    margin: "0 auto",
  },

  hero: {
    background:
      "var(--gold-soft)",
    color: "var(--ink)",
    borderRadius: 26,
    padding: 28,
    display: "flex",
    alignItems: "center",
    gap: 20,
  },

  robot: {
    fontSize: 42,
    background: "rgba(255,255,255,.15)",
    width: 72,
    height: 72,
    borderRadius: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,.18)",
    padding: "6px 12px",
    borderRadius: 20,
  },

  title: {
    margin: "8px 0 0",
    fontSize: 28,
  },

  description: {
    lineHeight: 1.8,
    opacity: 0.9,
  },

  stats: {
    marginTop: 18,
    padding: 18,
    background: "white",
    borderRadius: 18,
    display: "flex",
    gap: 30,
    flexWrap: "wrap",
  },

  progress: {
    height: 8,
    background: "var(--surface-soft)",
    borderRadius: 10,
    margin: "18px 0 26px",
    overflow: "hidden",
  },

  progressValue: {
    height: "100%",
    background: "var(--brand-gold)",
    transition: "width .3s",
  },

  questions: {
    display: "grid",
    gap: 20,
  },

  questionCard: {
    background: "white",
    padding: 24,
    borderRadius: 22,
    border: "1px solid var(--line)",
  },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  number: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "6px 12px",
    borderRadius: 20,
  },

  points: {
    color: "var(--muted)",
  },

  questionText: {
    margin: "20px 0",
    fontSize: 20,
    lineHeight: 1.8,
  },

  image: {
    width: "100%",
    maxHeight: 320,
    objectFit: "contain",
    marginBottom: 18,
  },

  options: {
    display: "grid",
    gap: 11,
  },

  option: {
    padding: "15px 16px",
    background: "white",
    border: "1px solid var(--line)",
    borderRadius: 15,
    textAlign: "right",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  selected: {
    background: "var(--surface-soft)",
    border: "2px solid var(--brand-copper)",
  },

  circle: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "2px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  circleSelected: {
    background: "var(--brand-gold)",
    borderColor: "var(--brand-copper)",
    color: "var(--ink)",
  },

  finish: {
    marginTop: 28,
    background: "white",
    padding: 22,
    borderRadius: 20,
    textAlign: "center",
  },

  finishButton: {
    width: "100%",
    padding: 16,
    border: 0,
    borderRadius: 14,
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontSize: 17,
    fontWeight: 700,
  },

  empty: {
    padding: 35,
    background: "white",
    borderRadius: 20,
    textAlign: "center",
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
