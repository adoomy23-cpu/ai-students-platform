import { createClient } from "@supabase/supabase-js";

export function createUserScopedClient(token, timeoutMs = 20000) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const deadline = AbortSignal.timeout(timeoutMs);
  // One client per request. Same public key + caller JWT: RLS is never bypassed.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init = {}) => fetch(input, { ...init, signal: init.signal
        ? AbortSignal.any([init.signal, deadline]) : deadline }),
    },
  });
}
