export const initialAccess = Object.freeze({ status: "loading", role: null, canSignOut: false, signingOut: false, accountEpoch: 0, retainAdmin: false, retainStudent: false });

// UI state contains no tokens or directory; only the verified student's own display profile. Authority always comes from
// the server; local sessions only supply a credential for that verification.
export function createAccessStore({ loadClient, verify, now = Date.now, schedule = setTimeout, unschedule = clearTimeout }) {
  let snapshot = initialAccess;
  let client = null;
  let session = null;
  let active = false;
  let life = 0;
  let revision = 0;
  let subscription = null;
  let expiryTimer = null;
  let controller = null;
  let accountEpoch = 0;
  let retainAdmin = false;
  let retainStudent = false;
  const listeners = new Set();
  const emit = (value) => { snapshot = Object.freeze({ ...value, accountEpoch, retainAdmin, retainStudent }); listeners.forEach((listener) => listener()); };
  function invalidate() {
    revision += 1;
    controller?.abort();
    controller = null;
    unschedule(expiryTimer);
    expiryTimer = null;
    return revision;
  }
  function acceptSession(next) {
    const version = invalidate();
    if ((session?.user?.id || null) !== (next?.user?.id || null)) { accountEpoch += 1; retainAdmin = false; retainStudent = false; }
    session = next;
    if (!next?.access_token || !next?.user?.id) { retainAdmin = false; retainStudent = false; emit({ status: "visitor", role: "visitor", canSignOut: false, signingOut: false }); return; }
    const expires = Number(next.expires_at) * 1000;
    if (Number.isFinite(expires) && expires <= now()) { retainAdmin = false; retainStudent = false; emit({ status: "expired", role: null, canSignOut: true, signingOut: false }); return; }
    emit({ status: "verifying", role: null, canSignOut: true, signingOut: false });
    const verificationController = new AbortController();
    controller = verificationController;
    const remaining = Number.isFinite(expires) ? Math.max(0, expires - now()) : 60000;
    expiryTimer = schedule(() => { refresh(); }, Math.min(remaining, 60000));
    Promise.resolve().then(() => active && revision === version ? verify(next.access_token, { signal: verificationController.signal }) : null).then((result) => {
      if (!active || revision !== version) return;
      if (result.status === "authenticated") { retainAdmin = result.role === "admin"; retainStudent = result.role === "student" && result.student?.state === "approved"; }
      if (["expired", "visitor"].includes(result.status)) { retainAdmin = false; retainStudent = false; }
      emit({ ...result, canSignOut: true, signingOut: false });
    }).catch(() => {
      if (active && revision === version) emit({ status: "error", role: null, canSignOut: true, signingOut: false });
    });
  }
  async function refresh() {
    if (!active || snapshot.signingOut) return;
    if (!client) { emit({ status: "loading", role: null, canSignOut: false, signingOut: false }); start(); return; }
    const version = invalidate();
    emit({ status: "verifying", role: null, canSignOut: Boolean(session), signingOut: false });
    try {
      const { data, error } = await client.auth.getSession();
      if (!active || revision !== version) return;
      if (error) { emit({ status: "error", role: null, canSignOut: Boolean(session), signingOut: false }); return; }
      acceptSession(data.session);
    } catch {
      if (active && revision === version) emit({ status: "error", role: null, canSignOut: Boolean(session), signingOut: false });
    }
  }
  function start() {
    active = true;
    const generation = ++life;
    Promise.resolve().then(loadClient).then(async (loaded) => {
      if (!active || life !== generation) return;
      client = loaded;
      if (!client) { emit({ status: "unavailable", role: null, canSignOut: false, signingOut: false }); return; }
      let changed = false;
      subscription = client.auth.onAuthStateChange((_event, next) => {
        changed = true;
        if (active && life === generation) acceptSession(next);
      }).data.subscription;
      const version = revision;
      const { data, error } = await client.auth.getSession().catch(() => ({ data: null, error: true }));
      if (!active || life !== generation || changed || revision !== version) return;
      if (error) emit({ status: "error", role: null, canSignOut: false, signingOut: false });
      else acceptSession(data.session);
    }).catch(() => {
      if (active && life === generation) emit({ status: "error", role: null, canSignOut: Boolean(session), signingOut: false });
    });
    return () => { active = false; life += 1; invalidate(); subscription?.unsubscribe(); subscription = null; snapshot = initialAccess; retainAdmin = false; retainStudent = false; accountEpoch += 1; client = null; session = null; };
  }
  async function signOut() {
    if (!client || snapshot.signingOut) return;
    const version = invalidate();
    retainAdmin = false; retainStudent = false;
    emit({ status: "verifying", role: null, canSignOut: Boolean(session), signingOut: true });
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (!active || revision !== version) return;
      if (error) { emit({ status: "error", role: null, canSignOut: Boolean(session), signingOut: false }); return; }
      acceptSession(null);
    } catch {
      if (active && revision === version) emit({ status: "error", role: null, canSignOut: Boolean(session), signingOut: false });
    }
  }
  return { start, refresh, signOut, getSnapshot: () => snapshot, getServerSnapshot: () => initialAccess,
    subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); } };
}
