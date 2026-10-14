"use client";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { ActionLink, Card, EmptyState, Feedback, PageSurface, StatusBadge } from "../../../components/platform/PlatformUI";

import ContentImage from "../../../components/ui/ContentImage";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

async function requestData() {
  const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });
  return { data, error };
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const receiveData = useCallback(({ data, error }) => {
    if (error) {
      setError("تعذر تحميل التحديات. حاول مرة أخرى لاحقًا.");
    } else {
      setError("");
      setChallenges(data || []);
    }

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

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>


        <section className="platform-hero" style={styles.hero}>
          <div>
            <div style={styles.smallTitle}>منصة الذكاء الاصطناعي</div>
            <h1 style={styles.title}><SchoolIcon name="trophy" size={22} /> تحديات الذكاء الاصطناعي</h1>
            <p style={styles.subtitle}>
              اختر تحديًا، أطلق إبداعك، وشاركنا أفضل أعمالك <SchoolIcon name="spark" size={22} />
            </p>
          </div>

          <div style={styles.heroIcon}><SchoolIcon name="rocket" size={32} /></div>
        </section>

        <div className="platform-heading" style={styles.sectionHeader}>
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
          <Feedback style={styles.message}>جاري تحميل التحديات...</Feedback>
        ) : error ? (
          <Feedback tone="error" role="alert" style={styles.message}>{error}</Feedback>
        ) : challenges.length === 0 ? (
          <EmptyState style={styles.empty}>

            <h3>لا توجد تحديات منشورة حاليًا</h3>
            <p>ترقب التحديات القادمة قريبًا <SchoolIcon name="rocket" size={22} /></p>
          </EmptyState>
        ) : (
          <div className="platform-grid" style={styles.grid}>
            {challenges.map((challenge) => (
              <Card as="article" key={challenge.id} style={styles.card}>
                {challenge.cover_image_url ? (
                  <ContentImage
                    src={challenge.cover_image_url}
                    alt=""
                    style={styles.image}
                  />
                ) : (
                  <div style={styles.imagePlaceholder}><SchoolIcon name="spark" size={22} /></div>
                )}

                <div style={styles.cardBody}>
                  <div style={styles.badges}>
                    {challenge.is_featured && (
                      <StatusBadge tone="warning" style={styles.featured}><SchoolIcon name="spark" size={22} /> تحدي مميز</StatusBadge>
                    )}

                    <StatusBadge style={styles.score}>
                      <SchoolIcon name="compass" size={22} /> {challenge.max_score} درجة
                    </StatusBadge>
                  </div>

                  <h3 style={styles.cardTitle}>{challenge.title}</h3>

                  {challenge.description && (
                    <p style={styles.description}>
                      {challenge.description}
                    </p>
                  )}

                  <div style={styles.allowed}>
                    {challenge.allow_text && <span><SchoolIcon name="pencil" size={22} /> نص</span>}
                    {challenge.allow_image && <span><SchoolIcon name="image" size={22} /> صورة</span>}
                    {challenge.allow_file && <span><SchoolIcon name="paperclip" size={22} /> ملف</span>}
                  </div>

                  <ActionLink
                    href={`/challenges/${challenge.id}`}
                    style={styles.button}
                  >
                    ابدأ التحدي <SchoolIcon name="rocket" size={22} />
                  </ActionLink>
                </div>
              </Card>
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
    padding: "24px 14px 60px",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "18px",
    textDecoration: "none",
    color: "var(--copper-ink)",
    background: "var(--surface)",
    padding: "10px 16px",
    borderRadius: "12px",
    boxShadow: "var(--shadow-sm)",
  },

  hero: {
    background:
      "var(--gold-soft)",
    borderRadius: "24px",
    padding: "30px",
    color: "var(--ink)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow: "var(--shadow-sm)",
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
    color: "var(--muted)",
    fontSize: "14px",
  },

  count: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "8px 13px",
    borderRadius: "20px",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 280px),1fr))",
    gap: "18px",
  },

  card: {
    background: "var(--surface)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--line)",
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
      "var(--gold-soft)",
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
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "6px 9px",
    borderRadius: "9px",
    fontSize: "12px",
  },

  score: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "6px 9px",
    borderRadius: "9px",
    fontSize: "12px",
  },

  cardTitle: {
    margin: "0 0 9px",
    fontSize: "20px",
  },

  description: {
    color: "var(--muted)",
    lineHeight: 1.8,
    minHeight: "48px",
  },

  allowed: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    color: "var(--muted)",
    fontSize: "13px",
    margin: "15px 0",
  },

  button: {
    display: "block",
    textAlign: "center",
    textDecoration: "none",
    background:
      "var(--gold-soft)",
    color: "var(--ink)",
    padding: "13px",
    borderRadius: "12px",
    fontWeight: "bold",
  },

  message: {
    background: "var(--surface)",
    padding: "35px",
    borderRadius: "18px",
    textAlign: "center",
  },

  empty: {
    background: "var(--surface)",
    padding: "55px 20px",
    borderRadius: "20px",
    textAlign: "center",
    color: "var(--muted)",
  },

  emptyIcon: {
    fontSize: "55px",
    marginBottom: "10px",
  },
};
