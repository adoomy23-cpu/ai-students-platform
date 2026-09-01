"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ContentPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("learning_content")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError("تعذر تحميل المحتوى حاليًا.");
      setLoading(false);
      return;
    }

    setItems(data || []);
    setLoading(false);
  }

  function typeName(type) {
    if (type === "video") return "🎬 فيديو";
    if (type === "lesson") return "📘 درس";
    if (type === "activity") return "🎯 نشاط";
    if (type === "link") return "🔗 رابط";
    return "🧠 محتوى";
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>

        <a href="/" style={styles.back}>
          ← العودة للرئيسية
        </a>

        <section style={styles.hero}>
          <div style={styles.heroIcon}>🧠</div>

          <div>
            <p style={styles.small}>منصة الذكاء الاصطناعي</p>
            <h1 style={styles.title}>المحتوى التعليمي</h1>
            <p style={styles.subtitle}>
              تعلّم واكتشف من خلال الدروس والفيديوهات والأنشطة الممتعة
            </p>
          </div>
        </section>

        <div style={styles.sectionHeader}>
          <h2 style={styles.heading}>📚 استكشف المحتوى</h2>

          {!loading && (
            <span style={styles.count}>
              {items.length} محتوى
            </span>
          )}
        </div>

        {loading && (
          <div style={styles.message}>
            ⏳ جاري تحميل المحتوى...
          </div>
        )}

        {error && (
          <div style={styles.error}>
            ❌ {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✨</div>
            <h3>لا يوجد محتوى منشور حاليًا</h3>
            <p>سيتم إضافة محتوى جديد قريبًا.</p>
          </div>
        )}

        <div style={styles.grid}>
          {items.map((item) => (
            <article key={item.id} style={styles.card}>

              {(item.thumbnail_url || (item.content_url && (item.content_url.includes("youtube.com") || item.content_url.includes("youtu.be")))) && (
                <img
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
                <span style={styles.badge}>
                  {typeName(item.content_type)}
                </span>

                {item.is_featured && (
                  <span style={styles.featured}>
                    ⭐ مميز
                  </span>
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
                    📖 {item.related_lesson}
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

            </article>
          ))}
        </div>

      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f9fc",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
    padding: "30px 16px 60px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "22px",
    color: "#315bea",
    textDecoration: "none",
    fontWeight: "bold",
  },

  hero: {
    background:
      "linear-gradient(135deg, #2458e8 0%, #6c4df6 100%)",
    borderRadius: "24px",
    padding: "32px",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 12px 35px rgba(49,91,234,0.18)",
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
    background: "#e9efff",
    color: "#315bea",
    padding: "7px 13px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "white",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #e7ebf3",
    boxShadow: "0 6px 22px rgba(0,0,0,0.05)",
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
    background: "#eef2ff",
    color: "#315bea",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "bold",
    marginLeft: "7px",
  },

  featured: {
    display: "inline-block",
    background: "#fff6d8",
    color: "#8a6200",
    padding: "6px 11px",
    borderRadius: "20px",
    fontSize: "13px",
  },

  cardTitle: {
    fontSize: "20px",
    margin: "16px 0 8px",
  },

  description: {
    color: "#667085",
    lineHeight: 1.8,
    margin: "0 0 12px",
  },

  lesson: {
    color: "#667085",
    fontSize: "14px",
    marginBottom: "16px",
  },

  openButton: {
    display: "block",
    textAlign: "center",
    background: "linear-gradient(135deg,#315bea,#714ff6)",
    color: "white",
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
    background: "#fff1f1",
    color: "#a52a2a",
    padding: "20px",
    borderRadius: "15px",
    textAlign: "center",
  },

  empty: {
    background: "white",
    padding: "50px 20px",
    borderRadius: "18px",
    textAlign: "center",
    color: "#667085",
    border: "1px dashed #ccd4e4",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },
};