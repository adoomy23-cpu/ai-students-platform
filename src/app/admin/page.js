"use client";

import SchoolIcon from "../../components/brand/SchoolIcon";
import { Button, PageSurface } from "../../components/platform/PlatformUI";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const [active, setActive] = useState("الرئيسية");

  const sections = [
    { icon: "users", title: "الطلاب", desc: "إدارة الطلاب وتفعيلهم وتعديل بياناتهم", href: "/admin/students" },
    { icon: "book", title: "الصفوف والفصول", desc: "تنظيم الفصول وتفعيلها", href: "/admin/classrooms" },
    {
      icon: "compass",
      title: "الرئيسية",
      desc: "نظرة عامة على المنصة",
      href: null,
    },
    {
      icon: "book",
      title: "المحتوى",
      desc: "إضافة وإدارة الدروس والفيديوهات",
      href: "/admin/content",
    },
    {
      icon: "check",
      title: "الاختبارات",
      desc: "إنشاء وإدارة الاختبارات",
      href: "/admin/quizzes",
    },
    {
      icon: "trophy",
      title: "نتائج الاختبارات",
      desc: "عرض درجات الطلاب ومحاولاتهم",
      href: "/admin/results",
    },
    {
      icon: "rocket",
      title: "التحديات",
      desc: "استعراض التحديات المنشورة",
      href: "/admin/challenges",
    },
    {
      icon: "pencil",
      title: "أعمال الطلاب",
      desc: "مراجعة المشاركات والأعمال المرسلة",
      href: null,
    },
    {
      icon: "trophy",
      title: "لوحة الشرف",
      desc: "عرض الطلاب والأعمال المتميزة",
      href: null,
    },
    {
      icon: "spark",
      title: "الإعلانات",
      desc: "نشر الأخبار والتنبيهات للطلاب",
      href: null,
    },
    {
      icon: "shield",
      title: "الشارات والإنجازات",
      desc: "تحفيز الطلاب بالشارات والإنجازات",
      href: null,
    },
    {
      icon: "compass",
      title: "الإحصائيات",
      desc: "متابعة الزيارات والتفاعل والمشاهدات",
      href: null,
    },
    {
      icon: "pencil",
      title: "هوية المنصة",
      desc: "الشعار والألوان والعبارات الترحيبية",
      href: null,
    },
    {
      icon: "shield",
      title: "الإعدادات",
      desc: "إدارة الإعدادات العامة للمنصة",
      href: null,
    },
  ];

  function handleSection(section) {
    if (section.href) {
      router.push(section.href);
      return;
    }

    setActive(section.title);
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>
        <section className="platform-hero" style={styles.hero}>
          <div>
            <p style={styles.heroSmall}>منصة الذكاء الاصطناعي</p>

            <h1 style={styles.heroTitle}>
              <SchoolIcon name="teacher" size={22} /> لوحة تحكم المعلم
            </h1>

            <p style={styles.heroText}>
              تحكم في محتوى المنصة والطلاب من مكان واحد
            </p>
          </div>


        </section>

        <section className="platform-grid" style={styles.stats}>
          <div style={styles.statCard}>
            <strong style={styles.statNumber}>{sections.filter((section) => section.href).length}</strong>
            <span style={styles.statLabel}>أقسام مرتبطة</span>
          </div>

          <div style={styles.statCard}>
            <strong style={styles.statNumber}><SchoolIcon name="check" size={28} /></strong>
            <span style={styles.statLabel}>اختبارات ومحتوى</span>
          </div>

          <div style={styles.statCard}>
            <strong style={styles.statNumber}><SchoolIcon name="teacher" size={28} /></strong>
            <span style={styles.statLabel}>طلاب وفصول</span>
          </div>
        </section>

        <section style={styles.sectionIntro}>
          <p style={styles.quick}><SchoolIcon name="spark" size={22} /> الإدارة السريعة</p>
          <h2 style={styles.heading}>ماذا تريد أن تدير اليوم؟</h2>
          <p style={styles.subheading}>
            اختر القسم الذي تريد العمل عليه
          </p>
        </section>

        <section className="platform-grid" style={styles.grid}>
          {sections.map((section) => (
            <Button variant="card"
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
                <SchoolIcon name={section.icon} size={25} />
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>
                  {section.title}
                </h3>

                <p style={styles.cardDesc}>
                  {section.desc}
                </p>
                {!section.href && section.title !== "الرئيسية" && <span className="ui-badge ui-badge-neutral">قريبًا</span>}
              </div>

              <div style={styles.arrow}>←</div>
            </Button>
          ))}
        </section>

        <section style={styles.selectedBox}>
          <div style={styles.selectedIcon}><SchoolIcon name="spark" size={22} /></div>

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


      </div>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    padding: "24px 16px 36px",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
  },

  container: {
    width: "100%",
    maxWidth: "1150px",
    margin: "0 auto",
  },

  hero: {
    background:
      "var(--gold-soft)",
    borderRadius: "24px",
    padding: "30px",
    color: "var(--ink)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
    boxShadow:
      "var(--shadow-sm)",
  },

  heroSmall: {
    margin: "0 0 8px",
    fontSize: "14px",
    opacity: 0.85,
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(26px, 4vw, 34px)",
  },

  heroText: {
    margin: "10px 0 0",
    opacity: 0.9,
    lineHeight: 1.8,
  },

  studentButton: {
    background: "var(--surface)",
    color: "var(--copper-ink)",
    textDecoration: "none",
    padding: "13px 20px",
    borderRadius: "13px",
    fontWeight: "bold",
    boxShadow: "var(--shadow-sm)",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 180px),1fr))",
    gap: "16px",
    marginTop: "22px",
  },

  statCard: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "17px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "var(--shadow-sm)",
  },

  statNumber: {
    display: "block",
    fontSize: "28px",
    color: "var(--copper-ink)",
    marginBottom: "7px",
  },

  statLabel: {
    color: "var(--muted)",
    fontSize: "14px",
  },

  sectionIntro: {
    marginTop: "38px",
    marginBottom: "20px",
  },

  quick: {
    color: "var(--copper-ink)",
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
    color: "var(--muted)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 260px),1fr))",
    gap: "17px",
  },

  card: {
    width: "100%",
    border: "1px solid var(--line)",
    background: "var(--surface)",
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    textAlign: "right",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    color: "var(--ink)",
  },

  activeCard: {
    border: "2px solid var(--brand-copper)",
    boxShadow: "var(--shadow-sm)",
  },

  cardIcon: {
    width: "50px",
    height: "50px",
    minWidth: "50px",
    borderRadius: "14px",
    background: "var(--surface-soft)",
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
    color: "var(--muted)",
    lineHeight: 1.7,
    fontSize: "13px",
  },

  arrow: {
    color: "var(--copper-ink)",
    fontSize: "20px",
  },

  selectedBox: {
    marginTop: "30px",
    background:
      "var(--gold-soft)",
    border: "1px solid var(--line)",
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
    background: "var(--surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  selectedSmall: {
    margin: 0,
    color: "var(--muted)",
    fontSize: "13px",
  },

  selectedTitle: {
    margin: "5px 0",
    fontSize: "22px",
  },

  selectedText: {
    margin: 0,
    color: "var(--muted)",
    lineHeight: 1.8,
  },

  footer: {
    textAlign: "center",
    color: "var(--muted)",
    marginTop: "45px",
    fontSize: "13px",
  },
};
