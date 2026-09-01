"use client";

import { useState } from "react";

export default function AdminPage() {
  const [active, setActive] = useState("الرئيسية");

  const sections = [
    {
      icon: "🏠",
      title: "الرئيسية",
      desc: "نظرة عامة على المنصة",
      href: null,
    },
    {
      icon: "🧠",
      title: "المحتوى",
      desc: "إضافة وإدارة الدروس والفيديوهات",
      href: "/admin/content",
    },
    {
      icon: "✅",
      title: "الاختبارات",
      desc: "إنشاء وإدارة الاختبارات",
      href: null,
    },
    {
      icon: "📊",
      title: "نتائج الاختبارات",
      desc: "عرض درجات الطلاب ومحاولاتهم",
      href: "/admin/results",
    },
    {
      icon: "🏆",
      title: "التحديات",
      desc: "المسابقات والتحديات وسؤال الأسبوع",
      href: null,
    },
    {
      icon: "📤",
      title: "أعمال الطلاب",
      desc: "مراجعة المشاركات والأعمال المرسلة",
      href: null,
    },
    {
      icon: "⭐",
      title: "لوحة الشرف",
      desc: "عرض الطلاب والأعمال المتميزة",
      href: null,
    },
    {
      icon: "📢",
      title: "الإعلانات",
      desc: "نشر الأخبار والتنبيهات للطلاب",
      href: null,
    },
    {
      icon: "🏅",
      title: "الشارات والإنجازات",
      desc: "تحفيز الطلاب بالشارات والإنجازات",
      href: null,
    },
    {
      icon: "📊",
      title: "الإحصائيات",
      desc: "متابعة الزيارات والتفاعل والمشاهدات",
      href: null,
    },
    {
      icon: "🎨",
      title: "هوية المنصة",
      desc: "الشعار والألوان والعبارات الترحيبية",
      href: null,
    },
    {
      icon: "⚙️",
      title: "الإعدادات",
      desc: "إدارة الإعدادات العامة للمنصة",
      href: null,
    },
  ];

  function handleSection(section) {
    if (section.href) {
      window.location.href = section.href;
      return;
    }

    setActive(section.title);
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <p style={styles.heroSmall}>منصة الذكاء الاصطناعي</p>

            <h1 style={styles.heroTitle}>
              👨‍🏫 لوحة تحكم المعلم
            </h1>

            <p style={styles.heroText}>
              تحكم في محتوى المنصة والطلاب من مكان واحد
            </p>
          </div>

          <a href="/" style={styles.studentButton}>
            عرض منصة الطلاب ←
          </a>
        </section>

        <section style={styles.stats}>
          <div style={styles.statCard}>
            <strong style={styles.statNumber}>11</strong>
            <span style={styles.statLabel}>أقسام الإدارة</span>
          </div>

          <div style={styles.statCard}>
            <strong style={styles.statNumber}>1</strong>
            <span style={styles.statLabel}>اختبار متاح</span>
          </div>

          <div style={styles.statCard}>
            <strong style={styles.statNumber}>0</strong>
            <span style={styles.statLabel}>مشاركات جديدة</span>
          </div>
        </section>

        <section style={styles.sectionIntro}>
          <p style={styles.quick}>⚡ الإدارة السريعة</p>
          <h2 style={styles.heading}>ماذا تريد أن تدير اليوم؟</h2>
          <p style={styles.subheading}>
            اختر القسم الذي تريد العمل عليه
          </p>
        </section>

        <section style={styles.grid}>
          {sections.map((section) => (
            <button
              key={section.title}
              type="button"
              onClick={() => handleSection(section)}
              style={{
                ...styles.card,
                ...(active === section.title
                  ? styles.activeCard
                  : {}),
              }}
            >
              <div style={styles.cardIcon}>
                {section.icon}
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>
                  {section.title}
                </h3>

                <p style={styles.cardDesc}>
                  {section.desc}
                </p>
              </div>

              <div style={styles.arrow}>←</div>
            </button>
          ))}
        </section>

        <section style={styles.selectedBox}>
          <div style={styles.selectedIcon}>✨</div>

          <div>
            <p style={styles.selectedSmall}>
              القسم المحدد
            </p>

            <h2 style={styles.selectedTitle}>
              {active}
            </h2>

            <p style={styles.selectedText}>
              {active === "الرئيسية"
                ? "اختر أحد الأقسام بالأعلى لبدء إدارة المنصة."
                : active === "المحتوى"
                ? "يمكنك إضافة الدروس والفيديوهات والمحتوى التعليمي."
                : `قسم ${active} جاهز للتطوير في الخطوات القادمة.`}
            </p>
          </div>
        </section>

        <footer style={styles.footer}>
          منصة الذكاء الاصطناعي التعليمية • لوحة المعلم
        </footer>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 16px 60px",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1150px",
    margin: "0 auto",
  },

  hero: {
    background:
      "linear-gradient(135deg,#2458e8 0%,#684bf2 100%)",
    borderRadius: "24px",
    padding: "30px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    boxShadow:
      "0 14px 35px rgba(49,91,234,0.18)",
  },

  heroSmall: {
    margin: "0 0 8px",
    fontSize: "14px",
    opacity: 0.85,
  },

  heroTitle: {
    margin: 0,
    fontSize: "34px",
  },

  heroText: {
    margin: "10px 0 0",
    opacity: 0.9,
    lineHeight: 1.8,
  },

  studentButton: {
    background: "#fff",
    color: "#315bea",
    textDecoration: "none",
    padding: "13px 20px",
    borderRadius: "13px",
    fontWeight: "bold",
    boxShadow: "0 5px 18px rgba(0,0,0,.08)",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "16px",
    marginTop: "22px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e8ebf1",
    borderRadius: "17px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(0,0,0,.03)",
  },

  statNumber: {
    display: "block",
    fontSize: "28px",
    color: "#315bea",
    marginBottom: "7px",
  },

  statLabel: {
    color: "#667085",
    fontSize: "14px",
  },

  sectionIntro: {
    marginTop: "38px",
    marginBottom: "20px",
  },

  quick: {
    color: "#168f83",
    margin: 0,
    fontWeight: "bold",
    fontSize: "14px",
  },

  heading: {
    margin: "7px 0 5px",
    fontSize: "27px",
  },

  subheading: {
    margin: 0,
    color: "#667085",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: "17px",
  },

  card: {
    width: "100%",
    border: "1px solid #e7eaf0",
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    textAlign: "right",
    cursor: "pointer",
    boxShadow: "0 5px 20px rgba(0,0,0,.035)",
    color: "#172033",
  },

  activeCard: {
    border: "2px solid #315bea",
    boxShadow: "0 7px 25px rgba(49,91,234,.12)",
  },

  cardIcon: {
    width: "50px",
    height: "50px",
    minWidth: "50px",
    borderRadius: "14px",
    background: "#f3f5ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    margin: "0 0 7px",
    fontSize: "18px",
  },

  cardDesc: {
    margin: 0,
    color: "#667085",
    lineHeight: 1.7,
    fontSize: "13px",
  },

  arrow: {
    color: "#315bea",
    fontSize: "20px",
  },

  selectedBox: {
    marginTop: "30px",
    background:
      "linear-gradient(135deg,#f0f4ff,#faf8ff)",
    border: "1px solid #e2e7ff",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    gap: "17px",
    alignItems: "center",
  },

  selectedIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "16px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  selectedSmall: {
    margin: 0,
    color: "#667085",
    fontSize: "13px",
  },

  selectedTitle: {
    margin: "5px 0",
    fontSize: "22px",
  },

  selectedText: {
    margin: 0,
    color: "#667085",
    lineHeight: 1.8,
  },

  footer: {
    textAlign: "center",
    color: "#98a2b3",
    marginTop: "45px",
    fontSize: "13px",
  },
};