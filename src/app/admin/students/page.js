"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentsPage() {
  const [grades, setGrades] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);

  const [gradeId, setGradeId] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [studentName, setStudentName] = useState("");

  const [filterGrade, setFilterGrade] = useState("");
  const [filterClassroom, setFilterClassroom] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

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

      if (!gradeId && gradesResult.data?.length) {
        setGradeId(String(gradesResult.data[0].id));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const availableClassrooms = useMemo(() => {
    return classrooms.filter(
      (item) =>
        Number(item.grade_id) === Number(gradeId) &&
        item.is_active
    );
  }, [classrooms, gradeId]);

  useEffect(() => {
    if (
      !availableClassrooms.some(
        (item) => String(item.id) === String(classroomId)
      )
    ) {
      setClassroomId(
        availableClassrooms.length
          ? String(availableClassrooms[0].id)
          : ""
      );
    }
  }, [availableClassrooms, classroomId]);

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
      setMessage("تمت إضافة الطالب بنجاح ✅");
      await loadData();
    }

    setSaving(false);
  }

  async function renameStudent(student) {
    const newName = window.prompt(
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

    setMessage("تم تعديل اسم الطالب بنجاح ✅");
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
        : "تم تفعيل الطالب بنجاح ✅"
    );

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
    <main style={styles.page} dir="rtl">
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>إدارة الطلاب</h1>
            <p style={styles.subtitle}>
              إضافة الطلاب وتنظيمهم حسب الصف والفصل.
            </p>
          </div>

          <a href="/admin" style={styles.back}>
            العودة للوحة الإدارة
          </a>
        </div>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>إضافة طالب جديد</h2>

          <form onSubmit={addStudent} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>الصف الدراسي</label>

              <select
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
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>الفصل</label>

              <select
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
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>اسم الطالب</label>

              <input
                value={studentName}
                onChange={(e) =>
                  setStudentName(e.target.value)
                }
                placeholder="اكتب اسم الطالب"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={saving || !classroomId}
              style={styles.primaryButton}
            >
              {saving
                ? "جارٍ الإضافة..."
                : "＋ إضافة الطالب"}
            </button>
          </form>

          {message && (
            <div style={styles.message}>{message}</div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.cardTitle}>
              الطلاب الحاليون
            </h2>

            <span style={styles.counter}>
              {visibleStudents.length} طالب
            </span>
          </div>

          <div style={styles.filters}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔎 البحث باسم الطالب"
              style={styles.input}
            />

            <select
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
            </select>

            <select
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
            </select>
          </div>

          {loading ? (
            <div style={styles.empty}>
              جارٍ تحميل البيانات...
            </div>
          ) : visibleStudents.length === 0 ? (
            <div style={styles.empty}>
              لا يوجد طلاب ضمن الاختيار الحالي.
            </div>
          ) : (
            <div style={styles.grid}>
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

                    <span style={styles.status}>
                      {student.is_active
                        ? "نشط"
                        : "معطّل"}
                    </span>

                    <div style={styles.actions}>
                      <button
                        onClick={() =>
                          renameStudent(student)
                        }
                        style={styles.actionButton}
                      >
                        تعديل الاسم
                      </button>

                      <button
                        onClick={() =>
                          toggleStudent(student)
                        }
                        style={styles.actionButton}
                      >
                        {student.is_active
                          ? "تعطيل"
                          : "تفعيل"}
                      </button>
                    </div>
                  </div>
                );
              })}
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
    color: "#667085",
  },

  back: {
    textDecoration: "none",
    color: "#344054",
    background: "white",
    border: "1px solid #e4e7ec",
    padding: "11px 16px",
    borderRadius: "12px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "20px",
    marginBottom: "20px",
    border: "1px solid #eaecf0",
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
    border: "1px solid #d0d5dd",
    borderRadius: "12px",
    fontSize: "16px",
    background: "white",
  },

  primaryButton: {
    padding: "13px 20px",
    border: 0,
    borderRadius: "12px",
    background: "#3157d5",
    color: "white",
    fontWeight: "800",
    cursor: "pointer",
  },

  message: {
    marginTop: "15px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "10px",
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "16px",
  },

  counter: {
    background: "#eef2ff",
    padding: "6px 11px",
    borderRadius: "20px",
    fontWeight: "700",
  },

  filters: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "14px",
  },

  studentCard: {
    border: "1px solid #eaecf0",
    padding: "17px",
    borderRadius: "16px",
  },

  studentName: {
    fontSize: "19px",
    fontWeight: "800",
  },

  location: {
    marginTop: "7px",
    color: "#667085",
  },

  status: {
    display: "inline-block",
    marginTop: "12px",
    padding: "5px 10px",
    background: "#ecfdf5",
    color: "#047857",
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
    border: "1px solid #d0d5dd",
    borderRadius: "10px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "35px",
    color: "#667085",
  },
};