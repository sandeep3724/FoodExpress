import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", form);
      setToast("Registration successful!");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.log(err);
      setToast("Registration failed");
    }
  };

  return (
    <div style={styles.wrapper}>

      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subTitle}>
          Join and start your premium food experience
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={styles.input}
            required
          />

          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button}>
            Create Account
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </p>
      </div>

      {/* animation */}
      <style>{`
        @keyframes fadeUp {
          from {opacity:0; transform:translateY(30px)}
          to {opacity:1; transform:translateY(0)}
        }
      `}</style>
    </div>
  );
}

/* 🔥 PREMIUM STYLES */

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "radial-gradient(ellipse at top, #1b0e30 0%, #0a060f 45%, #060408 100%)",
    padding: "20px",
    color: "#f5e6c8",
    fontFamily: "'Montserrat', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "36px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.25)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
    animation: "fadeUp 0.8s ease",
  },

  title: {
    fontSize: "42px",
    fontWeight: "300",
    fontFamily: "'Cormorant Garamond', serif",
    marginBottom: "10px",
    textAlign: "center",
  },

  subTitle: {
    textAlign: "center",
    marginBottom: "28px",
    color: "rgba(245,230,200,0.45)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(201,146,42,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    outline: "none",
    fontSize: "15px",
  },

  button: {
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(201,146,42,0.6)",
    background:
      "linear-gradient(135deg, rgba(201,146,42,0.5), rgba(245,208,128,0.2))",
    color: "#f5d080",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    marginTop: "20px",
    color: "rgba(245,230,200,0.5)",
  },

  link: {
    color: "#f5d080",
    fontWeight: "700",
    textDecoration: "none",
  },

  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "rgba(20,10,30,0.95)",
    border: "1px solid rgba(201,146,42,0.3)",
    color: "#f5d080",
    padding: "12px 18px",
    borderRadius: "12px",
    zIndex: 999,
  },
};