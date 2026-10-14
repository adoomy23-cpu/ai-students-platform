"use client";

import SchoolIcon from "../../components/brand/SchoolIcon";
import { Button, Card, Feedback, Input, PageSurface } from "../../components/platform/PlatformUI";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("بيانات الدخول غير صحيحة.");
      setLoading(false);
      return;
    }

    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || !isAdmin) {
      await supabase.auth.signOut();
      setMessage("هذا الحساب غير مخوّل لدخول لوحة الإدارة.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
  }

  return (
    <PageSurface style={styles.page} dir="rtl">
      <Card as="div" style={styles.card}>
        <div style={styles.icon}><SchoolIcon name="shield" size={32} /></div>

        <p style={styles.small}>منصة الذكاء الاصطناعي</p>

        <h1 style={styles.title}>دخول المعلم</h1>

        <p style={styles.subtitle}>
          سجّل الدخول للوصول إلى لوحة التحكم
        </p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label htmlFor="field-login-1" style={styles.label}>البريد الإلكتروني</label>

          <Input autoComplete="username" id="field-login-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            style={styles.input}
          />

          <label htmlFor="field-login-2" style={styles.label}>كلمة المرور</label>

          <Input autoComplete="current-password" id="field-login-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={styles.input}
          />

          {message && <Feedback tone="error">{message}</Feedback>}

          <Button variant="primary" icon="check"
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>


      </Card>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    background: "var(--gold-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "var(--font-body)",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "var(--surface)",
    padding: "32px 24px",
    borderRadius: "24px",
    boxShadow: "var(--shadow-sm)",
    textAlign: "center",
  },

  icon: {
    fontSize: "48px",
  },

  small: {
    color: "var(--muted)",
    margin: "8px 0",
  },

  title: {
    fontSize: "30px",
    margin: "8px 0",
    color: "var(--ink)",
  },

  subtitle: {
    color: "var(--muted)",
    marginBottom: "25px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    textAlign: "right",
  },

  label: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "var(--ink-soft)",
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid var(--line)",
    fontSize: "16px",
    marginBottom: "8px",
  },

  button: {
    marginTop: "10px",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "var(--brand-gold)",
    color: "var(--ink)",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    background: "var(--surface-soft)",
    color: "var(--danger)",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "14px",
  },

  home: {
    display: "block",
    marginTop: "22px",
    color: "var(--copper-ink)",
    textDecoration: "none",
  },
};
