"use client";

import { useDialogs } from "../../../components/platform/DialogProvider";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { EmptyState, Feedback, Button, Card, PageSurface, Select } from "../../../components/platform/PlatformUI";

import ContentImage from "../../../components/ui/ContentImage";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function requestStudentData() {
  const { data, error } = await supabase.rpc(
        "get_student_directory"
      );
  return { data, error };
}

async function requestQuiz(quizId) {
  const { data, error } = await supabase.rpc(
        "get_quiz_for_student",
        { p_quiz_id: quizId }
      );
  return { data, error };
}

export default function QuizPage() {
  const { notify } = useDialogs();
  const params = useParams();
  const quizId = Number(params?.id);

  const [quiz, setQuiz] = useState(null);
  const [loadedQuizId, setLoadedQuizId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [gradeId, setGradeId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentReady, setStudentReady] = useState(false);

  useEffect(() => {
    let active = true;

    requestStudentData()
      .then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("Student directory error:", error);
        return;
      }

      setGrades(data?.grades || []);
      setClassrooms(data?.classrooms || []);
      setStudents(data?.students || []);
      })
      .catch(() => {
      if (!active) return;
      console.error("تعذر تحميل دليل الطلاب.");
      });
    return () => { active = false; };
  }, []);

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

  const filteredClassrooms = classrooms.filter(
    (item) => Number(item.grade_id) === Number(gradeId)
  );

  const filteredStudents = students.filter(
    (item) => Number(item.classroom_id) === Number(classroomId)
  );

  if (!studentReady) {
    return (
      <PageSurface dir="rtl" style={styles.page}>
        <div style={styles.container}>
          <section
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "650px",
              margin: "40px auto",
              border: "1px solid var(--line)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <div style={{ fontSize: "48px" }}><SchoolIcon name="teacher" size={22} /></div>
              <h1 style={{ marginBottom: "8px" }}>قبل أن تبدأ الاختبار</h1>
              <p style={{ color: "var(--muted)" }}>
                اختر صفك وفصلك ثم اسمك
              </p>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label htmlFor="field-quizid-1">الصف الدراسي</label>
                <Select id="field-quizid-1"
                  value={gradeId}
                  onChange={(e) => {
                    setGradeId(e.target.value);
                    setClassroomId("");
                    setStudentId("");
                  }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: "7px",
                    borderRadius: "12px",
                    border: "1px solid var(--line)",
                    background: "white",
                    fontSize: "16px",
                  }}
                >
                  <option value="">اختر الصف</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="field-quizid-2">الفصل</label>
                <Select id="field-quizid-2"
                  value={classroomId}
                  disabled={!gradeId}
                  onChange={(e) => {
                    setClassroomId(e.target.value);
                    setStudentId("");
                  }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: "7px",
                    borderRadius: "12px",
                    border: "1px solid var(--line)",
                    background: "white",
                    fontSize: "16px",
                  }}
                >
                  <option value="">اختر الفصل</option>
                  {filteredClassrooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label htmlFor="field-quizid-3">اسم الطالب</label>
                <Select id="field-quizid-3"
                  value={studentId}
                  disabled={!classroomId}
                  onChange={(e) => setStudentId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: "7px",
                    borderRadius: "12px",
                    border: "1px solid var(--line)",
                    background: "white",
                    fontSize: "16px",
                  }}
                >
                  <option value="">اختر اسمك</option>
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Button variant="primary"
                type="button"
                disabled={!studentId}
                onClick={() => setStudentReady(true)}
                style={{
                  marginTop: "8px",
                  padding: "15px",
                  border: 0,
                  borderRadius: "13px",
                  background: "var(--brand-gold)",
                  color: "var(--ink)",
                  fontSize: "17px",
                  fontWeight: "700",
                  opacity: studentId ? 1 : 0.45,
                  cursor: studentId ? "pointer" : "not-allowed",
                }}
              >
                <SchoolIcon name="rocket" size={22} /> ابدأ الاختبار
              </Button>
            </div>
          </section>
        </div>
      </PageSurface>
    );
  }

  async function submitQuiz() {
    if (!studentId) {
      await notify("اختر اسم الطالب أولاً");
      return;
    }

    if (Object.keys(answers).length !== questions.length) {
      await notify("أجب عن جميع الأسئلة أولاً");
      return;
    }

    const { data, error } = await supabase.rpc(
      "submit_quiz_attempt",
      {
        p_quiz_id: quizId,
        p_student_id: Number(studentId),
        p_answers: answers,
      }
    );

    if (error) {
      console.error(error);
      await notify("حدث خطأ أثناء إرسال الإجابات");
      return;
    }

    setResult({
      score: Number(data.score),
      totalPoints: Number(data.total_points),
    });
  }

  const selectedStudent = students.find(
    (student) => Number(student.id) === Number(studentId)
  );

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
            {selectedStudent?.name || "الطالب"}
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
              disabled={answered !== questions.length}
              style={{
                ...styles.finishButton,
                opacity:
                  answered === questions.length ? 1 : 0.45,
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
