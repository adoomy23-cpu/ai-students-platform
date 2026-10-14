"use client";

import { useDialogs } from "../../../components/platform/DialogProvider";

import { Button, Card, EmptyState, Feedback, Input, PageSurface, Select, StatusBadge } from "../../../components/platform/PlatformUI";

import { useCallback, useEffect, useState } from "react";
import { requestAdmin } from "../../../lib/admin/client";

async function requestData() {
  const { data: gradesData, error: gradesError } = await requestAdmin("grades.list", {});

  const { data: classroomsData, error: classroomsError } = await requestAdmin("classrooms.list", {});
  return { gradesData, gradesError, classroomsData, classroomsError };
}

export default function ClassroomsPage() {
  const { requestText } = useDialogs();
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const receiveData = useCallback(({ gradesData, gradesError, classroomsData, classroomsError }) => {
    if (gradesError || classroomsError) {
      setMessage("تعذر تحميل البيانات.");
    } else {
      setGrades(gradesData || []);
      setClassrooms(classroomsData || []);

      if (gradesData?.length) {
        setGradeId((current) => current || String(gradesData[0].id));
      }
    }

    setLoading(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setMessage("تعذر الاتصال لتحميل البيانات. حاول مرة أخرى لاحقًا.");
    setLoading(false);
  }, []);

  const loadData = useCallback(() => {
    return requestData().then(receiveData).catch(handleLoadError);
  }, [receiveData, handleLoadError]);

  useEffect(() => {
    let active = true;
    requestData()
      .then((response) => { if (active) receiveData(response); })
      .catch(() => { if (active) handleLoadError(); });
    return () => { active = false; };
  }, [receiveData, handleLoadError]);

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

    const { error } = await requestAdmin("classrooms.create", {
      grade_id: Number(gradeId),
      name: cleanName,
      is_active: true,
      sort_order: sameGrade.length + 1,
    });

    if (error) {
      setMessage("لم تتم إضافة الفصل: " + error.message);
    } else {
      setName("");
      setMessage("تمت إضافة الفصل بنجاح");
      setLoading(true);
      await loadData();
    }

    setSaving(false);
  }

  async function toggleClassroom(classroom) {
    const { error } = await requestAdmin("classrooms.active", { is_active: !classroom.is_active, id: classroom.id });

    if (error) {
      setMessage("تعذر تحديث الفصل: " + error.message);
      return;
    }

    setMessage(
      classroom.is_active
        ? "تم تعطيل الفصل."
        : "تم تفعيل الفصل بنجاح"
    );

    setLoading(true);
    await loadData();
  }

  async function renameClassroom(classroom) {
    const newName = await requestText("اكتب الاسم الجديد للفصل:", classroom.name);

    if (!newName || !newName.trim() || newName.trim() === classroom.name) {
      return;
    }

    const { error } = await requestAdmin("classrooms.rename", { name: newName.trim(), id: classroom.id });

    if (error) {
      setMessage("تعذر تعديل اسم الفصل: " + error.message);
      return;
    }

    setMessage("تم تعديل اسم الفصل بنجاح");
    setLoading(true);
    await loadData();
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>
        <div className="platform-heading" style={styles.topRow}>
          <div>
            <h1 style={styles.title}>إدارة الصفوف والفصول</h1>
            <p style={styles.subtitle}>
              أضف الفصول وعدّلها وفعّلها أو عطّلها بسهولة.
            </p>
          </div>


        </div>

        <Card as="section" style={styles.card}>
          <h2 style={styles.cardTitle}>إضافة فصل جديد</h2>

          <form onSubmit={addClassroom} style={styles.form}>
            <div style={styles.field}>
              <label htmlFor="field-adminclassrooms-1" style={styles.label}>الصف الدراسي</label>

              <Select id="field-adminclassrooms-1"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                style={styles.input}
              >
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Select>
            </div>

            <div style={styles.field}>
              <label htmlFor="field-adminclassrooms-2" style={styles.label}>اسم الفصل</label>

              <Input id="field-adminclassrooms-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أ"
                style={styles.input}
              />
            </div>

            <Button variant="primary" icon="check"
              type="submit"
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving ? "جارٍ الإضافة..." : "＋ إضافة الفصل"}
            </Button>
          </form>

          {message && <Feedback style={styles.message}>{message}</Feedback>}
        </Card>

        <Card as="section" style={styles.card}>
          <div className="platform-heading" style={styles.listHeader}>
            <h2 style={styles.cardTitle}>الفصول الحالية</h2>
            <StatusBadge style={styles.counter}>{classrooms.length} فصل</StatusBadge>
          </div>

          {loading ? (
            <EmptyState loading={true} style={styles.empty}>جارٍ تحميل البيانات...</EmptyState>
          ) : classrooms.length === 0 ? (
            <EmptyState style={styles.empty}>
              لا توجد فصول حتى الآن. أضف أول فصل من الأعلى.
            </EmptyState>
          ) : (
            <div className="platform-grid" style={styles.grid}>
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
                    <Button variant="secondary" icon="pencil"
                      type="button"
                      onClick={() => renameClassroom(classroom)}
                      style={styles.editButton}
                    >
                      تعديل الاسم
                    </Button>

                    <Button variant="secondary" icon="shield"
                      type="button"
                      onClick={() => toggleClassroom(classroom)}
                      style={styles.toggleButton}
                    >
                      {classroom.is_active ? "تعطيل" : "تفعيل"}
                    </Button>
                  </div>
                </div>
              ))}
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
    padding: "32px 16px",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
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
    color: "var(--muted)",
    lineHeight: "1.8",
  },
  backButton: {
    textDecoration: "none",
    background: "var(--surface)",
    border: "1px solid var(--line)",
    padding: "11px 16px",
    borderRadius: "12px",
    color: "var(--muted)",
    fontWeight: "700",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "20px",
    padding: "22px",
    marginBottom: "20px",
    boxShadow: "var(--shadow-sm)",
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
    border: "1px solid var(--line)",
    borderRadius: "12px",
    background: "var(--surface)",
    fontSize: "16px",
  },
  primaryButton: {
    border: 0,
    borderRadius: "12px",
    padding: "13px 20px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontWeight: "800",
    cursor: "pointer",
  },
  message: {
    marginTop: "16px",
    padding: "12px 14px",
    background: "var(--surface-soft)",
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
    background: "var(--surface-soft)",
    color: "var(--copper-ink)",
    padding: "6px 11px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: "14px",
  },
  classroomCard: {
    border: "1px solid var(--line)",
    borderRadius: "16px",
    padding: "17px",
    background: "var(--surface)",
  },
  gradeName: {
    color: "var(--muted)",
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
    border: "1px solid var(--line)",
    background: "var(--surface)",
    cursor: "pointer",
    fontWeight: "700",
  },
  toggleButton: {
    flex: 1,
    padding: "9px",
    borderRadius: "10px",
    border: "1px solid var(--line)",
    background: "var(--surface-soft)",
    cursor: "pointer",
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    padding: "36px 10px",
    color: "var(--muted)",
  },
};
