import test from "node:test";
import assert from "node:assert/strict";
import { authorizeRequest, handleAccessRequest } from "../src/lib/auth/server-access.mjs";
import { handleAdminRequest } from "../src/lib/admin/handler.mjs";
import { adminOperations } from "../src/lib/admin/operations.mjs";
import { fetchAccountAccess } from "../src/lib/auth/access-client.mjs";

function fixture({ admin = true, userError = null, adminError = null, adminData = admin, databaseError = null } = {}) {
  const calls = [];
  let token;
  const query = new Proxy({}, { get: (_target, name) => name === "then" ? (resolve) => Promise.resolve(resolve({ data: [{ id: 1 }], error: databaseError })) : (...args) => { calls.push([name, ...args]); return query; } });
  const client = {
    auth: { getUser: async (value) => { calls.push(["getUser", value]); return { data: userError ? null : { user: { id: "synthetic-user", email: "not-for-response@example.invalid", user_metadata: { role: "admin" } } }, error: userError }; } },
    rpc: async (name, args) => { calls.push(["rpc", name, args]); return name === "is_admin" ? { data: adminData, error: adminError } : { data: [], error: databaseError }; },
    from: (table) => { calls.push(["from", table]); return query; },
  };
  return { calls, factory: (value) => { token = value; return client; }, getToken: () => token };
}
function request(body = { action: "students.list", payload: {} }, { token = "synthetic-token", origin, contentType = "application/json" } = {}) {
  return new Request("https://platform.example/api/admin/operations", { method: "POST", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": contentType, ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
}
test("anonymous requests are rejected before creating any database client", async () => {
  let constructed = false;
  const response = await handleAdminRequest(request(undefined, { token: null }), () => { constructed = true; });
  assert.equal(response.status, 401);
  assert.equal(constructed, false);
});
test("expired or forged credentials cannot reach the role RPC or data operations", async () => {
  const f = fixture({ userError: { status: 401, message: "private server diagnostic" } });
  const result = await handleAdminRequest(request(), f.factory);
  assert.equal(result.status, 401);
  assert.deepEqual(f.calls.map(call => call[0]), ["getUser"]);
  assert.ok(!(await result.text()).includes("private"));
});
for (const action of Object.keys(adminOperations)) {
  test(`ordinary student cannot invoke ${action}, even with forged admin metadata`, async () => {
    const f = fixture({ admin: false });
    const response = await handleAdminRequest(request({ action, payload: {} }), f.factory);
    assert.equal(response.status, 403);
    assert.ok(f.calls.every(call => call[0] === "getUser" || (call[0] === "rpc" && call[1] === "is_admin")));
  });
}
for (const adminData of [null, "true", 1, {}, [true]]) {
  test(`malformed is_admin contract (${JSON.stringify(adminData)}) fails closed`, async () => {
    const f = fixture({ adminData });
    assert.equal((await handleAdminRequest(request(), f.factory)).status, 503);
    assert.ok(!f.calls.some(call => call[0] === "from"));
  });
}
test("missing server connection and role RPC failures do not grant access", async () => {
  assert.equal((await authorizeRequest(request(), () => null)).status, 503);
  assert.equal((await handleAdminRequest(request(), fixture({ adminError: { message: "private" } }).factory)).status, 503);
  assert.equal((await handleAdminRequest(request(), () => { throw new Error("private"); })).status, 503);
});
test("only verified administrators receive data and every request rechecks authority", async () => {
  const f = fixture();
  const first = await handleAdminRequest(request(), f.factory);
  const second = await handleAdminRequest(request(), f.factory);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(f.calls.filter(call => call[0] === "getUser").length, 2);
  assert.equal(f.calls.filter(call => call[0] === "rpc" && call[1] === "is_admin").length, 2);
  assert.equal(f.calls.findIndex(call => call[0] === "from") > f.calls.findIndex(call => call[0] === "rpc"), true);
  assert.equal(first.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(first.headers.get("vary"), "Authorization");
  assert.equal(f.getToken(), "synthetic-token");
});
test("account response exposes no token, user record or inferred student approval", async () => {
  for (const admin of [true, false]) {
    const response = await handleAccessRequest(request(), fixture({ admin }).factory);
    assert.deepEqual(await response.json(), { role: admin ? "admin" : null, authenticated: true });
  }
});
test("unknown actions, alternate tables, added privilege fields and invalid IDs are rejected", async () => {
  for (const body of [
    { action: "__proto__", payload: {} }, { action: "constructor", payload: {} },
    { action: "students.list", payload: { table: "auth.users" } },
    { action: "students.create", payload: { classroom_id: 1, student_name: "Synthetic", is_active: true, approval_status: "approved" } },
    { action: "students.active", payload: { id: -1, is_active: true } },
    { action: "students.active", payload: { id: 1, is_active: "true" } },
    { action: "students.list", payload: {}, user_id: "someone-else" },
  ]) {
    const f = fixture();
    assert.equal((await handleAdminRequest(request(body), f.factory)).status, 400);
    assert.ok(!f.calls.some(call => call[0] === "from"));
  }
});
test("cross-origin, wrong content type, malformed and oversized requests are rejected", async () => {
  const f = fixture();
  assert.equal((await handleAdminRequest(request(undefined, { origin: "https://foreign.example" }), f.factory)).status, 403);
  assert.equal(f.calls.length, 0);
  assert.equal((await handleAdminRequest(request(undefined, { contentType: "text/plain" }), fixture().factory)).status, 400);
  const malformed = new Request("https://platform.example/api/admin/operations", { method: "POST", headers: { Authorization: "Bearer synthetic-token", "Content-Type": "application/json" }, body: "{" });
  assert.equal((await handleAdminRequest(malformed, fixture().factory)).status, 400);
  assert.equal((await handleAdminRequest(request({ action: "content.create", payload: { text: "x".repeat(270000) } }), fixture().factory)).status, 413);
});
test("database errors are redacted and permissions are never elevated to work around them", async () => {
  const response = await handleAdminRequest(request(), fixture({ databaseError: { message: "private table or student information" } }).factory);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: { code: "database_error" } });
});
test("frontend permission parsing treats expired, offline and malformed responses as unconfirmed", async () => {
  const cases = [
    [Response.json({ role: "admin", authenticated: true }), "authenticated", "admin"],
    [Response.json({ role: null, authenticated: true }), "authenticated", null],
    [Response.json({ role: "admin" }), "error", null],
    [Response.json({ role: "student", authenticated: true }), "error", null],
    [Response.json({}, { status: 401 }), "expired", null],
    [Response.json({}, { status: 503 }), "error", null],
  ];
  for (const [response, status, role] of cases) {
    const result = await fetchAccountAccess("synthetic-token", { fetcher: async () => response });
    assert.equal(result.status, status); assert.equal(result.role, role);
  }
  assert.equal((await fetchAccountAccess("synthetic-token", { fetcher: async () => { throw new Error("offline"); } })).role, null);
});
const payloads = {
  "grades.list": {}, "classrooms.list": {}, "classrooms.directory": {}, "students.list": {}, "students.approvals": {}, "content.list": {}, "quizzes.list": {}, "challenges.list": {}, "results.list": {},
  "classrooms.create": { grade_id: 1, name: "A", is_active: true, sort_order: 1 },
  "classrooms.rename": { id: 1, name: "B" }, "classrooms.active": { id: 1, is_active: false },
  "students.create": { classroom_id: 1, student_name: "Synthetic", is_active: true },
  "students.rename": { id: 1, student_name: "Synthetic rename" }, "students.active": { id: 1, is_active: false },
  "content.create": { title: "Synthetic content", description: null, content_type: "video", content_url: null, thumbnail_url: null, related_lesson: null, status: "published", is_featured: false, sort_order: 0 },
  "content.delete": { id: 1 }, "quizzes.delete": { id: 1 }, "quizzes.preview": { id: 1 },
  "quizzes.publish": { id: 1, status: "draft", updated_at: "2026-10-14T00:00:00.000Z" },
  "quizzes.create": { title: "Synthetic quiz", description: null, status: "draft", start_at: null, end_at: null, time_limit_minutes: null, show_score: true, show_correct_answers: false, max_attempts: 1, is_featured: false, sort_order: 0 },
};
for (const action of Object.keys(adminOperations)) {
  test(`verified admin can still perform existing ${action} operation with the same payload`, async () => {
    const f = fixture();
    assert.equal((await handleAdminRequest(request({ action, payload: payloads[action] }), f.factory)).status, 200);
    assert.ok(f.calls.some(call => call[0] === "from" || (call[0] === "rpc" && call[1] !== "is_admin")));
  });
}

test("auth-server network failures are distinguished from expired credentials", async () => {
  for (const error of [{ status: 503 }, { status: 0 }, { message: "offline" }]) {
    const f = fixture({ userError: error });
    assert.equal((await handleAdminRequest(request(), f.factory)).status, 503);
    assert.ok(!f.calls.some(call => call[0] === "from" || call[0] === "rpc"));
  }
});

test("existing sorting, joins and narrowly scoped updates survive the server migration", async () => {
  const quiz = fixture();
  await handleAdminRequest(request({ action: "quizzes.list", payload: {} }), quiz.factory);
  assert.deepEqual(quiz.calls.filter(call => call[0] === "order"), [["order", "sort_order", { ascending: true }], ["order", "created_at", { ascending: false }]]);
  const classroom = fixture();
  await handleAdminRequest(request({ action: "classrooms.list", payload: {} }), classroom.factory);
  assert.equal(classroom.calls.find(call => call[0] === "select")[1], "id,grade_id,name,is_active,sort_order,grades(name)");
  const student = fixture();
  await handleAdminRequest(request({ action: "students.rename", payload: { id: 8, student_name: "Synthetic rename" } }), student.factory);
  assert.deepEqual(student.calls.find(call => call[0] === "update"), ["update", { student_name: "Synthetic rename" }]);
  assert.deepEqual(student.calls.find(call => call[0] === "eq"), ["eq", "id", 8]);
  assert.ok(!student.calls.some(call => JSON.stringify(call).includes("approval_status")));
});

test("legitimate forwarded Codespaces origins work without authorizing unverified users", async () => {
  const forwarded = (token = "synthetic-token") => new Request("http://localhost:3000/api/admin/operations", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Origin: "https://school.example.app.github.dev", "X-Forwarded-Host": "school.example.app.github.dev", "X-Forwarded-Proto": "https" }, body: JSON.stringify({ action: "students.list", payload: {} }),
  });
  assert.equal((await handleAdminRequest(forwarded(), fixture().factory)).status, 200);
  assert.equal((await handleAdminRequest(forwarded(), fixture({ admin: false }).factory)).status, 403);
  const crossSite = request(); crossSite.headers.set("sec-fetch-site", "cross-site");
  assert.equal((await handleAdminRequest(crossSite, fixture().factory)).status, 403);
});
