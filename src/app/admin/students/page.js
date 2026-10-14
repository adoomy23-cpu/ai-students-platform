"use client";

import { useDialogs } from "../../../components/platform/DialogProvider";

import { Button, Card, EmptyState, Feedback, Input, PageSurface, Select, StatusBadge } from "../../../components/platform/PlatformUI";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

async function requestData() {
  const [gradesResult, classroomsResult, studentsResult] =
      await Promise.all([
        supabase.from("grades").select("id,name").order("id"),

        supabase
          .from("classrooms")
          .select("id,grade_id,name,is_active,sort_order")
          .order("grade_id")
          .order("sort_order"),

        supabase
          .from("students")
          .select("id,classroom_id,student_name,is_active,created_at")
          .order("student_name"),
      ]);
  return { gradesResult, classroomsResult, studentsResult };
}

export default function StudentsPage() {
  const { requestText } = useDialogs();
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [gradeId, setGradeId] = useState("");
  const [classroomChoice, setClassroomId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [filterGrade, setFilterGrade] = useState("");
  const [filterClassroom, setFilterClassroom] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const receiveData = useCallback(({ gradesResult, classroomsResult, studentsResult }) => {
    if (
      gradesResult.error ||
      classroomsResult.error ||
      studentsResult.error
    ) {
      setMessage("تعذر تحميل البيانات.");
    } else {
      setGrades(gradesResult.data || []);
      setClassrooms(classroomsResult.data || []);
      setStudents(studentsResult.data || []);

      if (gradesResult.data?.length) {
        setGradeId((current) => current || String(gradesResult.data[0].id));
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

  const availableClassrooms = useMemo(() => {
    return classrooms.filter(
      (item) =>
        Number(item.grade_id) === Number(gradeId) &&
        item.is_active
    );
  }, [classrooms, gradeId]);

  const classroomId = availableClassrooms.some(
    (item) => String(item.id) === String(classroomChoice)
  ) ? classroomChoice : String(availableClassrooms[0]?.id || "");

  const filteredClassrooms = useMemo(() => {
    if (!filterGrade) return classrooms;

    return classrooms.filter(
      (item) => Number(item.grade_id) === Number(filterGrade)
    );
  }, [classrooms, filterGrade]);

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      const classroom = classrooms.find(
        (item) =>
          Number(item.id) === Number(student.classroom_id)
      );

      if (!classroom) return false;

      if (
        filterGrade &&
        Number(classroom.grade_id) !== Number(filterGrade)
      ) {
        return false;
      }

      if (
        filterClassroom &&
        Number(student.classroom_id) !== Number(filterClassroom)
      ) {
        return false;
      }

      if (
        search &&
        !student.student_name
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    students,
    classrooms,
    filterGrade,
    filterClassroom,
    search,
  ]);

  async function addStudent(e) {
    e.preventDefault();

    const cleanName = studentName.trim();

    if (!classroomId || !cleanName) {
      setMessage("اختر الفصل واكتب اسم الطالب.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("students").insert({
      classroom_id: Number(classroomId),
      student_name: cleanName,
      is_active: true,
    });

    if (error) {
      setMessage("لم تتم إضافة الطالب: " + error.message);
    } else {
      setStudentName("");
      setMessage("تمت إضافة الطالب بنجاح");
      setLoading(true);
      await loadData();
    }

    setSaving(false);
  }

  async function renameStudent(student) {
    const newName = await requestText(
      "اكتب الاسم الجديد للطالب:",
      student.student_name
    );

    if (!newName || !newName.trim()) return;

    const { error } = await supabase
      .from("students")
      .update({
        student_name: newName.trim(),
      })
      .eq("id", student.id);

    if (error) {
      setMessage("تعذر تعديل اسم الطالب: " + error.message);
      return;
    }

    setMessage("تم تعديل اسم الطالب بنجاح");
    setLoading(true);
    await loadData();
  }

  async function toggleStudent(student) {
    const { error } = await supabase
      .from("students")
      .update({
        is_active: !student.is_active,
      })
      .eq("id", student.id);

    if (error) {
      setMessage("تعذر تحديث الطالب: " + error.message);
      return;
    }

    setMessage(
      student.is_active
        ? "تم تعطيل الطالب."
        : "تم تفعيل الطالب بنجاح"
    );

    setLoading(true);
    await loadData();
  }

  function getLocation(student) {
    const classroom = classrooms.find(
      (item) =>
        Number(item.id) === Number(student.classroom_id)
    );

    const grade = grades.find(
      (item) =>
        Number(item.id) === Number(classroom?.grade_id)
    );

    return {
      grade: grade?.name || "غير محدد",
      classroom: classroom?.name || "غير محدد",
    };
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <div style={styles.container}>
        <div className="platform-heading" style={styles.header}>
          <div>
            <h1 style={styles.title}>إدارة الطلاب</h1>
            <p style={styles.subtitle}>
              إضافة الطلاب وتنظيمهم حسب الصف والفصل.
            </p>
          </div>


        </div>

        <Card as="section" style={styles.card}>
          <h2 style={styles.cardTitle}>إضافة طالب جديد</h2>

          <form onSubmit={addStudent} style={styles.form}>
            <div style={styles.field}>
              <label htmlFor="field-adminstudents-1" style={styles.label}>الصف الدراسي</label>

              <Select id="field-adminstudents-1"
                value={gradeId}
                onChange={(e) => {
                  setGradeId(e.target.value);
                  setClassroomId("");
                }}
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
              <label htmlFor="field-adminstudents-2" style={styles.label}>الفصل</label>

              <Select id="field-adminstudents-2"
                value={classroomId}
                onChange={(e) =>
                  setClassroomId(e.target.value)
                }
                style={styles.input}
                disabled={!availableClassrooms.length}
              >
                {!availableClassrooms.length ? (
                  <option value="">
                    لا توجد فصول نشطة
                  </option>
                ) : (
                  availableClassrooms.map((classroom) => (
                    <option
                      key={classroom.id}
                      value={classroom.id}
                    >
                      فصل {classroom.name}
                    </option>
                  ))
                )}
              </Select>
            </div>

            <div style={styles.field}>
              <label htmlFor="field-adminstudents-3" style={styles.label}>اسم الطالب</label>

              <Input id="field-adminstudents-3"
                value={studentName}
                onChange={(e) =>
                  setStudentName(e.target.value)
                }
                placeholder="اكتب اسم الطالب"
                style={styles.input}
              />
            </div>

            <Button variant="primary" icon="check"
              type="submit"
              disabled={saving || !classroomId}
              style={styles.primaryButton}
            >
              {saving
                ? "جارٍ الإضافة..."
                : "＋ إضافة الطالب"}
            </Button>
          </form>

          {message && (
            <Feedback style={styles.message}>{message}</Feedback>
          )}
        </Card>

        <Card as="section" style={styles.card}>
          <div className="platform-heading" style={styles.listHeader}>
            <h2 style={styles.cardTitle}>
              الطلاب الحاليون
            </h2>

            <StatusBadge style={styles.counter}>
              {visibleStudents.length} طالب
            </StatusBadge>
          </div>

          <div className="platform-columns" style={styles.filters}>
            <Input aria-label="البحث باسم الطالب"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم الطالب"
              style={styles.input}
            />

            <Select aria-label="الصف الدراسي"
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setFilterClassroom("");
              }}
              style={styles.input}
            >
              <option value="">جميع الصفوف</option>

              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </Select>

            <Select aria-label="الفصل"
              value={filterClassroom}
              onChange={(e) =>
                setFilterClassroom(e.target.value)
              }
              style={styles.input}
            >
              <option value="">جميع الفصول</option>

              {filteredClassrooms.map((classroom) => (
                <option
                  key={classroom.id}
                  value={classroom.id}
                >
                  فصل {classroom.name}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <EmptyState loading={true} style={styles.empty}>
              جارٍ تحميل البيانات...
            </EmptyState>
          ) : visibleStudents.length === 0 ? (
            <EmptyState style={styles.empty}>
              لا يوجد طلاب ضمن الاختيار الحالي.
            </EmptyState>
          ) : (
            <div className="platform-grid" style={styles.grid}>
              {visibleStudents.map((student) => {
                const location = getLocation(student);

                return (
                  <div
                    key={student.id}
                    style={{
                      ...styles.studentCard,
                      opacity: student.is_active ? 1 : 0.6,
                    }}
                  >
                    <div style={styles.studentName}>
                      {student.student_name}
                    </div>

                    <div style={styles.location}>
                      {location.grade} • فصل{" "}
                      {location.classroom}
                    </div>

                    <StatusBadge style={styles.status} tone={student.is_active ? "success" : "neutral"}>
                      {student.is_active
                        ? "نشط"
                        : "معطّل"}
                    </StatusBadge>

                    <div style={styles.actions}>
                      <Button variant="secondary" icon="pencil"
                        onClick={() =>
                          renameStudent(student)
                        }
                        style={styles.actionButton}
                      >
                        تعديل الاسم
                      </Button>

                      <Button variant="secondary" icon="shield"
                        onClick={() =>
                          toggleStudent(student)
                        }
                        style={styles.actionButton}
                      >
                        {student.is_active
                          ? "تعطيل"
                          : "تفعيل"}
                      </Button>
                    </div>
                  </div>
                );
              })}
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

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
  },

  subtitle: {
    color: "var(--muted)",
  },

  back: {
    textDecoration: "none",
    color: "var(--muted)",
    background: "white",
    border: "1px solid var(--line)",
    padding: "11px 16px",
    borderRadius: "12px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "20px",
    marginBottom: "20px",
    border: "1px solid var(--line)",
  },

  cardTitle: {
    margin: 0,
    fontSize: "20px",
  },

  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    alignItems: "end",
    marginTop: "20px",
  },

  field: {
    flex: "1 1 190px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid var(--line)",
    borderRadius: "12px",
    fontSize: "16px",
    background: "white",
  },

  primaryButton: {
    padding: "13px 20px",
    border: 0,
    borderRadius: "12px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontWeight: "800",
    cursor: "pointer",
  },

  message: {
    marginTop: "15px",
    padding: "12px",
    background: "var(--surface-soft)",
    borderRadius: "10px",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "16px",
  },

  counter: {
    background: "var(--surface-soft)",
    padding: "6px 11px",
    borderRadius: "20px",
    fontWeight: "700",
  },

  filters: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: "14px",
  },

  studentCard: {
    border: "1px solid var(--line)",
    padding: "17px",
    borderRadius: "16px",
  },

  studentName: {
    fontSize: "19px",
    fontWeight: "800",
  },

  location: {
    marginTop: "7px",
    color: "var(--muted)",
  },

  status: {
    display: "inline-block",
    marginTop: "12px",
    padding: "5px 10px",
    background: "var(--surface-soft)",
    color: "var(--success)",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "800",
  },

  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
  },

  actionButton: {
    flex: 1,
    padding: "9px",
    background: "white",
    border: "1px solid var(--line)",
    borderRadius: "10px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "35px",
    color: "var(--muted)",
  },
};
