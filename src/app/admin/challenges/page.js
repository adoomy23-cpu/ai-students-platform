"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  async function loadChallenges() {
    setLoading(true);

    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });

    if (!error) setChallenges(data || []);

    setLoading(false);
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <a href="/" style={styles.back}>
          ← العودة للرئيسية
        </a>

        <section style={styles.hero}>
          <div>
            <div style={styles.smallTitle}>منصة الذكاء الاصطناعي</div>
            <h1 style={styles.title}>🏆 تحديات الذكاء الاصطناعي</h1>
            <p style={styles.subtitle}>
              اختر تحديًا، أطلق إبداعك، وشاركنا أفضل أعمالك ✨
            </p>
          </div>

          <div style={styles.heroIcon}>🚀</div>
        </section>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>التحديات المتاحة</h2>
            <p style={styles.sectionText}>
              شارك في التحديات واجمع الإنجازات
            </p>
          </div>

          <div style={styles.count}>
            {challenges.length} تحدي
          </div>
        </div>

        {loading ? (
          <div style={styles.message}>جاري تحميل التحديات...</div>
        ) : challenges.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🏆</div>
            <h3>لا توجد تحديات منشورة حاليًا</h3>
            <p>ترقب التحديات القادمة قريبًا 🚀</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {challenges.map((challenge) => (
              <article key={challenge.id} style={styles.card}>
                {challenge.cover_image_url ? (
                  <img
                    src={challenge.cover_image_url}
                    alt=""
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}>💡</div>
                )}

                <div style={styles.cardBody}>
                  <div style={styles.badges}>
                    {challenge.is_featured && (
                      <span style={styles.featured}>⭐ تحدي مميز</span>
                    )}

                    <span style={styles.score}>
                      🎯 {challenge.max_score} درجة
                    </span>
                  </div>

                  <h3 style={styles.cardTitle}>{challenge.title}</h3>

                  {challenge.description && (
                    <p style={styles.description}>
                      {challenge.description}
                    </p>
                  )}

                  <div style={styles.allowed}>
                    {challenge.allow_text && <span>✍️ نص</span>}
                    {challenge.allow_image && <span>🖼️ صورة</span>}
                    {challenge.allow_file && <span>📎 ملف</span>}
                  </div>

                  <a
                    href={`/challenges/${challenge.id}`}
                    style={styles.button}
                  >
                    ابدأ التحدي 🚀
                  </a>
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
    background: "#f5f7ff",
    padding: "24px 14px 60px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "18px",
    textDecoration: "none",
    color: "#3159d9",
    background: "#fff",
    padding: "10px 16px",
    borderRadius: "12px",
    boxShadow: "0 4px 18px rgba(0,0,0,.05)",
  },

  hero: {
    background:
      "linear-gradient(135deg, #2563eb 0%, #6d3df5 100%)",
    borderRadius: "24px",
    padding: "30px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 12px 30px rgba(63,70,220,.18)",
  },

  smallTitle: {
    opacity: 0.8,
    fontSize: "13px",
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize: "clamp(25px,5vw,38px)",
  },

  subtitle: {
    margin: "12px 0 0",
    opacity: 0.9,
    lineHeight: 1.8,
  },

  heroIcon: {
    fontSize: "58px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "30px 2px 18px",
    gap: "15px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  sectionText: {
    margin: "5px 0 0",
    color: "#7b8499",
    fontSize: "14px",
  },

  count: {
    background: "#e9edff",
    color: "#4058c9",
    padding: "8px 13px",
    borderRadius: "20px",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: "18px",
  },

  card: {
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 7px 25px rgba(20,30,70,.07)",
    border: "1px solid #edf0f8",
  },

  image: {
    width: "100%",
    height: "190px",
    objectFit: "cover",
    display: "block",
  },

  imagePlaceholder: {
    height: "190px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "65px",
    background:
      "linear-gradient(135deg,#eef4ff,#f4edff)",
  },

  cardBody: {
    padding: "20px",
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "13px",
  },

  featured: {
    background: "#fff6d8",
    color: "#946c00",
    padding: "6px 9px",
    borderRadius: "9px",
    fontSize: "12px",
  },

  score: {
    background: "#eef5ff",
    color: "#3159d9",
    padding: "6px 9px",
    borderRadius: "9px",
    fontSize: "12px",
  },

  cardTitle: {
    margin: "0 0 9px",
    fontSize: "20px",
  },

  description: {
    color: "#687186",
    lineHeight: 1.8,
    minHeight: "48px",
  },

  allowed: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    color: "#687186",
    fontSize: "13px",
    margin: "15px 0",
  },

  button: {
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    background:
      "linear-gradient(90deg,#2864ed,#7b35ee)",
    color: "#fff",
    padding: "13px",
    borderRadius: "12px",
    fontWeight: "bold",
  },

  message: {
    background: "#fff",
    padding: "35px",
    borderRadius: "18px",
    textAlign: "center",
  },

  empty: {
    background: "#fff",
    padding: "55px 20px",
    borderRadius: "20px",
    textAlign: "center",
    color: "#687186",
  },

  emptyIcon: {
    fontSize: "55px",
    marginBottom: "10px",
  },
};