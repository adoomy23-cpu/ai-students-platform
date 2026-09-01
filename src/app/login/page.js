"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
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

    window.location.href = "/admin";
  }

  return (
    <main style={styles.page} dir="rtl">
      <div style={styles.card}>
        <div style={styles.icon}>🔐</div>

        <p style={styles.small}>منصة الذكاء الاصطناعي</p>

        <h1 style={styles.title}>دخول المعلم</h1>

        <p style={styles.subtitle}>
          سجّل الدخول للوصول إلى لوحة التحكم
        </p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>البريد الإلكتروني</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            style={styles.input}
          />

          <label style={styles.label}>كلمة المرور</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={styles.input}
          />

          {message && <p style={styles.message}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <a href="/" style={styles.home}>
          ← العودة إلى منصة الطلاب
        </a>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#eef8ff 0%,#f7f4ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    padding: "32px 24px",
    borderRadius: "24px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  icon: {
    fontSize: "48px",
  },

  small: {
    color: "#6b7280",
    margin: "8px 0",
  },

  title: {
    fontSize: "30px",
    margin: "8px 0",
    color: "#20233a",
  },

  subtitle: {
    color: "#77798b",
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
    color: "#333",
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #d9d9e3",
    fontSize: "16px",
    marginBottom: "8px",
  },

  button: {
    marginTop: "10px",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "#5b4ae8",
    color: "#fff",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  message: {
    background: "#fff3f3",
    color: "#b42318",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "14px",
  },

  home: {
    display: "block",
    marginTop: "22px",
    color: "#5b4ae8",
    textDecoration: "none",
  },
};