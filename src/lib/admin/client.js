import { supabase } from "../supabase";
import { safeAccessMessage } from "../auth/access-client.mjs";

export async function requestAdmin(action, payload = {}) {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      window.dispatchEvent(new Event("alfikr:access-invalidated"));
      return { data: null, error: { code: "unauthenticated", message: safeAccessMessage("unauthenticated") } };
    }
    const response = await fetch("/api/admin/operations", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(30000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ action, payload }),
    });
    const result = await response.json();
    if (!response.ok) {
      const code = result.error?.code;
      if (response.status === 401 || (response.status === 403 && code === "forbidden")) window.dispatchEvent(new Event("alfikr:access-invalidated"));
      return { data: null, error: { code, message: safeAccessMessage(code) } };
    }
    return { data: result.data, error: null };
  } catch { return { data: null, error: { code: "connection", message: safeAccessMessage("connection") } }; }
}
