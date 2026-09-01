"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function QuizPage() {
  const params = useParams();
  const quizId = Number(params?.id);

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;

    async function loadQuiz() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase.rpc(
        "get_quiz_for_student",
        {
          p_quiz_id: quizId,
        }
      );

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

      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setLoading(false);
    }

    loadQuiz();
  }, [quizId]);

  function selectAnswer(questionId, optionId) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  if (loading) {
    return (
      <main style={styles.center} dir="rtl">
        <div style={{ fontSize: 48 }}>🤖</div>
        <h2>جاري تحميل الاختبار...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.center} dir="rtl">
        <h2>تعذر فتح الاختبار</h2>
        <p>{error}</p>
      </main>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.robot}>🤖</div>

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

        <section style={styles.stats}>
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
              ⏱️{" "}
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

        <section style={styles.questions}>
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
                <img
                  src={question.image_url}
                  alt=""
                  style={styles.image}
                />
              )}

              <div style={styles.options}>
                {(question.options || []).map(
                  (option) => {
                    const selected =
                      answers[question.id] ===
                      option.id;

                    return (
                      <button
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
                      </button>
                    );
                  }
                )}
              </div>
            </article>
          ))}
        </section>

        {questions.length === 0 && (
          <div style={styles.empty}>
            لا توجد أسئلة في هذا الاختبار.
          </div>
        )}

        {questions.length > 0 && (
          <section style={styles.finish}>
            <p>
              أجبت عن {answeredCount} من{" "}
              {questions.length} أسئلة
            </p>

            <button
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
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px 16px 70px",
    background: "#f5f8ff",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },

  container: {
    maxWidth: 850,
    margin: "0 auto",
  },

  hero: {
    background:
      "linear-gradient(135deg,#315ed6,#7065e8)",
    color: "white",
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
    background: "#e5eaf4",
    borderRadius: 10,
    margin: "18px 0 26px",
    overflow: "hidden",
  },

  progressValue: {
    height: "100%",
    background: "#315ed6",
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
    border: "1px solid #e5eaf2",
  },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
  },

  number: {
    background: "#edf3ff",
    color: "#315ed6",
    padding: "6px 12px",
    borderRadius: 20,
  },

  points: {
    color: "#667085",
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
    border: "1px solid #dfe5ef",
    borderRadius: 15,
    textAlign: "right",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  selected: {
    background: "#f1f5ff",
    border: "2px solid #4169dc",
  },

  circle: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "2px solid #cbd3e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  circleSelected: {
    background: "#4169dc",
    borderColor: "#4169dc",
    color: "white",
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
    background: "#315ed6",
    color: "white",
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
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
};