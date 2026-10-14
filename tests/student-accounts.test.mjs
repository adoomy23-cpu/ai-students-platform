import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { classifyStudent, inspectOwnStudent, canAccessStudent, studentDestination } from "../src/lib/student/profile.mjs";
import { handleAccessRequest } from "../src/lib/auth/server-access.mjs";
import { fetchAccountAccess } from "../src/lib/auth/access-client.mjs";
import { handleStudentRequest } from "../src/lib/student/handler.mjs";
import { handleStudentUpload } from "../src/lib/student/upload.mjs";
import { navigationGroupsForAccess } from "../src/config/navigation.mjs";

const row = { id: 17, user_id: "synthetic-user", student_name: "طالب للاختبار", classroom_id: 4, approval_status: "approved", is_active: true };
function fixture({ student = row, rows, admin = false, profileError = null, locationError = null, locationThrows = false, userError = null } = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: userError ? null : { user: { id: "synthetic-user" } }, error: userError }) },
    rpc: async (name, args) => { calls.push(["rpc", name, args]); return { data: name === "is_admin" ? admin : { score: 8, total_points: 10 }, error: null }; },
    storage: { from: (bucket) => ({ upload: async (path, file, options) => { calls.push(["upload", bucket, path, file.size, options]); return { error: null }; } }) },
    from: (table) => {
      calls.push(["from", table]);
      const query = new Proxy({}, { get: (_target, name) => {
        if (name === "then") return (resolve, reject) => {
          if (locationThrows && table === "classrooms") return Promise.reject(new Error("offline")).then(resolve, reject);
          const data = table === "students" ? rows ?? (student ? [student] : []) : table === "classrooms" ? { id: 4, name: "أ", grade_id: 2 } : table === "grades" ? { id: 2, name: "الصف الثاني" } : table === "challenges" ? { id: 6, allow_text: true, allow_file: true, allow_image: true } : null;
          return Promise.resolve({ data, error: table === "students" ? profileError : table === "classrooms" ? locationError : null }).then(resolve, reject);
        }
        return (...args) => { calls.push([table, name, ...args]); return query; };
      } });
      return query;
    },
  };
  return { client, calls, factory: () => client };
}
function request(action, payload, token = "synthetic-token") {
  return new Request("https://platform.example/api/student/operations", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, payload }) });
}
const approved = { status: "authenticated", role: "student", student: classifyStudent(row, row.user_id) };
for (const [status, active, state] of [["approved", true, "approved"], ["approved", false, "suspended"], ["pending", false, "pending"], ["pending", true, "pending"], ["rejected", true, "rejected"], ["suspended", true, "suspended"], ["unknown", true, "verification_failed"]]) {
  test(`account classification: ${status}/${active} -> ${state}`, () => {
    const student = classifyStudent({ ...row, approval_status: status, is_active: active }, row.user_id);
    assert.equal(student.state, state);
    assert.equal(canAccessStudent({ ...approved, student }), state === "approved");
  });
}
test("only an owned, well-formed active approved profile grants student access", () => {
  for (const change of [{ user_id: "another-user" }, { id: 0 }, { is_active: "true" }, { student_name: null }, { approval_status: null }]) {
    assert.equal(classifyStudent({ ...row, ...change }, row.user_id).state, "verification_failed");
  }
  for (const change of [{ status: "verifying" }, { status: "error" }, { status: "expired" }, { role: null }, { signingOut: true }]) assert.equal(canAccessStudent({ ...approved, ...change }), false);
});
test("student lookup filters by verified auth UID and never reads email or a public directory", async () => {
  const f = fixture(); const result = await inspectOwnStudent(f.client, row.user_id);
  assert.equal(result.state, "approved"); assert.equal(result.profile.name, row.student_name);
  assert.equal(result.profile.grade, "الصف الثاني"); assert.equal(result.profile.classroom, "أ");
  assert.ok(f.calls.some(call => call[0] === "students" && call[1] === "eq" && call[2] === "user_id" && call[3] === row.user_id));
  assert.ok(f.calls.some(call => call[0] === "students" && call[1] === "limit" && call[2] === 2));
  assert.ok(!JSON.stringify(f.calls).includes("email"));
  assert.ok(!f.calls.some(call => call[0] === "rpc"));
  assert.ok(!JSON.stringify(result).includes("user_id"));
});
for (const options of [{ locationError: true }, { locationThrows: true }]) {
  test(`failed classroom lookup preserves approved account (${JSON.stringify(options)})`, async () => {
    const f = fixture(options); const student = await inspectOwnStudent(f.client, row.user_id);
    assert.equal(student.state, "approved");
    assert.equal(studentDestination({ ...approved, student }), "/quizzes");
  });
}
test("connection/RLS uncertainty is never treated as a missing profile or complete-profile redirect", async () => {
  for (const options of [{ student: null }, { profileError: true }, { rows: [row, row] }, { student: { ...row, user_id: "another-user" } }]) {
    const f = fixture(options); const student = await inspectOwnStudent(f.client, row.user_id);
    assert.ok(["profile_unavailable", "verification_failed"].includes(student.state));
    assert.equal(studentDestination({ ...approved, role: null, student }), null);
  }
  assert.equal((await inspectOwnStudent(fixture({ student: null }).client, row.user_id, { selfVisibilityVerified: true })).state, "missing");
});
test("routing distinguishes approved, pending, missing, stopped, expired and offline", () => {
  assert.equal(studentDestination(approved), "/quizzes");
  for (const state of ["pending", "suspended", "rejected"]) assert.equal(studentDestination({ ...approved, role: null, student: { state } }), "/pending-approval");
  assert.equal(studentDestination({ ...approved, role: null, student: { state: "missing" } }), "/complete-profile");
  assert.equal(studentDestination({ status: "visitor" }), "/student-login");
  assert.equal(studentDestination({ status: "expired" }), "/student-login");
  assert.equal(studentDestination({ status: "error" }), null);
});
test("account endpoint sends only own display fields and correct role, never tokens or emails", async () => {
  const f = fixture(); const response = await handleAccessRequest(request("quiz.load", { id: 6 }), f.factory, inspectOwnStudent);
  const body = await response.json();
  assert.equal(body.role, "student"); assert.equal(body.student.state, "approved");
  for (const forbidden of ["user_id", "synthetic-token", "email", "password"]) assert.ok(!JSON.stringify(body).includes(forbidden));
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});
test("client parser rejects a student claim without an approved numeric identity", async () => {
  for (const student of [undefined, { state: "pending", profile: { id: 17 } }, { state: "approved", profile: { id: "17" } }]) {
    const result = await fetchAccountAccess("synthetic-token", { fetcher: async () => Response.json({ authenticated: true, role: "student", student }) });
    assert.equal(result.status, "error"); assert.equal(result.role, null);
  }
  const result = await fetchAccountAccess("synthetic-token", { fetcher: async () => Response.json({ authenticated: true, role: "student", student: approved.student }) });
  assert.equal(canAccessStudent(result), true);
  const failed = await fetchAccountAccess("synthetic-token", { fetcher: async () => Response.json({ authenticated: true, role: null, student: { state: "verification_failed", profile: null } }) });
  assert.equal(failed.status, "error");
});
for (const [action, payload] of [["quiz.load", { id: 6 }], ["quiz.submit", { id: 6, answers: { 1: 2 } }], ["challenge.load", { id: 6 }], ["challenge.submit", { id: 6, text: "مشاركة للاختبار", imagePath: null, filePath: null }]]) {
  test(`${action}: visitors and unapproved students cannot execute the operation`, async () => {
    const visitor = fixture(); assert.equal((await handleStudentRequest(request(action, payload, null), visitor.factory)).status, 401); assert.equal(visitor.calls.length, 0);
    for (const state of ["pending", "suspended", "rejected"]) {
      const f = fixture({ student: { ...row, approval_status: state } });
      assert.equal((await handleStudentRequest(request(action, payload), f.factory)).status, 403);
      assert.ok(!f.calls.some(call => call[0] === "rpc" && call[1] !== "is_admin"));
      assert.ok(!f.calls.some(call => ["challenges", "challenge_submissions"].includes(call[1]) && call[0] === "from"));
    }
  });
}
test("quiz submission binds the student ID server-side and preserves the existing RPC signature", async () => {
  const f = fixture(); const response = await handleStudentRequest(request("quiz.submit", { id: 6, answers: { 1: 2 } }), f.factory);
  assert.equal(response.status, 200);
  assert.deepEqual(f.calls.find(call => call[0] === "rpc" && call[1] === "submit_quiz_attempt"), ["rpc", "submit_quiz_attempt", { p_quiz_id: 6, p_student_id: 17, p_answers: { 1: 2 } }]);
  const forged = fixture(); assert.equal((await handleStudentRequest(request("quiz.submit", { id: 6, answers: { 1: 2 }, studentId: 99 }), forged.factory)).status, 400); assert.equal(forged.calls.length, 0);
});
test("challenge submission binds ownership and rejects another student's file path", async () => {
  const f = fixture(); const p = { id: 6, text: "مشاركة", imagePath: null, filePath: null };
  assert.equal((await handleStudentRequest(request("challenge.submit", p), f.factory)).status, 200);
  const insert = f.calls.find(call => call[0] === "challenge_submissions" && call[1] === "insert");
  assert.equal(insert[2].student_id, 17); assert.equal(insert[2].status, "submitted");
  for (const filePath of ["challenges/6/99/work.pdf", "challenges/6/17/../work.pdf", "https://foreign.example/work.pdf"]) {
    assert.equal((await handleStudentRequest(request("challenge.submit", { ...p, filePath }), fixture().factory)).status, 400);
  }
});
test("unknown registration RPC is never called and no student row is inserted as a fallback", async () => {
  const f = fixture(); const response = await handleStudentRequest(request("enrollment.submit", { name: "اختبار", gradeId: 2, classroomId: 4 }), f.factory);
  assert.equal(response.status, 503); assert.equal((await response.json()).error.code, "contract_unverified");
  assert.ok(f.calls.every(call => call[0] === "rpc" && call[1] === "is_admin"));
});
test("offline, duplicate or hidden profiles cannot submit as approved", async () => {
  for (const options of [{ student: null }, { profileError: true }, { rows: [row, row] }]) {
    const f = fixture(options); assert.equal((await handleStudentRequest(request("quiz.submit", { id: 6, answers: { 1: 2 } }), f.factory)).status, 503);
    assert.ok(!f.calls.some(call => call[0] === "rpc" && call[1] === "submit_quiz_attempt"));
  }
});
test("teacher session is not silently converted into a student identity", async () => {
  const f = fixture({ admin: true }); assert.equal((await handleStudentRequest(request("quiz.load", { id: 6 }), f.factory)).status, 403);
  assert.ok(!f.calls.some(call => call[0] === "from"));
});
test("student menus expose own account and sign-out, never administration; visitors see both student entries", () => {
  const links = navigationGroupsForAccess({ ...approved, canSignOut: true }).flatMap(group => group.links);
  assert.equal(links.filter(link => link.label === "حسابي").length, 1); assert.equal(links.filter(link => link.action === "signOut").length, 1);
  assert.ok(links.every(link => !link.href?.startsWith("/admin")));
  const visitor = navigationGroupsForAccess({ status: "visitor", role: "visitor", canSignOut: false }).flatMap(group => group.links);
  for (const href of ["/register", "/student-login"]) assert.ok(visitor.some(link => link.href === href));
  for (const link of visitor.filter(link => link.href)) assert.ok(existsSync(new URL(`../src/app${link.href === "/" ? "" : link.href}/page.js`, import.meta.url)));
});
async function uploadRequest(file, { id = "6", kind = "file", token = "synthetic-token" } = {}) {
  const form = new FormData(); form.set("challengeId", id); form.set("kind", kind); form.set("file", file);
  const encoded = new Response(form);
  return new Request("https://platform.example/api/student/upload", { method: "POST", headers: { "Content-Type": encoded.headers.get("content-type"), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: await encoded.arrayBuffer() });
}
test("file upload rechecks approval and binds its path to the current student", async () => {
  const f = fixture(); const file = new File(["synthetic work"], "work.pdf", { type: "application/pdf" });
  const result = await handleStudentUpload(await uploadRequest(file), f.factory, () => "test-file-id");
  assert.equal(result.status, 200);
  assert.equal((await result.json()).data.path, "challenges/6/17/test-file-id-file.pdf");
  const upload = f.calls.find(call => call[0] === "upload"); assert.equal(upload[1], "student-private"); assert.deepEqual(upload[4], { cacheControl: "3600", upsert: false });
});
test("visitor, pending student, executable file and oversized upload are rejected without storage writes", async () => {
  const small = new File(["x"], "work.pdf", { type: "application/pdf" });
  for (const [req, options, status] of [
    [await uploadRequest(small, { token: null }), {}, 401],
    [await uploadRequest(small), { student: { ...row, approval_status: "pending" } }, 403],
    [await uploadRequest(new File(["x"], "work.html", { type: "text/html" })), {}, 400],
    [await uploadRequest(new File([new Uint8Array(11 * 1024 * 1024)], "work.pdf", { type: "application/pdf" })), {}, 413],
    [await uploadRequest(new File(["x"], "work.png", { type: "text/html" }), { kind: "image" }), {}, 400],
  ]) {
    const f = fixture(options); assert.equal((await handleStudentUpload(req, f.factory)).status, status); assert.ok(!f.calls.some(call => call[0] === "upload"));
  }
});
test("active participation routes no longer fetch any public student directory or accept a manual name", () => {
  for (const path of ["quiz/[id]/page.js", "challenges/[id]/page.js"]) {
    const source = readFileSync(new URL(`../src/app/${path}`, import.meta.url), "utf8");
    assert.ok(!source.includes("get_student_directory")); assert.ok(!source.includes('.from("students")'));
    assert.ok(!source.includes("setStudentId")); assert.ok(source.includes("StudentIdentity"));
  }
});

test("cross-origin student operations and uploads are rejected before database access", async () => {
  const f = fixture(); const req = request("quiz.load", { id: 6 });
  req.headers.set("origin", "https://foreign.example");
  assert.equal((await handleStudentRequest(req, f.factory)).status, 403);
  assert.equal(f.calls.length, 0);
  const upload = await uploadRequest(new File(["x"], "work.pdf"));
  upload.headers.set("sec-fetch-site", "cross-site");
  assert.equal((await handleStudentUpload(upload, f.factory)).status, 403);
  assert.equal(f.calls.length, 0);
});
test("database diagnostics never reach the student response", async () => {
  const f = fixture({ profileError: { message: "private diagnostic" } });
  const response = await handleStudentRequest(request("quiz.load", { id: 6 }), f.factory);
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes("private diagnostic"));
});
