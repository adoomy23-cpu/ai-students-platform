import test from "node:test";
import assert from "node:assert/strict";
import { inspectOwnStudent, canAccessStudent } from "../src/lib/student/profile.mjs";
import { handleStudentRequest } from "../src/lib/student/handler.mjs";
import { handleAccessRequest } from "../src/lib/auth/server-access.mjs";
import { studentQuizResponse } from "../src/lib/student/quiz-response.mjs";

// Synthetic known-column fixtures test runtime validation, not the live RPC's
// still-unavailable return declaration. Never treat these as live schema proof.
const own = { id: 17, user_id: "synthetic-user", student_name: "طالب تجريبي", classroom_id: null, approval_status: "approved", is_active: true };
const quiz = { quiz: { id: 6, title: "اختبار تجريبي", description: null, answer_key: "private", attempts: [{ student_name: "private" }] }, questions: [{ id: 1, question_text: "سؤال تجريبي", points: 1, image_url: null, correct_option_id: 2, explanation: "private", options: [{ id: 2, option_text: "الخيار الأول", is_correct: true, student_email: "private" }] }], admin_only: "private" };
function fixture({ profile = [own], rpcError = null, reject = false, admin = false, quizData = quiz } = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: own.user_id } }, error: null }) },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (name === "is_admin") return { data: admin, error: null };
      if (name === "get_my_student_profile") { if (reject) throw new Error("private connection failure"); return { data: profile, error: rpcError }; }
      if (name === "get_quiz_for_student") return { data: quizData, error: null };
      if (name === "submit_quiz_attempt") return { data: { score: 1, total_points: 1, correct_answers: [2], student_email: "private" }, error: null };
      throw new Error("Unverified RPC called");
    },
    from: () => { throw new Error("Direct reads must not be needed for identity or this quiz"); },
  };
  return { calls, client, factory: () => client };
}
function request(action, payload, token = "synthetic-token") {
  return new Request("https://platform.example/api/student/operations", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ action, payload }) });
}
for (const profile of [own, [own]]) {
  test(`RPC runtime validation accepts a matching known-column ${Array.isArray(profile) ? "single-row array" : "record"}`, async () => {
    const f = fixture({ profile }); const result = await inspectOwnStudent(f.client, own.user_id);
    assert.equal(result.state, "approved");
    assert.deepEqual(f.calls, [["get_my_student_profile", undefined]]);
    assert.equal(canAccessStudent({ status: "authenticated", role: "student", student: result }), true);
  });
}
for (const profile of [null, []]) {
  test(`empty RPC ${JSON.stringify(profile)} does not prove absence without the full definition`, async () => {
    const f = fixture({ profile }); const result = await inspectOwnStudent(f.client, own.user_id);
    assert.equal(result.state, "profile_unavailable"); assert.equal(result.profile, null);
    const proven = await inspectOwnStudent(f.client, own.user_id, { emptyMeansMissingVerified: true });
    assert.equal(proven.state, "missing");
  });
}
for (const profile of [false, "unknown", {}, { profile: own }, [own, own], [{ ...own, user_id: "another-user" }], [{ ...own, user_id: undefined }], [{ ...own, student_name: undefined, name: own.student_name }], [{ ...own, id: undefined, student_id: 17 }]]) {
  test(`unconfirmed/mismatched RPC shape ${JSON.stringify(profile)} fails closed`, async () => {
    const result = await inspectOwnStudent(fixture({ profile }).client, own.user_id);
    assert.equal(result.state, "verification_failed"); assert.equal(result.profile, null);
  });
}
for (const options of [{ rpcError: { message: "private SQL diagnostic" } }, { reject: true }]) {
  test("RPC errors never become a missing profile and never fall back to a direct table read", async () => {
    const f = fixture(options); const result = await inspectOwnStudent(f.client, own.user_id);
    assert.equal(result.state, "verification_failed"); assert.deepEqual(f.calls, [["get_my_student_profile", undefined]]);
    assert.ok(!JSON.stringify(result).includes("private"));
  });
}
test("account response projects only owned display fields, ignoring role and sensitive RPC extras", async () => {
  const f = fixture({ profile: [{ ...own, role: "admin", email: "private", password: "private", other_students: [{ student_name: "private" }] }] });
  const response = await handleAccessRequest(request("quiz.load", { id: 6 }), f.factory, inspectOwnStudent);
  const data = await response.json();
  assert.equal(data.role, "student"); assert.equal(data.student.profile.name, own.student_name);
  assert.ok(!JSON.stringify(data).includes("private")); assert.ok(!JSON.stringify(data).includes("user_id"));
});
test("approved quiz response never includes answer keys, correct flags or another student's data", async () => {
  const f = fixture(); const response = await handleStudentRequest(request("quiz.load", { id: 6 }), f.factory);
  assert.equal(response.status, 200); const body = await response.json();
  assert.deepEqual(body.data.questions[0].options, [{ id: 2, option_text: "الخيار الأول" }]);
  for (const sensitive of ["answer_key", "is_correct", "correct_option_id", "explanation", "attempts", "student_email", "admin_only", "private"]) assert.ok(!JSON.stringify(body).includes(sensitive));
});
test("quiz result returns score only, with correct answers and identity extras stripped", async () => {
  const response = await handleStudentRequest(request("quiz.submit", { id: 6, answers: { 1: 2 } }), fixture().factory);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { data: { score: 1, total_points: 1 }, error: null });
});
for (const profile of [[{ ...own, is_active: false }], [{ ...own, approval_status: "pending" }], [{ ...own, approval_status: "suspended" }], [{ ...own, user_id: "another-user" }]]) {
  test("a stopped/pending/foreign profile cannot load questions or submit answers", async () => {
    for (const [action, payload] of [["quiz.load", { id: 6 }], ["quiz.submit", { id: 6, answers: { 1: 2 } }]]) {
      const f = fixture({ profile }); const response = await handleStudentRequest(request(action, payload), f.factory);
      assert.ok([403, 503].includes(response.status));
      assert.ok(f.calls.every(call => ["is_admin", "get_my_student_profile"].includes(call[0])));
    }
  });
}
test("malformed quiz RPC payloads are never forwarded raw", () => {
  for (const data of [null, [], {}, { ...quiz, quiz: { ...quiz.quiz, id: 7 } }, { ...quiz, questions: [{ ...quiz.questions[0], options: null }] }]) assert.equal(studentQuizResponse(data, 6), null);
});
test("practice quiz omits answer keys and grades all answers on the server, counting each once", async () => {
  const f = fixture(); const load = await handleStudentRequest(request("practice.load", {}), f.factory);
  assert.equal(load.status, 200); const body = await load.json();
  assert.equal(body.data.questions.length, 3); assert.ok(!JSON.stringify(body).includes("correct"));
  const submit = await handleStudentRequest(request("practice.submit", { answers: [0, 0, 0] }), f.factory);
  assert.deepEqual(await submit.json(), { data: { score: 3, total_points: 3 }, error: null });
  assert.equal((await handleStudentRequest(request("practice.submit", { answers: [1, 1, 1] }), f.factory)).status, 200);
  assert.equal((await handleStudentRequest(request("practice.submit", { answers: [0, 0, 999] }), f.factory)).status, 400);
});
test("practice actions require approved identity, and enrollment remains closed without its RPC definition", async () => {
  for (const [action, payload] of [["practice.load", {}], ["practice.submit", { answers: [0, 0, 0] }]]) {
    assert.equal((await handleStudentRequest(request(action, payload, null), fixture().factory)).status, 401);
    assert.equal((await handleStudentRequest(request(action, payload), fixture({ profile: [{ ...own, approval_status: "pending" }] }).factory)).status, 403);
  }
  const f = fixture(); const response = await handleStudentRequest(request("enrollment.submit", { name: "اختبار", gradeId: 1, classroomId: 2 }), f.factory);
  assert.equal(response.status, 503); assert.deepEqual(f.calls, [["is_admin", undefined]]);
});
