import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { canAccessStudent, studentDestination } from "../src/lib/student/profile.mjs";
import { fetchAccountAccess } from "../src/lib/auth/access-client.mjs";

const redirectSource = (await readFile(new URL("../src/components/student/useStudentAccountRedirect.js", import.meta.url), "utf8"))
  .replace(/^import .*;\r?\n/gm, "").replace("export function ", "function ");
function runRedirect(access, pathname = "/student-login", options) {
  const calls = []; const effects = [];
  const context = vm.createContext({
    useAccess: () => access, usePathname: () => pathname,
    useRouter: () => ({ replace: path => calls.push(path) }),
    useEffect: callback => effects.push(callback), canAccessStudent, studentDestination,
  });
  vm.runInContext(redirectSource, context);
  const result = context.useStudentAccountRedirect(options);
  assert.equal(calls.length, 0, "navigation is not a render side effect");
  effects.forEach(callback => callback());
  return { calls, result };
}
const approved = { status: "authenticated", role: "student", student: { state: "approved", profile: { id: 17 } } };
for (const pathname of ["/student-login", "/register", "/auth/confirm", "/pending-approval"]) {
  test(`${pathname}: a verified approved student enters the quiz section directly`, () => {
    const result = runRedirect(approved, pathname, { approvedOnly: pathname === "/pending-approval" });
    assert.deepEqual(result.calls, ["/quizzes"]);
    assert.equal(result.result, approved);
  });
}
for (const state of ["pending", "suspended", "rejected"]) {
  test(`${state}: a resolved account is directed to its status page`, () => {
    assert.deepEqual(runRedirect({ status: "authenticated", role: null, student: { state } }).calls, ["/pending-approval"]);
  });
}
test("only a verified missing state directs an account to profile completion", () => {
  assert.deepEqual(runRedirect({ status: "authenticated", role: null, student: { state: "missing" } }).calls, ["/complete-profile"]);
});
for (const access of [
  { status: "authenticated", role: null, student: { state: "profile_unavailable" } },
  { status: "authenticated", role: null, student: { state: "verification_failed" } },
  { status: "error", role: null }, { status: "verifying", role: null },
  { status: "loading", role: null }, { status: "visitor", role: "visitor" },
  { status: "expired", role: null },
]) {
  test(`${access.student?.state || access.status}: unresolved sessions do not fall back to pending or profile completion`, () => {
    assert.deepEqual(runRedirect(access).calls, []);
  });
}
test("same-route and pending-status renders do not repeatedly replace their own route", () => {
  assert.deepEqual(runRedirect(approved, "/quizzes").calls, []);
  assert.deepEqual(runRedirect({ status: "authenticated", role: null, student: { state: "pending" } }, "/pending-approval", { approvedOnly: true }).calls, []);
});
test("an empty direct table read remains a verification error, not a pending or missing account", async () => {
  const response = Response.json({ authenticated: true, role: null, student: { state: "profile_unavailable", profile: null } });
  const access = await fetchAccountAccess("synthetic-token", { fetcher: async () => response });
  assert.equal(access.status, "error"); assert.equal(access.student.state, "profile_unavailable");
  assert.equal(studentDestination(access), null);
});
test("student login requests provider verification without a parallel check or unconditional redirect", async () => {
  const source = await readFile(new URL("../src/components/student/StudentAuthForm.js", import.meta.url), "utf8");
  const head = source.slice(0, source.indexOf("  return <AccountPage"))
    .replace(/^import .*;\r?\n/gm, "").replace("export default function ", "function ");
  let refreshCount = 0; let authCalls = 0; const navigation = [];
  const access = { refresh: async () => { refreshCount++; }, status: "visitor", canSignOut: false };
  const client = { auth: { signInWithPassword: async () => { authCalls++; return { data: { session: { access_token: "synthetic-token" } }, error: null }; } } };
  const context = vm.createContext({
    useStudentAccountRedirect: () => access,
    useState: initial => [initial, () => {}],
    loadStudentClient: async () => client,
    fetchAccountAccess: () => { throw new Error("parallel verification must not run"); },
    useRouter: () => ({ replace: target => navigation.push(target) }),
    authMessage: () => "خطأ", studentDestination,
  });
  vm.runInContext(head + "\nreturn { submit };\n}\n", context);
  await context.StudentAuthForm({}).submit({ preventDefault() {} });
  assert.equal(authCalls, 1); assert.equal(refreshCount, 1); assert.deepEqual(navigation, []);
});
