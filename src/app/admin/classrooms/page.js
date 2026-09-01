"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClassroomsPage() {
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    const { data: gradesData, error: gradesError } = await supabase
      .from("grades")
      .select("id,name")
      .order("id");

    const { data: classroomsData, error: classroomsError } = await supabase
      .from("classrooms")
      .select("id,grade_id,name,is_active,sort_order,grades(name)")
      .order("grade_id")
      .order("sort_order");

    if (gradesError || classroomsError) {
      setMessage("تعذر تحميل البيانات.");
    } else {
      setGrades(gradesData || []);
      setClassrooms(classroomsData || []);

      if (!gradeId && gradesData?.length) {
        setGradeId(String(gradesData[0].id));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addClassroom(e) {
    e.preventDefault();

    const cleanName = name.trim();

    if (!gradeId || !cleanName) {
      setMessage("اختر الصف واكتب اسم الفصل.");
      return;
    }

    setSaving(true);
    setMessage("");

    const sameGrade = classrooms.filter(
      (item) => Number(item.grade_id) === Number(gradeId)
    );

    const { error } = await supabase.from("classrooms").insert({
      grade_id: Number(gradeId),
      name: cleanName,
      is_active: true,
      sort_order: sameGrade.length + 1,
    });

    if (error) {
      setMessage("لم تتم إضافة الفصل: " + error.message);
    } else {
      setName("");
      setMessage("تمت إضافة الفصل بنجاح ✅");
      await loadData();
    }

    setSaving(false);
  }

  async function toggleClassroom(classroom) {
    const { error } = await supabase
      .from("classrooms")
      .update({ is_active: !classroom.is_active })
      .eq("id", classroom.id);

    if (error) {
      setMessage("تعذر تحديث الفصل: " + error.message);
      return;
    }

    setMessage(
      classroom.is_active
        ? "تم تعطيل الفصل."
        : "تم تفعيل الفصل بنجاح ✅"
    );

    await loadData();
  }

  async function renameClassroom(classroom) {
    const newName = window.prompt("اكتب الاسم الجديد للفصل:", classroom.name);

    if (!newName || !newName.trim() || newName.trim() === classroom.name) {
      return;
    }

    const { error } = await supabase
      .from("classrooms")
      .update({ name: newName.trim() })
      .eq("id", classroom.id);

    if (error) {
      setMessage("تعذر تعديل اسم الفصل: " + error.message);
      return;
    }

    setMessage("تم تعديل اسم الفصل بنجاح ✅");
    await loadData();
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <div style={styles.topRow}>
          <div>
            <h1 style={styles.title}>إدارة الصفوف والفصول</h1>
            <p style={styles.subtitle}>
              أضف الفصول وعدّلها وفعّلها أو عطّلها بسهولة.
            </p>
          </div>

          <a href="/admin" style={styles.backButton}>
            العودة للوحة الإدارة
          </a>
        </div>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>إضافة فصل جديد</h2>

          <form onSubmit={addClassroom} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>الصف الدراسي</label>

              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                style={styles.input}
              >
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>اسم الفصل</label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أ"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving ? "جارٍ الإضافة..." : "＋ إضافة الفصل"}
            </button>
          </form>

          {message && <div style={styles.message}>{message}</div>}
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.cardTitle}>الفصول الحالية</h2>
            <span style={styles.counter}>{classrooms.length} فصل</span>
          </div>

          {loading ? (
            <div style={styles.empty}>جارٍ تحميل البيانات...</div>
          ) : classrooms.length === 0 ? (
            <div style={styles.empty}>
              لا توجد فصول حتى الآن. أضف أول فصل من الأعلى.
            </div>
          ) : (
            <div style={styles.grid}>
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  style={{
                    ...styles.classroomCard,
                    opacity: classroom.is_active ? 1 : 0.65,
                  }}
                >
                  <div>
                    <div style={styles.gradeName}>
                      {classroom.grades?.name || "صف دراسي"}
                    </div>

                    <div style={styles.classroomName}>
                      فصل {classroom.name}
                    </div>
                  </div>

                  <div style={styles.statusRow}>
                    <span
                      style={{
                        ...styles.status,
                        background: classroom.is_active
                          ? "#ecfdf5"
                          : "#f3f4f6",
                        color: classroom.is_active
                          ? "#047857"
                          : "#6b7280",
                      }}
                    >
                      {classroom.is_active ? "نشط" : "معطّل"}
                    </span>
                  </div>

                  <div style={styles.actions}>
                    <button
                      type="button"
                      onClick={() => renameClassroom(classroom)}
                      style={styles.editButton}
                    >
                      تعديل الاسم
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleClassroom(classroom)}
                      style={styles.toggleButton}
                    >
                      {classroom.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </div>
              ))}
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
    background: "#f6f8fc",
    padding: "32px 16px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#667085",
    lineHeight: "1.8",
  },
  backButton: {
    textDecoration: "none",
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    padding: "11px 16px",
    borderRadius: "12px",
    color: "#344054",
    fontWeight: "700",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #eaecf0",
    borderRadius: "20px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "0 8px 24px rgba(16,24,40,0.05)",
  },
  cardTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
  },
  form: {
    display: "flex",
    gap: "14px",
    alignItems: "end",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  field: {
    flex: "1 1 220px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "700",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d0d5dd",
    borderRadius: "12px",
    background: "#ffffff",
    fontSize: "16px",
    outline: "none",
  },
  primaryButton: {
    border: 0,
    borderRadius: "12px",
    padding: "13px 20px",
    background: "#3157d5",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: "10px",
    fontSize: "14px",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  counter: {
    background: "#eef2ff",
    color: "#3949ab",
    padding: "6px 11px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
  },
  classroomCard: {
    border: "1px solid #eaecf0",
    borderRadius: "16px",
    padding: "17px",
    background: "#ffffff",
  },
  gradeName: {
    color: "#667085",
    fontSize: "13px",
    marginBottom: "5px",
  },
  classroomName: {
    fontSize: "20px",
    fontWeight: "800",
  },
  statusRow: {
    marginTop: "14px",
  },
  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
  },
  editButton: {
    flex: 1,
    padding: "9px",
    borderRadius: "10px",
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  },
  toggleButton: {
    flex: 1,
    padding: "9px",
    borderRadius: "10px",
    border: "1px solid #d0d5dd",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    padding: "36px 10px",
    color: "#667085",
  },
};
