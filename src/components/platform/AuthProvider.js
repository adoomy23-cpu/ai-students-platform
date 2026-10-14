"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { createAccessStore } from "../../lib/auth/access-store.mjs";
import { fetchAccountAccess } from "../../lib/auth/access-client.mjs";

const AuthContext = createContext(null);
async function loadClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return (await import("../../lib/supabase")).supabase;
}
export default function AuthProvider({ children }) {
  const [store] = useState(() => createAccessStore({ loadClient, verify: fetchAccountAccess }));
  const access = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  useEffect(() => {
    const stop = store.start();
    const refresh = () => { store.refresh(); };
    const visible = () => { if (document.visibilityState === "visible") store.refresh(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("alfikr:access-invalidated", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => { stop(); window.removeEventListener("focus", refresh); window.removeEventListener("online", refresh); window.removeEventListener("alfikr:access-invalidated", refresh); document.removeEventListener("visibilitychange", visible); };
  }, [store]);
  return <AuthContext.Provider value={{ ...access, refresh: store.refresh, signOut: store.signOut }}>{children}</AuthContext.Provider>;
}
export function useAccess() {
  const access = useContext(AuthContext);
  if (!access) throw new Error("AuthProvider is required");
  return access;
}
