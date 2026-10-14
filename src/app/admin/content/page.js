"use client";

import { useDialogs } from "../../../components/platform/DialogProvider";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { Button, Card, EmptyState, Feedback, Input, PageSurface, Select, StatusBadge, Textarea } from "../../../components/platform/PlatformUI";

import ContentImage from "../../../components/ui/ContentImage";
import { useCallback, useEffect, useState } from "react";
import { requestAdmin } from "../../../lib/admin/client";

async function requestData() {
  const { data, error } = await requestAdmin("content.list", {});
  return { data, error };
}

export default function ContentPage() {
  const { confirmAction } = useDialogs();
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

  const receiveData = useCallback(({ data, error }) => {
    if (error) {
      console.error(error);
      setMessage("تعذر تحميل المحتوى.");
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setMessage("تعذر الاتصال لتحميل البيانات. حاول مرة أخرى لاحقًا.");
    setLoading(false);
  }, []);

  const loadContent = useCallback(() => {
    return requestData().then(receiveData).catch(handleLoadError);
  }, [receiveData, handleLoadError]);

  useEffect(() => {
    let active = true;
    requestData()
      .then((response) => { if (active) receiveData(response); })
      .catch(() => { if (active) handleLoadError(); });
    return () => { active = false; };
  }, [receiveData, handleLoadError]);

  function changeField(name, value) {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function addContent(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setMessage("اكتب عنوان المحتوى أولًا.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await requestAdmin("content.create", {
          title: form.title.trim(),
          description: form.description.trim() || null,
          content_type: form.content_type,
          content_url: form.content_url.trim() || null,
          thumbnail_url: form.thumbnail_url.trim() || null,
          related_lesson: form.related_lesson.trim() || null,
          status: form.status,
          is_featured: form.is_featured,
          sort_order: Number(form.sort_order) || 0,
        });

    if (error) {
      console.error(error);
      setMessage(` ${error?.message || "حدث خطأ غير معروف"}`);
      setSaving(false);
      return;
    }

    setMessage("تمت إضافة المحتوى بنجاح.");

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

    setLoading(true);
    await loadContent();
    setSaving(false);
  }

  async function deleteContent(id) {
    const confirmed = await confirmAction(
      "هل أنت متأكد من حذف هذا المحتوى؟"
    );

    if (!confirmed) return;

    const { error } = await requestAdmin("content.delete", { id });

    if (error) {
      console.error(error);
      setMessage("تعذر حذف المحتوى.");
      return;
    }

    setMessage("تم حذف المحتوى.");
    setLoading(true);
    await loadContent();
  }

  function contentTypeName(type) {
    if (type === "video") return "فيديو";
    if (type === "lesson") return "درس";
    if (type === "article") return "مادة تعليمية";
    if (type === "link") return "رابط مفيد";

    return "محتوى";
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>


        <div className="platform-heading" style={styles.header}>
          <div style={styles.icon}><SchoolIcon name="spark" size={32} /></div>

          <div>
            <h1 style={styles.title}>إدارة المحتوى</h1>

            <p style={styles.subtitle}>
              أضف الدروس والفيديوهات والمواد التعليمية للطلاب
            </p>
          </div>
        </div>

        <Card as="section" style={styles.formCard}>
          <div style={styles.formTitleRow}>
            <div>
              <h2 style={styles.cardTitle}>
                <SchoolIcon name="pencil" size={22} /> إضافة محتوى جديد
              </h2>

              <p style={styles.note}>
                أدخل البيانات ثم اضغط حفظ ونشر المحتوى.
              </p>
            </div>
          </div>

          <form onSubmit={addContent} style={styles.form}>
            <div className="platform-columns" style={styles.columns}>
              <div>
                <label htmlFor="field-admincontent-1" style={styles.label}>
                  عنوان المحتوى *
                </label>

                <Input id="field-admincontent-1"
                  style={styles.input}
                  value={form.title}
                  onChange={(e) =>
                    changeField("title", e.target.value)
                  }
                  placeholder="مثال: كيف يتعلم الذكاء الاصطناعي؟"
                />
              </div>

              <div>
                <label htmlFor="field-admincontent-2" style={styles.label}>
                  نوع المحتوى
                </label>

                <Select id="field-admincontent-2"
                  style={styles.input}
                  value={form.content_type}
                  onChange={(e) =>
                    changeField("content_type", e.target.value)
                  }
                >
                  <option value="video">
                     فيديو
                  </option>

                  <option value="lesson">
                     درس
                  </option>

                  <option value="article">
                     مادة تعليمية
                  </option>

                  <option value="link">
                     رابط مفيد
                  </option>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="field-admincontent-3" style={styles.label}>
                وصف مختصر
              </label>

              <Textarea id="field-admincontent-3"
                style={styles.textarea}
                value={form.description}
                onChange={(e) =>
                  changeField("description", e.target.value)
                }
                placeholder="اكتب وصفًا بسيطًا ومشوقًا للطلاب..."
              />
            </div>

            <div className="platform-columns" style={styles.columns}>
              <div>
                <label htmlFor="field-admincontent-4" style={styles.label}>
                  رابط الفيديو أو المحتوى
                </label>

                <Input id="field-admincontent-4"
                  style={styles.input}
                  value={form.content_url}
                  onChange={(e) =>
                    changeField("content_url", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="field-admincontent-5" style={styles.label}>
                  رابط الصورة المصغرة
                </label>

                <Input id="field-admincontent-5"
                  style={styles.input}
                  value={form.thumbnail_url}
                  onChange={(e) =>
                    changeField("thumbnail_url", e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="platform-columns" style={styles.columns}>
              <div>
                <label htmlFor="field-admincontent-6" style={styles.label}>
                  الدرس المرتبط
                </label>

                <Input id="field-admincontent-6"
                  style={styles.input}
                  value={form.related_lesson}
                  onChange={(e) =>
                    changeField("related_lesson", e.target.value)
                  }
                  placeholder="مثال: الدرس الخامس"
                />
              </div>

              <div>
                <label htmlFor="field-admincontent-7" style={styles.label}>
                  حالة المحتوى
                </label>

                <Select id="field-admincontent-7"
                  style={styles.input}
                  value={form.status}
                  onChange={(e) =>
                    changeField("status", e.target.value)
                  }
                >
                  <option value="published">
                     منشور
                  </option>

                  <option value="draft">
                     مسودة
                  </option>
                </Select>
              </div>
            </div>

            <div className="platform-grid" style={styles.options}>
              <label style={styles.checkbox}>
                <Input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    changeField(
                      "is_featured",
                      e.target.checked
                    )
                  }
                />

                <span><SchoolIcon name="spark" size={22} /> جعله محتوى مميزًا</span>
              </label>

              <div style={styles.order}>
                <label htmlFor="field-admincontent-8" style={styles.orderLabel}>
                  ترتيب الظهور
                </label>

                <Input id="field-admincontent-8"
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
              <Feedback style={styles.message}>
                {message}
              </Feedback>
            )}

            <Button variant="primary" icon="check"
              type="submit"
              disabled={saving}
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "حفظ ونشر المحتوى"}
            </Button>
          </form>
        </Card>

        <div className="platform-heading" style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            <SchoolIcon name="book" size={22} /> المحتوى الحالي
          </h2>

          <StatusBadge style={styles.count}>
            {items.length} محتوى
          </StatusBadge>
        </div>

        {loading ? (
          <EmptyState loading={true} style={styles.empty}>
            جاري تحميل المحتوى...
          </EmptyState>
        ) : items.length === 0 ? (
          <EmptyState style={styles.empty}>
            لا يوجد محتوى حتى الآن
            <br />
            <SchoolIcon name="spark" size={22} /> أضف أول محتوى من النموذج بالأعلى
          </EmptyState>
        ) : (
          <div className="platform-grid" style={styles.grid}>
            {items.map((item) => (
              <article
                key={item.id}
                style={styles.item}
              >
                {item.thumbnail_url && (
                  <ContentImage
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
                        ? "منشور"
                        : "مسودة"}
                    </span>
                  </div>

                  <h3 style={styles.itemTitle}>
                    <SchoolIcon name={item.is_featured ? "check" : "spark"} size={18} />
                    {item.title}
                  </h3>

                  {item.description && (
                    <p style={styles.description}>
                      {item.description}
                    </p>
                  )}

                  {item.related_lesson && (
                    <div style={styles.lesson}>
                      <SchoolIcon name="book" size={22} /> {item.related_lesson}
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
                        فتح المحتوى <SchoolIcon name="spark" size={22} />
                      </a>
                    )}

                    <Button variant="danger" icon="trash"
                      type="button"
                      onClick={() =>
                        deleteContent(item.id)
                      }
                      style={styles.deleteButton}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    padding: "24px 16px 36px",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "25px",
    textDecoration: "none",
    color: "var(--copper-ink)",
    fontWeight: "bold",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },

  icon: {
    fontSize: "clamp(26px, 4vw, 34px)",
    background: "var(--surface-soft)",
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
    color: "var(--muted)",
    lineHeight: 1.8,
  },

  formCard: {
    background: "var(--surface)",
    padding: "25px",
    borderRadius: "20px",
    boxShadow: "var(--shadow-sm)",
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
    color: "var(--muted)",
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
      "repeat(auto-fit,minmax(min(100%, 240px),1fr))",
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
    border: "1px solid var(--line)",
    borderRadius: "11px",
    fontSize: "15px",
    background: "var(--surface)",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid var(--line)",
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
    background: "var(--surface-soft)",
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
    border: "1px solid var(--line)",
    borderRadius: "9px",
  },

  message: {
    padding: "12px",
    borderRadius: "10px",
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    lineHeight: 1.7,
  },

  saveButton: {
    border: 0,
    borderRadius: "12px",
    padding: "15px",
    background:
      "var(--gold-soft)",
    color: "var(--ink)",
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
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "7px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
  },

  empty: {
    background: "var(--surface)",
    border: "1px dashed var(--line)",
    borderRadius: "18px",
    padding: "45px 20px",
    textAlign: "center",
    color: "var(--muted)",
    lineHeight: 2,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 270px),1fr))",
    gap: "18px",
  },

  item: {
    background: "var(--surface)",
    borderRadius: "17px",
    overflow: "hidden",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-sm)",
  },

  image: {
    width: "100%",
    height: "175px",
    objectFit: "cover",
    background: "var(--surface-soft)",
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
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
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
    color: "var(--muted)",
    lineHeight: 1.8,
  },

  lesson: {
    color: "var(--muted)",
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
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "10px",
    borderRadius: "9px",
    fontWeight: "bold",
    fontSize: "13px",
  },

  deleteButton: {
    border: 0,
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "10px 14px",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
