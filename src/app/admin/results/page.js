"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .rpc("get_admin_quiz_results");

    if (error) {
      console.error(error);
      setError("تعذر تحميل النتائج");
      setResults([]);
    } else {
      setResults(data || []);
    }

    setLoading(false);
  }

  const rows = useMemo(() => {
    return results.map((item) => {
      const score = Number(item.score || 0);
      const total = Number(item.total_points || 0);

      return {
        id: item.id,
        student: item.student_name || "-",
        grade: item.grade_name || "-",
        classroom: item.classroom_name || "-",
        quiz: item.quiz_title || "-",
        score,
        total,
        percentage: total ? Math.round((score / total) * 100) : 0,
        attempt: item.attempt_number || 1,
        submittedAt: item.submitted_at,
      };
    });
  }, [results]);

  const filteredRows = rows.filter((row) =>
    `${row.student} ${row.grade} ${row.classroom} ${row.quiz}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const average = filteredRows.length
    ? Math.round(
        filteredRows.reduce((sum, row) => sum + row.percentage, 0) /
          filteredRows.length
      )
    : 0;

  const highest = filteredRows.length
    ? Math.max(...filteredRows.map((row) => row.percentage))
    : 0;

  function formatDate(date) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  }

  if (loading) {
    return (
      <main dir="rtl" style={styles.center}>
        جارٍ تحميل النتائج...
      </main>
    );
  }

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 نتائج الاختبارات</h1>
            <p style={styles.subtitle}>
              متابعة درجات الطلاب ومحاولاتهم
            </p>
          </div>

          <a href="/admin" style={styles.back}>
            العودة للوحة الإدارة
          </a>
        </header>

        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.stats}>
          <div style={styles.stat}>
            <span>عدد المحاولات</span>
            <strong>{filteredRows.length}</strong>
          </div>

          <div style={styles.stat}>
            <span>متوسط النتائج</span>
            <strong>{average}%</strong>
          </div>

          <div style={styles.stat}>
            <span>أعلى نتيجة</span>
            <strong>{highest}%</strong>
          </div>
        </section>

        <section style={styles.tools}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔎 ابحث باسم الطالب أو الاختبار..."
            style={styles.input}
          />

          <button onClick={loadResults} style={styles.button}>
            تحديث النتائج
          </button>
        </section>

        <section style={styles.card}>
          {filteredRows.length === 0 ? (
            <div style={styles.empty}>لا توجد نتائج حاليًا</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>الطالب</th>
                    <th style={styles.th}>الصف</th>
                    <th style={styles.th}>الفصل</th>
                    <th style={styles.th}>الاختبار</th>
                    <th style={styles.th}>الدرجة</th>
                    <th style={styles.th}>النسبة</th>
                    <th style={styles.th}>المحاولة</th>
                    <th style={styles.th}>وقت التسليم</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.td}>
                        <strong>{row.student}</strong>
                      </td>
                      <td style={styles.td}>{row.grade}</td>
                      <td style={styles.td}>{row.classroom}</td>
                      <td style={styles.td}>{row.quiz}</td>
                      <td style={styles.td}>
                        {row.score} من {row.total}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge}>
                          {row.percentage}%
                        </span>
                      </td>
                      <td style={styles.td}>{row.attempt}</td>
                      <td style={styles.td}>
                        {formatDate(row.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    background: "#f5f8ff",
    padding: "30px 16px 70px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#667085",
  },
  back: {
    background: "#fff",
    padding: "11px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#172033",
    border: "1px solid #e3e8f0",
    fontWeight: "700",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "14px",
    marginBottom: "16px",
  },
  stat: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid #e7ebf3",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  tools: {
    background: "#fff",
    borderRadius: "18px",
    padding: "14px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  input: {
    flex: "1 1 250px",
    padding: "13px",
    borderRadius: "12px",
    border: "1px solid #d8deea",
    fontSize: "15px",
  },
  button: {
    border: 0,
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid #e7ebf3",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "900px",
    borderCollapse: "collapse",
  },
  th: {
    padding: "13px 10px",
    background: "#f8fafc",
    textAlign: "right",
    borderBottom: "1px solid #e8ecf2",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #f0f2f5",
    whiteSpace: "nowrap",
  },
  badge: {
    background: "#eef5ff",
    color: "#2563eb",
    borderRadius: "999px",
    padding: "6px 10px",
    fontWeight: "700",
  },
  empty: {
    padding: "50px",
    textAlign: "center",
    color: "#667085",
  },
  error: {
    background: "#fff1f1",
    color: "#b42318",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "15px",
  },
};
