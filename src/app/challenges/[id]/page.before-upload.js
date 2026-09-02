"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ChallengeDetailsPage() {
  const params = useParams();
  const challengeId = Number(params?.id);

  const [challenge, setChallenge] = useState(null);
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [gradeId, setGradeId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [studentId, setStudentId] = useState("");

  const [submissionText, setSubmissionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!challengeId) return;

    async function loadPage() {
      setLoading(true);

      const [
        challengeResult,
        gradesResult,
        classroomsResult,
        studentsResult,
      ] = await Promise.all([
        supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .eq("status", "published")
          .single(),

        supabase
          .from("grades")
          .select("*")
          .order("id"),

        supabase
          .from("classrooms")
          .select("*")
          .order("id"),

        supabase
          .from("students")
          .select("*")
          .eq("is_active", true)
          .order("student_name"),
      ]);

      if (challengeResult.error) {
        setMessage("تعذر تحميل التحدي.");
      } else {
        setChallenge(challengeResult.data);
      }

      setGrades(gradesResult.data || []);
      setClassrooms(classroomsResult.data || []);
      setStudents(studentsResult.data || []);

      setLoading(false);
    }

    loadPage();
  }, [challengeId]);

  const filteredClassrooms = useMemo(() => {
    if (!gradeId) return [];

    return classrooms.filter(
      (item) => Number(item.grade_id) === Number(gradeId)
    );
  }, [classrooms, gradeId]);

  const filteredStudents = useMemo(() => {
    if (!classroomId) return [];

    return students.filter(
      (item) =>
        Number(item.classroom_id) === Number(classroomId)
    );
  }, [students, classroomId]);

  async function submitChallenge(e) {
    e.preventDefault();

    if (!studentId) {
      setMessage("اختر اسم الطالب أولًا.");
      return;
    }

    const hasContent =
      submissionText.trim() ||
      imageUrl.trim() ||
      fileUrl.trim();

    if (!hasContent) {
      setMessage("أضف مشاركة واحدة على الأقل قبل الإرسال.");
      return;
    }

    setSending(true);
    setMessage("");

    const payload = {
      challenge_id: challengeId,
      student_id: Number(studentId),
      submission_text:
        challenge?.allow_text && submissionText.trim()
          ? submissionText.trim()
          : null,
      image_url:
        challenge?.allow_image && imageUrl.trim()
          ? imageUrl.trim()
          : null,
      file_url:
        challenge?.allow_file && fileUrl.trim()
          ? fileUrl.trim()
          : null,
      status: "submitted",
    };

    const { error } = await supabase
      .from("challenge_submissions")
      .insert(payload);

    if (error) {
      setMessage("تعذر إرسال المشاركة: " + error.message);
    } else {
      setMessage("تم إرسال مشاركتك بنجاح 🎉");
      setSubmissionText("");
      setImageUrl("");
      setFileUrl("");
    }

    setSending(false);
  }

  if (loading) {
    return (
      <main dir="rtl" style={styles.center}>
        جاري تحميل التحدي...
      </main>
    );
  }

  if (!challenge) {
    return (
      <main dir="rtl" style={styles.center}>
        <div>
          <h2>التحدي غير متاح</h2>
          <a href="/challenges">العودة للتحديات</a>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <a href="/challenges" style={styles.back}>
          ← العودة للتحديات
        </a>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>🏆</div>

          <div>
            <div style={styles.badge}>
              تحدي الذكاء الاصطناعي
            </div>

            <h1 style={styles.title}>
              {challenge.title}
            </h1>

            {challenge.description && (
              <p style={styles.description}>
                {challenge.description}
              </p>
            )}

            <div style={styles.meta}>
              <span>
                🎯 {challenge.max_score} درجة
              </span>

              {challenge.allow_text && <span>✍️ نص</span>}
              {challenge.allow_image && <span>🖼️ صورة</span>}
              {challenge.allow_file && <span>📎 ملف</span>}
            </div>
          </div>
        </section>

        {challenge.instructions && (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>
              📋 تعليمات المشاركة
            </h2>

            <p style={styles.instructions}>
              {challenge.instructions}
            </p>
          </section>
        )}

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}

        <form
          onSubmit={submitChallenge}
          style={styles.card}
        >
          <h2 style={styles.cardTitle}>
            👋 عرّف بنفسك أولًا
          </h2>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                الصف الدراسي
              </label>

              <select
                value={gradeId}
                onChange={(e) => {
                  setGradeId(e.target.value);
                  setClassroomId("");
                  setStudentId("");
                }}
                style={styles.input}
              >
                <option value="">اختر الصف</option>

                {grades.map((grade) => (
                  <option
                    key={grade.id}
                    value={grade.id}
                  >
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                الفصل
              </label>

              <select
                value={classroomId}
                onChange={(e) => {
                  setClassroomId(e.target.value);
                  setStudentId("");
                }}
                style={styles.input}
                disabled={!gradeId}
              >
                <option value="">اختر الفصل</option>

                {filteredClassrooms.map((room) => (
                  <option
                    key={room.id}
                    value={room.id}
                  >
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>
                اسم الطالب
              </label>

              <select
                value={studentId}
                onChange={(e) =>
                  setStudentId(e.target.value)
                }
                style={styles.input}
                disabled={!classroomId}
              >
                <option value="">اختر اسمك</option>

                {filteredStudents.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.student_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 style={styles.participationTitle}>
            🚀 أرسل مشاركتك
          </h2>

          {challenge.allow_text && (
            <div>
              <label style={styles.label}>
                ✍️ المشاركة النصية
              </label>

              <textarea
                value={submissionText}
                onChange={(e) =>
                  setSubmissionText(e.target.value)
                }
                style={styles.textarea}
                placeholder="اكتب مشاركتك هنا..."
              />
            </div>
          )}

          {challenge.allow_image && (
            <div>
              <label style={styles.label}>
                🖼️ رابط الصورة
              </label>

              <input
                value={imageUrl}
                onChange={(e) =>
                  setImageUrl(e.target.value)
                }
                style={styles.input}
                placeholder="https://..."
              />
            </div>
          )}

          {challenge.allow_file && (
            <div>
              <label style={styles.label}>
                📎 رابط الملف
              </label>

              <input
                value={fileUrl}
                onChange={(e) =>
                  setFileUrl(e.target.value)
                }
                style={styles.input}
                placeholder="https://..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            style={styles.button}
          >
            {sending
              ? "جارٍ إرسال المشاركة..."
              : "إرسال المشاركة 🚀"}
          </button>
        </form>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7ff",
    padding: "24px 14px 60px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "18px",
    padding: "10px 15px",
    borderRadius: "11px",
    background: "#fff",
    color: "#3159d9",
    textDecoration: "none",
  },

  hero: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#2563eb,#753bea)",
    color: "white",
    padding: "30px",
    borderRadius: "24px",
    marginBottom: "20px",
  },

  heroIcon: {
    fontSize: "55px",
  },

  badge: {
    fontSize: "12px",
    opacity: 0.8,
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize: "clamp(25px,5vw,38px)",
  },

  description: {
    lineHeight: 1.8,
    opacity: 0.9,
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
    fontSize: "13px",
  },

  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "18px",
    boxShadow: "0 7px 25px rgba(20,30,70,.06)",
  },

  cardTitle: {
    marginTop: 0,
  },

  instructions: {
    lineHeight: 1.9,
    color: "#5f687b",
    whiteSpace: "pre-line",
  },

  message: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    padding: "13px",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "14px",
  },

  label: {
    display: "block",
    fontWeight: "700",
    marginTop: "15px",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce2ec",
    borderRadius: "11px",
    padding: "12px",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "130px",
    border: "1px solid #dce2ec",
    borderRadius: "11px",
    padding: "12px",
    resize: "vertical",
  },

  participationTitle: {
    marginTop: "30px",
    borderTop: "1px solid #edf0f6",
    paddingTop: "22px",
  },

  button: {
    width: "100%",
    border: 0,
    borderRadius: "13px",
    padding: "14px",
    marginTop: "24px",
    background:
      "linear-gradient(90deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },
};