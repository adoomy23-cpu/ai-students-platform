import test from "node:test";
import assert from "node:assert/strict";
import { createAccessStore } from "../src/lib/auth/access-store.mjs";
import { canAccessAdmin } from "../src/config/navigation.mjs";

const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const flush = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
function setup({ session = null, verify = async () => ({ status: "authenticated", role: "admin" }), sessionError = null, logoutError = null, clientAvailable = true } = {}) {
  let authEvent;
  let currentSession = session;
  let unsubscribed = false;
  const timers = new Map(); let timerId = 0;
  const calls = [];
  const client = { auth: {
    getSession: async () => ({ data: { session: currentSession }, error: sessionError }),
    onAuthStateChange: (callback) => { authEvent = callback; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
    signOut: async (options) => { calls.push(options); return { error: logoutError }; },
  } };
  const store = createAccessStore({ loadClient: async () => clientAvailable ? client : null, verify,
    now: () => 1000, schedule: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; }, unschedule: (id) => timers.delete(id) });
  return { store, calls, timers, emit: (next) => { currentSession = next; authEvent("CHANGED", next); }, unsubscribed: () => unsubscribed };
}
const session = { access_token: "synthetic-token", user: { id: "synthetic-user" }, expires_at: 90 };
test("initial loading and asynchronous verification never show administrator tools", async () => {
  const pending = deferred(); const f = setup({ session, verify: () => pending.promise });
  assert.equal(canAccessAdmin(f.store.getSnapshot()), false);
  const stop = f.store.start(); assert.equal(f.store.getSnapshot().status, "loading");
  await flush(); assert.equal(f.store.getSnapshot().status, "verifying");
  assert.equal(canAccessAdmin(f.store.getSnapshot()), false);
  pending.resolve({ status: "authenticated", role: "admin" }); await flush();
  assert.equal(canAccessAdmin(f.store.getSnapshot()), true); stop();
});
test("an ordinary signed-in account is not automatically declared an approved student", async () => {
  const f = setup({ session, verify: async () => ({ status: "authenticated", role: null }) });
  const stop = f.store.start(); await flush();
  assert.equal(f.store.getSnapshot().role, null); assert.equal(f.store.getSnapshot().canSignOut, true); stop();
});
test("logout events invalidate a late admin response", async () => {
  const pending = deferred(); const f = setup({ session, verify: () => pending.promise });
  const stop = f.store.start(); await flush(); f.emit(null);
  pending.resolve({ status: "authenticated", role: "admin" }); await flush();
  assert.equal(f.store.getSnapshot().status, "visitor"); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); stop();
});
test("switching accounts rejects the older account's successful admin check", async () => {
  const a = deferred(), b = deferred(); let checks = 0;
  const f = setup({ session, verify: () => ++checks === 1 ? a.promise : b.promise });
  const stop = f.store.start(); await flush(); f.emit({ ...session, access_token: "second-token", user: { id: "second-user" } }); await flush();
  a.resolve({ status: "authenticated", role: "admin" }); await flush(); assert.equal(f.store.getSnapshot().status, "verifying");
  b.resolve({ status: "authenticated", role: null }); await flush(); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); stop();
});
test("offline and failed permission checks revoke previous UI authority until reverified", async () => {
  let checks = 0; const f = setup({ session, verify: async () => ++checks === 1 ? { status: "authenticated", role: "admin" } : { status: "error", role: null } });
  const stop = f.store.start(); await flush(); assert.equal(canAccessAdmin(f.store.getSnapshot()), true);
  const refresh = f.store.refresh(); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); await refresh; await flush();
  assert.equal(f.store.getSnapshot().status, "error"); stop();
});
test("expiration does not preserve authority or send an already expired credential for UI verification", async () => {
  let checks = 0; const f = setup({ session: { ...session, expires_at: 0 }, verify: async () => { checks++; return { role: "admin" }; } });
  const stop = f.store.start(); await flush(); assert.equal(f.store.getSnapshot().status, "expired"); assert.equal(checks, 0); stop();
});
test("active admin permissions have a short UI lease and recheck when the timer fires", async () => {
  const f = setup({ session }); const stop = f.store.start(); await flush();
  assert.ok([...f.timers.values()][0].delay <= 60000);
  [...f.timers.values()][0].fn(); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); await flush(); stop();
});
test("sign-out hides tools immediately and uses the existing Supabase session mechanism", async () => {
  const f = setup({ session }); const stop = f.store.start(); await flush();
  const logout = f.store.signOut(); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); await logout;
  assert.deepEqual(f.calls, [{ scope: "local" }]); assert.equal(f.store.getSnapshot().status, "visitor"); stop();
});
test("a failed sign-out does not silently restore administrator tools", async () => {
  const f = setup({ session, logoutError: new Error("offline") }); const stop = f.store.start(); await flush(); await f.store.signOut();
  assert.equal(f.store.getSnapshot().status, "error"); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); stop();
});
test("unmount aborts verification, unsubscribes and ignores late responses", async () => {
  const pending = deferred(); let signal; const f = setup({ session, verify: (_token, options) => { signal = options.signal; return pending.promise; } });
  const stop = f.store.start(); await flush(); stop();
  assert.equal(signal.aborted, true); assert.equal(f.unsubscribed(), true); assert.equal(f.timers.size, 0);
  pending.resolve({ status: "authenticated", role: "admin" }); await flush(); assert.equal(f.store.getSnapshot().status, "loading"); assert.equal(canAccessAdmin(f.store.getSnapshot()), false);
});
test("missing connection and session failure never grant administration", async () => {
  for (const options of [{ clientAvailable: false }, { sessionError: new Error("offline") }]) {
    const f = setup(options), stop = f.store.start(); await flush(); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); stop();
  }
});

test("restarting a stopped store does not briefly retain the previous administrator role", async () => {
  const f = setup({ session }); const first = f.store.start(); await flush();
  assert.equal(canAccessAdmin(f.store.getSnapshot()), true); first();
  const second = f.store.start(); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); await flush(); second();
});

test("revalidation retains the same-account draft eligibility without granting uncertain authority", async () => {
  const pending = deferred(); let checks = 0;
  const f = setup({ session, verify: () => ++checks === 1 ? Promise.resolve({ status: "authenticated", role: "admin" }) : pending.promise });
  const stop = f.store.start(); await flush(); const epoch = f.store.getSnapshot().accountEpoch;
  f.store.refresh(); await flush();
  assert.equal(f.store.getSnapshot().retainAdmin, true);
  assert.equal(canAccessAdmin(f.store.getSnapshot()), false);
  assert.equal(f.store.getSnapshot().accountEpoch, epoch);
  pending.resolve({ status: "authenticated", role: "admin" }); await flush();
  assert.equal(canAccessAdmin(f.store.getSnapshot()), true); assert.equal(f.store.getSnapshot().accountEpoch, epoch); stop();
});
test("account changes and explicit permission denial clear retained administrator state", async () => {
  const pending = deferred(); let checks = 0;
  const f = setup({ session, verify: () => ++checks === 1 ? Promise.resolve({ status: "authenticated", role: "admin" }) : pending.promise });
  const stop = f.store.start(); await flush(); const epoch = f.store.getSnapshot().accountEpoch;
  f.emit({ ...session, user: { id: "different-user" }, access_token: "different-token" });
  assert.equal(f.store.getSnapshot().retainAdmin, false); assert.notEqual(f.store.getSnapshot().accountEpoch, epoch);
  await flush(); pending.resolve({ status: "authenticated", role: null }); await flush();
  assert.equal(f.store.getSnapshot().retainAdmin, false); stop();
});
test("same-account permission revocation discards rather than restores cached administrator state", async () => {
  let checks = 0; const f = setup({ session, verify: async () => ({ status: "authenticated", role: ++checks === 1 ? "admin" : null }) });
  const stop = f.store.start(); await flush(); await f.store.refresh(); await flush();
  assert.equal(f.store.getSnapshot().retainAdmin, false); assert.equal(canAccessAdmin(f.store.getSnapshot()), false); stop();
});

test("student revalidation hides identity and authority while retaining only same-account draft eligibility", async () => {
  const pending = deferred(); let checks = 0;
  const approved = { status: "authenticated", role: "student", student: { state: "approved", profile: { id: 17, name: "طالب تجريبي" } } };
  const f = setup({ session, verify: () => ++checks === 1 ? Promise.resolve(approved) : pending.promise });
  const stop = f.store.start(); await flush();
  assert.equal(f.store.getSnapshot().retainStudent, true);
  f.store.refresh(); await flush();
  assert.equal(f.store.getSnapshot().student, undefined);
  assert.equal(f.store.getSnapshot().role, null);
  assert.equal(f.store.getSnapshot().retainStudent, true);
  pending.resolve({ status: "authenticated", role: null, student: { state: "suspended", profile: null } }); await flush();
  assert.equal(f.store.getSnapshot().retainStudent, false);
  stop();
});
test("logout and account changes immediately clear the previous student's display identity and draft eligibility", async () => {
  const f = setup({ session, verify: async () => ({ status: "authenticated", role: "student", student: { state: "approved", profile: { id: 17, name: "طالب تجريبي" } } }) });
  const stop = f.store.start(); await flush();
  assert.equal(f.store.getSnapshot().retainStudent, true);
  f.emit({ ...session, user: { id: "another-user" } });
  assert.equal(f.store.getSnapshot().student, undefined);
  assert.equal(f.store.getSnapshot().retainStudent, false);
  f.emit(null); await flush();
  assert.equal(f.store.getSnapshot().student, undefined);
  assert.equal(f.store.getSnapshot().retainStudent, false);
  stop();
});
