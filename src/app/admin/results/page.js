"use client";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { Button, Card, DataTable, EmptyState, Feedback, Input, PageSurface, StatusBadge } from "../../../components/platform/PlatformUI";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

async function requestData() {
  const { data, error } = await supabase
      .rpc("get_admin_quiz_results");
  return { data, error };
}

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const receiveData = useCallback(({ data, error }) => {
    if (error) {
      console.error(error);
      setError("تعذر تحميل النتائج");
      setResults([]);
    } else {
      setError("");
      setResults(data || []);
    }

    setLoading(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setError("تعذر الاتصال لتحميل البيانات. حاول مرة أخرى لاحقًا.");
    setLoading(false);
  }, []);

  const loadResults = useCallback(() => {
    return requestData().then(receiveData).catch(handleLoadError);
  }, [receiveData, handleLoadError]);

  useEffect(() => {
    let active = true;
    requestData()
      .then((response) => { if (active) receiveData(response); })
      .catch(() => { if (active) handleLoadError(); });
    return () => { active = false; };
  }, [receiveData, handleLoadError]);

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
      <PageSurface dir="rtl" style={styles.center}>
        <EmptyState loading>جارٍ تحميل النتائج...</EmptyState>
      </PageSurface>
    );
  }

  return (
    <PageSurface dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <header className="platform-heading" style={styles.header}>
          <div>
            <h1 style={styles.title}><SchoolIcon name="spark" size={22} /> نتائج الاختبارات</h1>
            <p style={styles.subtitle}>
              متابعة درجات الطلاب ومحاولاتهم
            </p>
          </div>


        </header>

        {error && <Feedback tone="error" style={styles.error}>{error}</Feedback>}

        <section className="platform-grid" style={styles.stats}>
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
          <Input aria-label="ابحث باسم الطالب أو الاختبار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الطالب أو الاختبار..."
            style={styles.input}
          />

          <Button variant="primary" icon="clock" onClick={() => { setLoading(true); loadResults(); }} style={styles.button}>
            تحديث النتائج
          </Button>
        </section>

        <Card as="section" style={styles.card}>
          {filteredRows.length === 0 ? (
            <EmptyState style={styles.empty}>لا توجد نتائج حاليًا</EmptyState>
          ) : (
            <div style={styles.tableWrap}>
              <DataTable style={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" style={styles.th}>الطالب</th>
                    <th scope="col" style={styles.th}>الصف</th>
                    <th scope="col" style={styles.th}>الفصل</th>
                    <th scope="col" style={styles.th}>الاختبار</th>
                    <th scope="col" style={styles.th}>الدرجة</th>
                    <th scope="col" style={styles.th}>النسبة</th>
                    <th scope="col" style={styles.th}>المحاولة</th>
                    <th scope="col" style={styles.th}>وقت التسليم</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td data-label="الطالب" style={styles.td}>
                        <strong>{row.student}</strong>
                      </td>
                      <td data-label="الصف" style={styles.td}>{row.grade}</td>
                      <td data-label="الفصل" style={styles.td}>{row.classroom}</td>
                      <td data-label="الاختبار" style={styles.td}>{row.quiz}</td>
                      <td data-label="الدرجة" style={styles.td}>
                        {row.score} من {row.total}
                      </td>
                      <td data-label="النسبة" style={styles.td}>
                        <StatusBadge style={styles.badge}>
                          {row.percentage}%
                        </StatusBadge>
                      </td>
                      <td data-label="المحاولة" style={styles.td}>{row.attempt}</td>
                      <td data-label="وقت التسليم" style={styles.td}>
                        {formatDate(row.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          )}
        </Card>
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
  center: {
    minHeight: "360px",
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
    color: "var(--muted)",
  },
  back: {
    background: "var(--surface)",
    padding: "11px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "var(--ink)",
    border: "1px solid var(--line)",
    fontWeight: "700",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 180px),1fr))",
    gap: "14px",
    marginBottom: "16px",
  },
  stat: {
    background: "var(--surface)",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid var(--line)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  tools: {
    background: "var(--surface)",
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
    border: "1px solid var(--line)",
    fontSize: "15px",
  },
  button: {
    border: 0,
    borderRadius: "12px",
    padding: "12px 18px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontWeight: "700",
    cursor: "pointer",
  },
  card: {
    background: "var(--surface)",
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid var(--line)",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "0",
    borderCollapse: "collapse",
  },
  th: {
    padding: "13px 10px",
    background: "var(--surface-soft)",
    textAlign: "right",
    borderBottom: "1px solid var(--line)",
    whiteSpace: "normal",
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid var(--line)",
    whiteSpace: "normal",
  },
  badge: {
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    borderRadius: "999px",
    padding: "6px 10px",
    fontWeight: "700",
  },
  empty: {
    padding: "50px",
    textAlign: "center",
    color: "var(--muted)",
  },
  error: {
    background: "var(--surface-soft)",
    color: "var(--danger)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "15px",
  },
};
