"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ContentPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    content_type: "video",
    content_url: "",
    thumbnail_url: "",
    related_lesson: "",
    status: "published",
    is_featured: false,
    sort_order: 0,
  });

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);

    const { data, error } = await supabase
      .from("learning_content")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      setMessage("❌ تعذر تحميل المحتوى.");
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  function changeField(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function addContent(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setMessage("⚠️ اكتب عنوان المحتوى أولًا.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("learning_content")
      .insert([
        {
          title: form.title.trim(),
          description: form.description.trim() || null,
          content_type: form.content_type,
          content_url: form.content_url.trim() || null,
          thumbnail_url: form.thumbnail_url.trim() || null,
          related_lesson: form.related_lesson.trim() || null,
          status: form.status,
          is_featured: form.is_featured,
          sort_order: Number(form.sort_order) || 0,
        },
      ]);

    if (error) {
      console.error(error);
      setMessage(`❌ ${error?.message || "حدث خطأ غير معروف"}`);
      setSaving(false);
      return;
    }

    setMessage("✅ تمت إضافة المحتوى بنجاح.");

    setForm({
      title: "",
      description: "",
      content_type: "video",
      content_url: "",
      thumbnail_url: "",
      related_lesson: "",
      status: "published",
      is_featured: false,
      sort_order: 0,
    });

    await loadContent();
    setSaving(false);
  }

  async function deleteContent(id) {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا المحتوى؟"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("learning_content")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage("❌ تعذر حذف المحتوى.");
      return;
    }

    setMessage("✅ تم حذف المحتوى.");
    await loadContent();
  }

  function contentTypeName(type) {
    if (type === "video") return "🎬 فيديو";
    if (type === "lesson") return "📘 درس";
    if (type === "article") return "📄 مادة تعليمية";
    if (type === "link") return "🔗 رابط مفيد";

    return "📚 محتوى";
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <a href="/admin" style={styles.back}>
          ← العودة للوحة التحكم
        </a>

        <div style={styles.header}>
          <div style={styles.icon}>🧠</div>

          <div>
            <h1 style={styles.title}>إدارة المحتوى</h1>

            <p style={styles.subtitle}>
              أضف الدروس والفيديوهات والمواد التعليمية للطلاب
            </p>
          </div>
        </div>

        <section style={styles.formCard}>
          <div style={styles.formTitleRow}>
            <div>
              <h2 style={styles.cardTitle}>
                ➕ إضافة محتوى جديد
              </h2>

              <p style={styles.note}>
                أدخل البيانات ثم اضغط حفظ ونشر المحتوى.
              </p>
            </div>
          </div>

          <form onSubmit={addContent} style={styles.form}>
            <div style={styles.columns}>
              <div>
                <label style={styles.label}>
                  عنوان المحتوى *
                </label>

                <input
                  style={styles.input}
                  value={form.title}
                  onChange={(e) =>
                    changeField("title", e.target.value)
                  }
                  placeholder="مثال: كيف يتعلم الذكاء الاصطناعي؟"
                />
              </div>

              <div>
                <label style={styles.label}>
                  نوع المحتوى
                </label>

                <select
                  style={styles.input}
                  value={form.content_type}
                  onChange={(e) =>
                    changeField("content_type", e.target.value)
                  }
                >
                  <option value="video">
                    🎬 فيديو
                  </option>

                  <option value="lesson">
                    📘 درس
                  </option>

                  <option value="article">
                    📄 مادة تعليمية
                  </option>

                  <option value="link">
                    🔗 رابط مفيد
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>
                وصف مختصر
              </label>

              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={(e) =>
                  changeField("description", e.target.value)
                }
                placeholder="اكتب وصفًا بسيطًا ومشوقًا للطلاب..."
              />
            </div>

            <div style={styles.columns}>
              <div>
                <label style={styles.label}>
                  رابط الفيديو أو المحتوى
                </label>

                <input
                  style={styles.input}
                  value={form.content_url}
                  onChange={(e) =>
                    changeField("content_url", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <label style={styles.label}>
                  رابط الصورة المصغرة
                </label>

                <input
                  style={styles.input}
                  value={form.thumbnail_url}
                  onChange={(e) =>
                    changeField("thumbnail_url", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div style={styles.columns}>
              <div>
                <label style={styles.label}>
                  الدرس المرتبط
                </label>

                <input
                  style={styles.input}
                  value={form.related_lesson}
                  onChange={(e) =>
                    changeField("related_lesson", e.target.value)
                  }
                  placeholder="مثال: الدرس الخامس"
                />
              </div>

              <div>
                <label style={styles.label}>
                  حالة المحتوى
                </label>

                <select
                  style={styles.input}
                  value={form.status}
                  onChange={(e) =>
                    changeField("status", e.target.value)
                  }
                >
                  <option value="published">
                    ✅ منشور
                  </option>

                  <option value="draft">
                    📝 مسودة
                  </option>
                </select>
              </div>
            </div>

            <div style={styles.options}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    changeField(
                      "is_featured",
                      e.target.checked
                    )
                  }
                />

                <span>⭐ جعله محتوى مميزًا</span>
              </label>

              <div style={styles.order}>
                <label style={styles.orderLabel}>
                  ترتيب الظهور
                </label>

                <input
                  type="number"
                  min="0"
                  style={styles.numberInput}
                  value={form.sort_order}
                  onChange={(e) =>
                    changeField(
                      "sort_order",
                      e.target.value
                    )
                  }
                />
              </div>
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
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "💾 حفظ ونشر المحتوى"}
            </button>
          </form>
        </section>

        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            📚 المحتوى الحالي
          </h2>

          <span style={styles.count}>
            {items.length} محتوى
          </span>
        </div>

        {loading ? (
          <div style={styles.empty}>
            جاري تحميل المحتوى...
          </div>
        ) : items.length === 0 ? (
          <div style={styles.empty}>
            لا يوجد محتوى حتى الآن
            <br />
            ✨ أضف أول محتوى من النموذج بالأعلى
          </div>
        ) : (
          <div style={styles.grid}>
            {items.map((item) => (
              <article
                key={item.id}
                style={styles.item}
              >
                {item.thumbnail_url && (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    style={styles.image}
                  />
                )}

                <div style={styles.itemBody}>
                  <div style={styles.tags}>
                    <span style={styles.typeBadge}>
                      {contentTypeName(
                        item.content_type
                      )}
                    </span>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background:
                          item.status === "published"
                            ? "#ecfdf3"
                            : "#fff7ed",
                        color:
                          item.status === "published"
                            ? "#067647"
                            : "#b54708",
                      }}
                    >
                      {item.status === "published"
                        ? "✅ منشور"
                        : "📝 مسودة"}
                    </span>
                  </div>

                  <h3 style={styles.itemTitle}>
                    {item.is_featured ? "⭐ " : ""}
                    {item.title}
                  </h3>

                  {item.description && (
                    <p style={styles.description}>
                      {item.description}
                    </p>
                  )}

                  {item.related_lesson && (
                    <div style={styles.lesson}>
                      📚 {item.related_lesson}
                    </div>
                  )}

                  <div style={styles.actions}>
                    {item.content_url && (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.openButton}
                      >
                        فتح المحتوى ↗
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteContent(item.id)
                      }
                      style={styles.deleteButton}
                    >
                      🗑 حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f8fc",
    padding: "30px 16px 70px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "25px",
    textDecoration: "none",
    color: "#2563eb",
    fontWeight: "bold",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },

  icon: {
    fontSize: "38px",
    background: "#eef2ff",
    width: "70px",
    height: "70px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    marginTop: "8px",
    color: "#667085",
    lineHeight: 1.8,
  },

  formCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "20px",
    boxShadow: "0 6px 25px rgba(0,0,0,0.05)",
    marginBottom: "35px",
  },

  formTitleRow: {
    display: "flex",
    justifyContent: "space-between",
  },

  cardTitle: {
    margin: 0,
  },

  note: {
    color: "#667085",
    marginTop: "8px",
  },

  form: {
    display: "grid",
    gap: "18px",
    marginTop: "22px",
  },

  columns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "16px",
  },

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #d0d5dd",
    borderRadius: "11px",
    fontSize: "15px",
    background: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #d0d5dd",
    borderRadius: "11px",
    fontSize: "15px",
    resize: "vertical",
  },

  options: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "15px",
    background: "#f8fafc",
    padding: "15px",
    borderRadius: "12px",
  },

  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontWeight: "bold",
  },

  order: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  orderLabel: {
    fontSize: "14px",
    fontWeight: "bold",
  },

  numberInput: {
    width: "70px",
    padding: "9px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
  },

  message: {
    padding: "12px",
    borderRadius: "10px",
    background: "#eff8ff",
    color: "#175cd3",
    lineHeight: 1.7,
  },

  saveButton: {
    border: 0,
    borderRadius: "12px",
    padding: "15px",
    background:
      "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: 0,
  },

  count: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "7px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
  },

  empty: {
    background: "#fff",
    border: "1px dashed #d0d5dd",
    borderRadius: "18px",
    padding: "45px 20px",
    textAlign: "center",
    color: "#667085",
    lineHeight: 2,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(270px,1fr))",
    gap: "18px",
  },

  item: {
    background: "#fff",
    borderRadius: "17px",
    overflow: "hidden",
    border: "1px solid #eaecf0",
    boxShadow: "0 5px 20px rgba(0,0,0,.04)",
  },

  image: {
    width: "100%",
    height: "175px",
    objectFit: "cover",
    background: "#f2f4f7",
  },

  itemBody: {
    padding: "18px",
  },

  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },

  typeBadge: {
    background: "#eef4ff",
    color: "#3538cd",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  statusBadge: {
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  itemTitle: {
    margin: "14px 0 8px",
    fontSize: "19px",
  },

  description: {
    color: "#667085",
    lineHeight: 1.8,
  },

  lesson: {
    color: "#475467",
    fontSize: "13px",
    marginTop: "10px",
  },

  actions: {
    display: "flex",
    gap: "9px",
    marginTop: "18px",
  },

  openButton: {
    flex: 1,
    textAlign: "center",
    textDecoration: "none",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "10px",
    borderRadius: "9px",
    fontWeight: "bold",
    fontSize: "13px",
  },

  deleteButton: {
    border: 0,
    background: "#fff1f2",
    color: "#be123c",
    padding: "10px 14px",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};