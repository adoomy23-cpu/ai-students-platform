"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "draft",
    start_at: "",
    end_at: "",
    time_limit_minutes: "",
    show_score: true,
    show_correct_answers: false,
    max_attempts: 1,
    is_featured: false,
    sort_order: 0,
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    setLoading(true);

    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage("❌ تعذر تحميل الاختبارات: " + error.message);
    } else {
      setQuizzes(data || []);
    }

    setLoading(false);
  }

  function updateField(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setMessage("❌ اكتب عنوان الاختبار.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_at: form.start_at
        ? new Date(form.start_at).toISOString()
        : null,
      end_at: form.end_at
        ? new Date(form.end_at).toISOString()
        : null,
      time_limit_minutes: form.time_limit_minutes
        ? Number(form.time_limit_minutes)
        : null,
      show_score: form.show_score,
      show_correct_answers: form.show_correct_answers,
      max_attempts: Number(form.max_attempts) || 1,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    };

    const { error } = await supabase
      .from("quizzes")
      .insert([payload]);

    if (error) {
      console.error(error);
      setMessage("❌ لم يتم حفظ الاختبار: " + error.message);
      setSaving(false);
      return;
    }

    setMessage("✅ تم إنشاء الاختبار بنجاح.");

    setForm({
      title: "",
      description: "",
      status: "draft",
      start_at: "",
      end_at: "",
      time_limit_minutes: "",
      show_score: true,
      show_correct_answers: false,
      max_attempts: 1,
      is_featured: false,
      sort_order: 0,
    });

    await loadQuizzes();
    setSaving(false);
  }

  async function deleteQuiz(id) {
    const ok = window.confirm(
      "هل أنت متأكد من حذف هذا الاختبار؟"
    );

    if (!ok) return;

    setMessage("");

    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage("❌ تعذر حذف الاختبار: " + error.message);
      return;
    }

    setMessage("✅ تم حذف الاختبار.");
    await loadQuizzes();
  }

  async function togglePublish(quiz) {
    const newStatus =
      quiz.status === "published" ? "draft" : "published";

    const { error } = await supabase
      .from("quizzes")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quiz.id);

    if (error) {
      console.error(error);
      setMessage("❌ تعذر تغيير حالة الاختبار: " + error.message);
      return;
    }

    setMessage(
      newStatus === "published"
        ? "✅ تم نشر الاختبار."
        : "✅ تم تحويل الاختبار إلى مسودة."
    );

    await loadQuizzes();
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <a href="/admin" style={styles.back}>
          ← العودة للوحة التحكم
        </a>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>📝</div>

          <div>
            <p style={styles.heroSmall}>
              منصة الذكاء الاصطناعي
            </p>

            <h1 style={styles.heroTitle}>
              إدارة الاختبارات
            </h1>

            <p style={styles.heroText}>
              أنشئ الاختبارات وحدد إعداداتها ثم أضف الأسئلة.
            </p>
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                ➕ إنشاء اختبار جديد
              </h2>

              <p style={styles.sectionText}>
                أدخل بيانات الاختبار الأساسية.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>
                  عنوان الاختبار *
                </label>

                <input
                  style={styles.input}
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  placeholder="مثال: اختبار الذكاء الاصطناعي"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  حالة الاختبار
                </label>

                <select
                  style={styles.input}
                  value={form.status}
                  onChange={(e) =>
                    updateField("status", e.target.value)
                  }
                >
                  <option value="draft">📝 مسودة</option>
                  <option value="published">✅ منشور</option>
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                وصف الاختبار
              </label>

              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                placeholder="اكتب وصفًا مختصرًا للطلاب..."
              />
            </div>

            <div style={styles.threeGrid}>
              <div style={styles.field}>
                <label style={styles.label}>
                  مدة الاختبار بالدقائق
                </label>

                <input
                  type="number"
                  min="1"
                  style={styles.input}
                  value={form.time_limit_minutes}
                  onChange={(e) =>
                    updateField(
                      "time_limit_minutes",
                      e.target.value
                    )
                  }
                  placeholder="مثال: 15"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  عدد المحاولات
                </label>

                <input
                  type="number"
                  min="1"
                  style={styles.input}
                  value={form.max_attempts}
                  onChange={(e) =>
                    updateField(
                      "max_attempts",
                      e.target.value
                    )
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  ترتيب الظهور
                </label>

                <input
                  type="number"
                  style={styles.input}
                  value={form.sort_order}
                  onChange={(e) =>
                    updateField(
                      "sort_order",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>
                  بداية الاختبار
                </label>

                <input
                  type="datetime-local"
                  style={styles.input}
                  value={form.start_at}
                  onChange={(e) =>
                    updateField("start_at", e.target.value)
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  نهاية الاختبار
                </label>

                <input
                  type="datetime-local"
                  style={styles.input}
                  value={form.end_at}
                  onChange={(e) =>
                    updateField("end_at", e.target.value)
                  }
                />
              </div>
            </div>

            <div style={styles.optionsBox}>
              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.show_score}
                  onChange={(e) =>
                    updateField(
                      "show_score",
                      e.target.checked
                    )
                  }
                />
                إظهار الدرجة للطالب
              </label>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.show_correct_answers}
                  onChange={(e) =>
                    updateField(
                      "show_correct_answers",
                      e.target.checked
                    )
                  }
                />
                إظهار الإجابات الصحيحة
              </label>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    updateField(
                      "is_featured",
                      e.target.checked
                    )
                  }
                />
                ⭐ اختبار مميز
              </label>
            </div>

            {message && (
              <div style={styles.message}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "💾 إنشاء الاختبار"}
            </button>
          </form>
        </section>

        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>
              📚 الاختبارات الحالية
            </h2>

            <span style={styles.counter}>
              {quizzes.length} اختبار
            </span>
          </div>

          {loading ? (
            <div style={styles.empty}>
              جاري تحميل الاختبارات...
            </div>
          ) : quizzes.length === 0 ? (
            <div style={styles.empty}>
              لا توجد اختبارات حتى الآن.
            </div>
          ) : (
            <div style={styles.cards}>
              {quizzes.map((quiz) => (
                <article
                  key={quiz.id}
                  style={styles.card}
                >
                  <div style={styles.badges}>
                    <span
                      style={
                        quiz.status === "published"
                          ? styles.published
                          : styles.draft
                      }
                    >
                      {quiz.status === "published"
                        ? "✅ منشور"
                        : "📝 مسودة"}
                    </span>

                    {quiz.is_featured && (
                      <span style={styles.featured}>
                        ⭐ مميز
                      </span>
                    )}
                  </div>

                  <h3 style={styles.cardTitle}>
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p style={styles.cardText}>
                      {quiz.description}
                    </p>
                  )}

                  <div style={styles.info}>
                    <span>
                      ⏱️{" "}
                      {quiz.time_limit_minutes
                        ? `${quiz.time_limit_minutes} دقيقة`
                        : "بدون وقت"}
                    </span>

                    <span>
                      🔁 {quiz.max_attempts || 1} محاولة
                    </span>
                  </div>

                  <div style={styles.actions}>
                    <a
                      href={`/admin/quizzes/${quiz.id}`}
                      style={styles.questionsButton}
                    >
                      ✏️ إدارة الأسئلة
                    </a>

                    <button
                      type="button"
                      onClick={() => togglePublish(quiz)}
                      style={styles.statusButton}
                    >
                      {quiz.status === "published"
                        ? "إلغاء النشر"
                        : "نشر الاختبار"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteQuiz(quiz.id)}
                      style={styles.deleteButton}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f8fc",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
    padding: "28px 14px 70px",
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "18px",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
  },

  hero: {
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    borderRadius: "24px",
    padding: "28px",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "22px",
    boxShadow: "0 12px 35px rgba(37,99,235,.18)",
  },

  heroIcon: {
    width: "68px",
    height: "68px",
    borderRadius: "20px",
    background: "rgba(255,255,255,.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    flexShrink: 0,
  },

  heroSmall: {
    margin: "0 0 5px",
    opacity: 0.8,
    fontSize: "12px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "28px",
  },

  heroText: {
    margin: "8px 0 0",
    opacity: 0.9,
    fontSize: "14px",
  },

  panel: {
    background: "white",
    border: "1px solid #e7ebf3",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 8px 28px rgba(15,23,42,.05)",
  },

  sectionHeader: {
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
  },

  sectionText: {
    margin: "6px 0 0",
    color: "#7b8496",
    fontSize: "13px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(250px,1fr))",
    gap: "16px",
    marginBottom: "16px",
  },

  threeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(190px,1fr))",
    gap: "16px",
    marginBottom: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "16px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce2ec",
    borderRadius: "11px",
    padding: "12px",
    background: "white",
    outline: "none",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid #dce2ec",
    borderRadius: "11px",
    padding: "12px",
    outline: "none",
    fontSize: "14px",
  },

  optionsBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    padding: "16px",
    background: "#f8faff",
    borderRadius: "13px",
    marginBottom: "16px",
  },

  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  message: {
    background: "#eef7ff",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "14px",
    color: "#24588f",
    fontSize: "13px",
  },

  saveButton: {
    width: "100%",
    border: 0,
    borderRadius: "12px",
    padding: "14px",
    background:
      "linear-gradient(90deg,#2563eb,#7c3aed)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },

  listSection: {
    marginTop: "28px",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },

  counter: {
    background: "#eaf0ff",
    color: "#3159b8",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(280px,1fr))",
    gap: "16px",
  },

  card: {
    background: "white",
    border: "1px solid #e7ebf3",
    borderRadius: "18px",
    padding: "19px",
    boxShadow: "0 6px 20px rgba(15,23,42,.04)",
  },

  badges: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  published: {
    background: "#e9fbf1",
    color: "#16824b",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  draft: {
    background: "#fff7e6",
    color: "#a56300",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  featured: {
    background: "#fff7d6",
    color: "#9a6a00",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  cardTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
  },

  cardText: {
    margin: "0 0 14px",
    color: "#697386",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  info: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#596579",
    marginBottom: "17px",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  questionsButton: {
    background: "#edf3ff",
    color: "#2859b8",
    padding: "9px 12px",
    borderRadius: "9px",
    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "12px",
  },

  statusButton: {
    border: 0,
    background: "#f2edff",
    color: "#6735b5",
    padding: "9px 12px",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
  },

  deleteButton: {
    border: 0,
    background: "#fff0f1",
    color: "#be123c",
    padding: "9px 12px",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
  },

  empty: {
    background: "white",
    border: "1px solid #e7ebf3",
    borderRadius: "16px",
    padding: "35px",
    textAlign: "center",
    color: "#7b8496",
  },
};
