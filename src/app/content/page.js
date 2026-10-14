"use client";

import SchoolIcon from "../../components/brand/SchoolIcon";
import { Card, EmptyState, Feedback, PageSurface, StatusBadge } from "../../components/platform/PlatformUI";

import ContentImage from "../../components/ui/ContentImage";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

async function requestData() {
  const { data, error } = await supabase
      .from("learning_content")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
  return { data, error };
}

export default function ContentPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const receiveData = useCallback(({ data, error }) => {
    if (error) {
      console.error(error);
      setError("تعذر تحميل المحتوى حاليًا.");
      setLoading(false);
      return;
    }

    setError("");
    setItems(data || []);
    setLoading(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setError("تعذر الاتصال لتحميل البيانات. حاول مرة أخرى لاحقًا.");
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    requestData()
      .then((response) => { if (active) receiveData(response); })
      .catch(() => { if (active) handleLoadError(); });
    return () => { active = false; };
  }, [receiveData, handleLoadError]);

  function typeName(type) {
    if (type === "video") return "فيديو";
    if (type === "lesson") return "درس";
    if (type === "activity") return "نشاط";
    if (type === "link") return "رابط";
    return "محتوى";
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>



        <section className="platform-hero" style={styles.hero}>
          <div style={styles.heroIcon}><SchoolIcon name="spark" size={32} /></div>

          <div>
            <p style={styles.small}>منصة الذكاء الاصطناعي</p>
            <h1 style={styles.title}>المحتوى التعليمي</h1>
            <p style={styles.subtitle}>
              تعلّم واكتشف من خلال الدروس والفيديوهات والأنشطة الممتعة
            </p>
          </div>
        </section>

        <div className="platform-heading" style={styles.sectionHeader}>
          <h2 style={styles.heading}><SchoolIcon name="book" size={22} /> استكشف المحتوى</h2>

          {!loading && (
            <StatusBadge style={styles.count}>
              {items.length} محتوى
            </StatusBadge>
          )}
        </div>

        {loading && (
          <Feedback style={styles.message}>
            <SchoolIcon name="spark" size={22} /> جاري تحميل المحتوى...
          </Feedback>
        )}

        {error && (
          <Feedback tone="error" style={styles.error}>
            <SchoolIcon name="spark" size={22} /> {error}
          </Feedback>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState style={styles.empty}>

            <h3>لا يوجد محتوى منشور حاليًا</h3>
            <p>سيتم إضافة محتوى جديد قريبًا.</p>
          </EmptyState>
        )}

        <div className="platform-grid" style={styles.grid}>
          {items.map((item) => (
            <Card as="article" key={item.id} style={styles.card}>

              {(item.thumbnail_url || (item.content_url && (item.content_url.includes("youtube.com") || item.content_url.includes("youtu.be")))) && (
                <ContentImage
                  src={
                    item.thumbnail_url ||
                    `https://img.youtube.com/vi/${
                      item.content_url.includes("youtu.be/")
                        ? item.content_url.split("youtu.be/")[1]?.split("?")[0]
                        : new URL(item.content_url).searchParams.get("v")
                    }/hqdefault.jpg`
                  }
                  alt={item.title}
                  style={styles.image}
                />
              )}

              <div style={styles.cardBody}>
                <StatusBadge style={styles.badge}>
                  {typeName(item.content_type)}
                </StatusBadge>

                {item.is_featured && (
                  <StatusBadge tone="warning" style={styles.featured}>
                    <SchoolIcon name="spark" size={22} /> مميز
                  </StatusBadge>
                )}

                <h3 style={styles.cardTitle}>
                  {item.title}
                </h3>

                {item.description && (
                  <p style={styles.description}>
                    {item.description}
                  </p>
                )}

                {item.related_lesson && (
                  <p style={styles.lesson}>
                    <SchoolIcon name="spark" size={22} /> {item.related_lesson}
                  </p>
                )}

                {item.content_url && (
                  <a
                    href={item.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.openButton}
                  >
                    فتح المحتوى ←
                  </a>
                )}
              </div>

            </Card>
          ))}
        </div>

      </div>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
    padding: "24px 16px 36px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "22px",
    color: "var(--copper-ink)",
    textDecoration: "none",
    fontWeight: "bold",
  },

  hero: {
    background:
      "var(--gold-soft)",
    borderRadius: "24px",
    padding: "32px",
    color: "var(--ink)",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "var(--shadow-sm)",
  },

  heroIcon: {
    fontSize: "50px",
  },

  small: {
    margin: "0 0 6px",
    opacity: 0.85,
    fontSize: "14px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
  },

  subtitle: {
    margin: "10px 0 0",
    opacity: 0.9,
    lineHeight: 1.8,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "35px",
    marginBottom: "18px",
  },

  heading: {
    margin: 0,
    fontSize: "23px",
  },

  count: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "7px 13px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "20px",
  },

  card: {
    background: "white",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow-sm)",
  },

  image: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    display: "block",
  },

  cardBody: {
    padding: "20px",
  },

  badge: {
    display: "inline-block",
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
    marginLeft: "7px",
  },

  featured: {
    display: "inline-block",
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "13px",
  },

  cardTitle: {
    fontSize: "20px",
    margin: "16px 0 8px",
  },

  description: {
    color: "var(--muted)",
    lineHeight: 1.8,
    margin: "0 0 12px",
  },

  lesson: {
    color: "var(--muted)",
    fontSize: "14px",
    marginBottom: "16px",
  },

  openButton: {
    display: "block",
    textAlign: "center",
    background: "var(--gold-soft)",
    color: "var(--ink)",
    padding: "11px",
    borderRadius: "11px",
    textDecoration: "none",
    fontWeight: "bold",
    marginTop: "15px",
  },

  message: {
    background: "white",
    padding: "35px",
    textAlign: "center",
    borderRadius: "18px",
  },

  error: {
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center",
  },

  empty: {
    background: "white",
    padding: "50px 20px",
    borderRadius: "18px",
    textAlign: "center",
    color: "var(--muted)",
    border: "1px dashed var(--line)",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },
};
