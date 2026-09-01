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
      const { data, error } = await supabase.rpc(
        "get_quiz_for_student",
        { p_quiz_id: quizId }
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

  function chooseAnswer(questionId, optionId) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  if (loading) {
    return (
      <main dir="rtl" style={styles.center}>
        <div style={{ fontSize: 50 }}>🤖</div>
        <h2>جاري تحميل الاختبار...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main dir="rtl" style={styles.center}>
        <h2>تعذر فتح الاختبار</h2>
        <p>{error}</p>
      </main>
    );
  }

  const answered = Object.keys(answers).length;

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.robot}>🤖</div>
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
            <span>⏱️ <b>{quiz.time_limit_minutes}</b> دقيقة</span>
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

        <div style={styles.questions}>
          {questions.map((question, index) => (
            <section key={question.id} style={styles.card}>
              <div style={styles.questionTop}>
                <span style={styles.number}>السؤال {index + 1}</span>
                <span>{question.points || 1} نقطة</span>
              </div>

              <h2 style={styles.question}>
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
                {(question.options || []).map((option) => {
                  const selected =
                    answers[question.id] === option.id;

                  return (
                    <button
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
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {questions.length > 0 && (
          <section style={styles.finish}>
            <p>
              أجبت عن {answered} من {questions.length} أسئلة
            </p>

            <button
              type="button"
              disabled={answered !== questions.length}
              style={{
                ...styles.finishButton,
                opacity:
                  answered === questions.length ? 1 : 0.45,
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
    background: "#f5f8ff",
    padding: "30px 16px 70px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  container: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  hero: {
    background: "linear-gradient(135deg,#315ed6,#7065e8)",
    color: "white",
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
    background: "#e5eaf4",
    borderRadius: "10px",
    margin: "18px 0 26px",
    overflow: "hidden",
  },
  progressValue: {
    height: "100%",
    background: "#315ed6",
  },
  questions: {
    display: "grid",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "22px",
    padding: "24px",
    border: "1px solid #e5eaf2",
  },
  questionTop: {
    display: "flex",
    justifyContent: "space-between",
  },
  number: {
    background: "#edf3ff",
    color: "#315ed6",
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
    border: "1px solid #dfe5ef",
    borderRadius: "15px",
    textAlign: "right",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  selected: {
    background: "#f1f5ff",
    border: "2px solid #4169dc",
  },
  circle: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "2px solid #cbd3e1",
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
    background: "#315ed6",
    color: "white",
    fontSize: "17px",
    fontWeight: "700",
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
