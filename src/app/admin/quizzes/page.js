"use client";

import { useDialogs } from "../../../components/platform/DialogProvider";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { ActionLink, Button, Card, EmptyState, Feedback, Input, PageSurface, Select, StatusBadge, Textarea } from "../../../components/platform/PlatformUI";

import { useCallback, useEffect, useState } from "react";
import { requestAdmin } from "../../../lib/admin/client";

async function requestData() {
  const { data, error } = await requestAdmin("quizzes.list", {});
  return { data, error };
}

export default function AdminQuizzesPage() {
  const { confirmAction } = useDialogs();
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

  const receiveData = useCallback(({ data, error }) => {
    if (error) {
      console.error(error);
      setMessage("تعذر تحميل الاختبارات:" + error.message);
    } else {
      setQuizzes(data || []);
    }

    setLoading(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setMessage("تعذر الاتصال لتحميل البيانات. حاول مرة أخرى لاحقًا.");
    setLoading(false);
  }, []);

  const loadQuizzes = useCallback(() => {
    return requestData().then(receiveData).catch(handleLoadError);
  }, [receiveData, handleLoadError]);

  useEffect(() => {
    let active = true;
    requestData()
      .then((response) => { if (active) receiveData(response); })
      .catch(() => { if (active) handleLoadError(); });
    return () => { active = false; };
  }, [receiveData, handleLoadError]);

  function updateField(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setMessage("اكتب عنوان الاختبار.");
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

    const { error } = await requestAdmin("quizzes.create", payload);

    if (error) {
      console.error(error);
      setMessage("لم يتم حفظ الاختبار:" + error.message);
      setSaving(false);
      return;
    }

    setMessage("تم إنشاء الاختبار بنجاح.");

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

    setLoading(true);
    await loadQuizzes();
    setSaving(false);
  }

  async function deleteQuiz(id) {
    const ok = await confirmAction(
      "هل أنت متأكد من حذف هذا الاختبار؟"
    );

    if (!ok) return;

    setMessage("");

    const { error } = await requestAdmin("quizzes.delete", { id });

    if (error) {
      console.error(error);
      setMessage("تعذر حذف الاختبار:" + error.message);
      return;
    }

    setMessage("تم حذف الاختبار.");
    setLoading(true);
    await loadQuizzes();
  }

  async function togglePublish(quiz) {
    const newStatus =
      quiz.status === "published" ? "draft" : "published";

    const { error } = await requestAdmin("quizzes.publish", { status: newStatus, updated_at: new Date().toISOString(), id: quiz.id });

    if (error) {
      console.error(error);
      setMessage("تعذر تغيير حالة الاختبار:" + error.message);
      return;
    }

    setMessage(
      newStatus === "published"
        ? "تم نشر الاختبار."
        : "تم تحويل الاختبار إلى مسودة."
    );

    setLoading(true);
    await loadQuizzes();
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>


        <section className="platform-hero" style={styles.hero}>
          <div style={styles.heroIcon}><SchoolIcon name="spark" size={32} /></div>

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
          <div className="platform-heading" style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                <SchoolIcon name="pencil" size={22} /> إنشاء اختبار جديد
              </h2>

              <p style={styles.sectionText}>
                أدخل بيانات الاختبار الأساسية.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="platform-grid" style={styles.grid}>
              <div style={styles.field}>
                <label htmlFor="field-adminquizzes-1" style={styles.label}>
                  عنوان الاختبار *
                </label>

                <Input id="field-adminquizzes-1"
                  style={styles.input}
                  value={form.title}
                  onChange={(e) =>
                    updateField("title", e.target.value)
                  }
                  placeholder="مثال: اختبار الذكاء الاصطناعي"
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="field-adminquizzes-2" style={styles.label}>
                  حالة الاختبار
                </label>

                <Select id="field-adminquizzes-2"
                  style={styles.input}
                  value={form.status}
                  onChange={(e) =>
                    updateField("status", e.target.value)
                  }
                >
                  <option value="draft"> مسودة</option>
                  <option value="published"> منشور</option>
                </Select>
              </div>
            </div>

            <div style={styles.field}>
              <label htmlFor="field-adminquizzes-3" style={styles.label}>
                وصف الاختبار
              </label>

              <Textarea id="field-adminquizzes-3"
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
                <label htmlFor="field-adminquizzes-4" style={styles.label}>
                  مدة الاختبار بالدقائق
                </label>

                <Input id="field-adminquizzes-4"
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
                <label htmlFor="field-adminquizzes-5" style={styles.label}>
                  عدد المحاولات
                </label>

                <Input id="field-adminquizzes-5"
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
                <label htmlFor="field-adminquizzes-6" style={styles.label}>
                  ترتيب الظهور
                </label>

                <Input id="field-adminquizzes-6"
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

            <div className="platform-grid" style={styles.grid}>
              <div style={styles.field}>
                <label htmlFor="field-adminquizzes-7" style={styles.label}>
                  بداية الاختبار
                </label>

                <Input id="field-adminquizzes-7"
                  type="datetime-local"
                  style={styles.input}
                  value={form.start_at}
                  onChange={(e) =>
                    updateField("start_at", e.target.value)
                  }
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="field-adminquizzes-8" style={styles.label}>
                  نهاية الاختبار
                </label>

                <Input id="field-adminquizzes-8"
                  type="datetime-local"
                  style={styles.input}
                  value={form.end_at}
                  onChange={(e) =>
                    updateField("end_at", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="platform-grid" style={styles.optionsBox}>
              <label style={styles.checkLabel}>
                <Input
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
                <Input
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
                <Input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    updateField(
                      "is_featured",
                      e.target.checked
                    )
                  }
                />
                <SchoolIcon name="spark" size={22} /> اختبار مميز
              </label>
            </div>

            {message && (
              <Feedback style={styles.message}>
                {message}
              </Feedback>
            )}

            <Button variant="primary" icon="check"
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "إنشاء الاختبار"}
            </Button>
          </form>
        </section>

        <section style={styles.listSection}>
          <div className="platform-heading" style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>
              <SchoolIcon name="book" size={22} /> الاختبارات الحالية
            </h2>

            <StatusBadge style={styles.counter}>
              {quizzes.length} اختبار
            </StatusBadge>
          </div>

          {loading ? (
            <EmptyState loading={true} style={styles.empty}>
              جاري تحميل الاختبارات...
            </EmptyState>
          ) : quizzes.length === 0 ? (
            <EmptyState style={styles.empty}>
              لا توجد اختبارات حتى الآن.
            </EmptyState>
          ) : (
            <div style={styles.cards}>
              {quizzes.map((quiz) => (
                <Card as="article"
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
                        ? "منشور"
                        : "مسودة"}
                    </span>

                    {quiz.is_featured && (
                      <StatusBadge tone="warning" style={styles.featured}>
                        <SchoolIcon name="spark" size={22} /> مميز
                      </StatusBadge>
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
                      <SchoolIcon name="clock" size={22} />{" "}
                      {quiz.time_limit_minutes
                        ? `${quiz.time_limit_minutes} دقيقة`
                        : "بدون وقت"}
                    </span>

                    <span>
                      <SchoolIcon name="spark" size={22} /> {quiz.max_attempts || 1} محاولة
                    </span>
                  </div>

                  <div style={styles.actions}>
                    <ActionLink className="platform-grid"
                      href={`/admin/quizzes/${quiz.id}`}
                      style={styles.questionsButton}
                    >
                      <SchoolIcon name="spark" size={22} /> إدارة الأسئلة
                    </ActionLink>

                    <Button variant="primary" icon="shield"
                      type="button"
                      onClick={() => togglePublish(quiz)}
                      style={styles.statusButton}
                    >
                      {quiz.status === "published"
                        ? "إلغاء النشر"
                        : "نشر الاختبار"}
                    </Button>

                    <Button variant="danger" icon="trash"
                      type="button"
                      onClick={() => deleteQuiz(quiz.id)}
                      style={styles.deleteButton}
                    >
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    padding: "28px 14px 70px",
  },

  container: {
    maxWidth: "1150px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "18px",
    color: "var(--copper-ink)",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
  },

  hero: {
    background:
      "var(--gold-soft)",
    borderRadius: "24px",
    padding: "28px",
    color: "var(--ink)",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "22px",
    boxShadow: "var(--shadow-sm)",
  },

  heroIcon: {
    width: "68px",
    height: "68px",
    borderRadius: "20px",
    background: "rgba(255,255,255,.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(26px, 4vw, 34px)",
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
    border: "1px solid var(--line)",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "var(--shadow-sm)",
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
    color: "var(--muted)",
    fontSize: "13px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 250px),1fr))",
    gap: "16px",
    marginBottom: "16px",
  },

  threeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 190px),1fr))",
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
    border: "1px solid var(--line)",
    borderRadius: "11px",
    padding: "12px",
    background: "white",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    resize: "vertical",
    boxSizing: "border-box",
    border: "1px solid var(--line)",
    borderRadius: "11px",
    padding: "12px",
    fontSize: "14px",
  },

  optionsBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    padding: "16px",
    background: "var(--surface-soft)",
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
    background: "var(--surface-soft)",
    padding: "12px 14px",
    borderRadius: "10px",
    marginBottom: "14px",
    color: "var(--copper-ink)",
    fontSize: "13px",
  },

  saveButton: {
    width: "100%",
    border: 0,
    borderRadius: "12px",
    padding: "14px",
    background:
      "var(--gold-soft)",
    color: "var(--ink)",
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
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    borderRadius: "999px",
    padding: "6px 11px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 280px),1fr))",
    gap: "16px",
  },

  card: {
    background: "white",
    border: "1px solid var(--line)",
    borderRadius: "18px",
    padding: "19px",
    boxShadow: "var(--shadow-sm)",
  },

  badges: {
    display: "flex",
    gap: "7px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  published: {
    background: "var(--surface-soft)",
    color: "var(--success)",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  draft: {
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  featured: {
    background: "var(--surface-soft)",
    color: "var(--danger)",
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
    color: "var(--muted)",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  info: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "var(--muted)",
    marginBottom: "17px",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  questionsButton: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "9px 12px",
    borderRadius: "9px",
    fontWeight: "bold",
    textDecoration: "none",
    fontSize: "12px",
  },

  statusButton: {
    border: 0,
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "9px 12px",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
  },

  deleteButton: {
    border: 0,
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "9px 12px",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
  },

  empty: {
    background: "white",
    border: "1px solid var(--line)",
    borderRadius: "16px",
    padding: "35px",
    textAlign: "center",
    color: "var(--muted)",
  },
};
