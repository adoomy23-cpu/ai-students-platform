import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Offline lifecycle checks. React hooks and network responses are mocked;
// these tests neither render JSX nor replace ESLint or a Next.js build.
const pages = [
  "admin/challenges/page.js", "admin/classrooms/page.js", "admin/content/page.js",
  "admin/quizzes/page.js", "admin/quizzes/[id]/page.js", "admin/results/page.js",
  "admin/students/page.js", "challenges/page.js", "challenges/[id]/page.js",
  "challenges/[id]/page.before-upload.js", "content/page.js", "quiz/[id]/page.js",
  "quiz/[id]/page.before-result-page.js", "quiz/[id]/page.before-student.js",
  "quiz/[id]/page.working.js", "q/page.js",
];

async function checkLifecycle(page, scenario) {
  const source = await readFile(new URL("../src/app/" + page, import.meta.url), "utf8");
  const declaration = source.match(/export default function (\w+)\(/);
  assert.ok(declaration, "page component exists");
  const start = declaration.index;
  const renderStart = source.slice(start).search(/^  (?:if\s*\(|return\s)/m);
  assert.ok(renderStart > 0, "component has a render boundary");
  const componentHead = source.slice(0, start + renderStart)
    .replace(/^import .*;\r?\n/gm, "")
    .replace("export default function ", "function ");

  let resolve;
  let reject;
  const response = new Promise((a, b) => { resolve = a; reject = b; });
  const updates = [];
  const effects = [];
  const query = new Proxy({}, {
    get: (_, name) => name === "then" ? response.then.bind(response) : () => query,
  });
  const context = vm.createContext({
    console: { error() {} }, Promise, Number, String, Boolean, AbortController,
    supabase: { from: () => query, rpc: () => query },
    requestAdmin: () => response,
    requestStudent: () => response,
    useAccess: () => ({ status: "authenticated", role: "student", student: { state: "approved", profile: { id: 1 } } }),
    useParams: () => ({ id: "1" }),
    useDialogs: () => ({ notify: async () => {}, confirmAction: async () => false, requestText: async () => null }),
    useState: (initial) => [typeof initial === "function" ? initial() : initial, (value) => updates.push(value)],
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: (fn) => effects.push(fn),
  });
  vm.runInContext(componentHead + "\n}\n" + declaration[1] + "();", context);
  assert.equal(updates.length, 0, "render must not update state");
  assert.ok(effects.length > 0, "initial data effect exists");
  const cleanups = effects.map((effect) => effect());
  assert.equal(updates.length, 0, "effect must not synchronously update state");
  if (scenario === "cleanup") cleanups.forEach((cleanup) => cleanup?.());
  if (scenario === "failure") reject(new Error("offline"));
  else resolve({ data: [], error: null });
  for (let tick = 0; tick < 16; tick++) await Promise.resolve();
  if (scenario === "cleanup") assert.equal(updates.length, 0, "ignore late response after cleanup");
  else assert.ok(updates.length > 0, "handle response or failure asynchronously");
}

for (const page of pages) {
  for (const scenario of ["response", "failure", "cleanup"]) {
    test(page + ": " + scenario, () => checkLifecycle(page, scenario));
  }
}
