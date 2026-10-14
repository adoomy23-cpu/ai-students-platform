// Only operations already present in the admin pages. No arbitrary tables,
// columns, RPC names, or user identity can be supplied by the browser.
const positiveId = (value) => Number.isSafeInteger(value) && value > 0;
const nonempty = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 2000;
const text = (value) => value === null || (typeof value === "string" && value.length <= 32000);
const bool = (value) => typeof value === "boolean";
const integer = (value) => Number.isSafeInteger(value);
const date = (value) => value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)));
const status = (value) => ["draft", "published"].includes(value);
const contentType = (value) => ["video", "lesson", "article", "link"].includes(value);
const exact = (value, rules) => value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).length === Object.keys(rules).length &&
  Object.entries(rules).every(([key, validate]) => Object.hasOwn(value, key) && validate(value[key]));
const empty = (value) => exact(value, {});
const idOnly = (value) => exact(value, { id: positiveId });
const definition = (validate, run) => ({ validate, run });

export const adminOperations = Object.freeze({
  "grades.list": definition(empty, (client) => client.from("grades").select("id,name").order("id")),
  "classrooms.list": definition(empty, (client) => client.from("classrooms").select("id,grade_id,name,is_active,sort_order,grades(name)").order("grade_id").order("sort_order")),
  "classrooms.directory": definition(empty, (client) => client.from("classrooms").select("id,grade_id,name,is_active,sort_order").order("grade_id").order("sort_order")),
  "classrooms.create": definition((p) => exact(p, { grade_id: positiveId, name: nonempty, is_active: bool, sort_order: integer }), (client, payload) => client.from("classrooms").insert(payload)),
  "classrooms.rename": definition((p) => exact(p, { id: positiveId, name: nonempty }), (client, p) => client.from("classrooms").update({ name: p.name }).eq("id", p.id)),
  "classrooms.active": definition((p) => exact(p, { id: positiveId, is_active: bool }), (client, p) => client.from("classrooms").update({ is_active: p.is_active }).eq("id", p.id)),
  "students.list": definition(empty, (client) => client.from("students").select("id,classroom_id,student_name,is_active,created_at").order("student_name")),
  "students.approvals": definition(empty, (client) => client.from("students").select("id,classroom_id,student_name,approval_status,is_active").not("user_id", "is", null).order("student_name")),
  "students.create": definition((p) => exact(p, { classroom_id: positiveId, student_name: nonempty, is_active: bool }), (client, p) => client.from("students").insert(p)),
  "students.rename": definition((p) => exact(p, { id: positiveId, student_name: nonempty }), (client, p) => client.from("students").update({ student_name: p.student_name }).eq("id", p.id)),
  "students.active": definition((p) => exact(p, { id: positiveId, is_active: bool }), (client, p) => client.from("students").update({ is_active: p.is_active }).eq("id", p.id)),
  "content.list": definition(empty, (client) => client.from("learning_content").select("*").order("sort_order", { ascending: true }).order("id", { ascending: false })),
  "content.create": definition((p) => exact(p, { title: nonempty, description: text, content_type: contentType, content_url: text, thumbnail_url: text, related_lesson: text, status, is_featured: bool, sort_order: integer }), (client, p) => client.from("learning_content").insert([p])),
  "content.delete": definition(idOnly, (client, p) => client.from("learning_content").delete().eq("id", p.id)),
  "quizzes.list": definition(empty, (client) => client.from("quizzes").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false })),
  "quizzes.create": definition((p) => exact(p, { title: nonempty, description: text, status, start_at: date, end_at: date, time_limit_minutes: (v) => v === null || (integer(v) && v > 0), show_score: bool, show_correct_answers: bool, max_attempts: positiveId, is_featured: bool, sort_order: integer }), (client, p) => client.from("quizzes").insert([p])),
  "quizzes.delete": definition(idOnly, (client, p) => client.from("quizzes").delete().eq("id", p.id)),
  "quizzes.publish": definition((p) => exact(p, { id: positiveId, status, updated_at: date }), (client, p) => client.from("quizzes").update({ status: p.status, updated_at: p.updated_at }).eq("id", p.id)),
  "quizzes.preview": definition((p) => exact(p, { id: positiveId }), (client, p) => client.rpc("get_quiz_for_student", { p_quiz_id: p.id })),
  "challenges.list": definition(empty, (client) => client.from("challenges").select("*").eq("status", "published").order("is_featured", { ascending: false }).order("sort_order", { ascending: true })),
  "results.list": definition(empty, (client) => client.rpc("get_admin_quiz_results")),
});
