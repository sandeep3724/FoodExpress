import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const { darkMode, toggleDarkMode } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      ...styles.nav,
      padding: scrolled ? "12px 24px" : "18px 24px",
    }}>
      {/* LOGO */}
      <Link to="/" style={styles.logo}>
        ✦ FoodExpress
      </Link>

      {/* HAMBURGER */}
      <div style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      {/* LINKS */}
      <div style={{
        ...styles.links,
        ...(menuOpen ? styles.mobileOpen : {})
      }}>
        <Link to="/" style={isActive("/") ? styles.activeLink : styles.link}>
          Home
        </Link>

        <Link to="/orders" style={isActive("/orders") ? styles.activeLink : styles.link}>
          Orders
        </Link>

        {user?.role === "admin" && (
          <>
            <Link to="/admin" style={isActive("/admin") ? styles.activeLink : styles.link}>
              Admin
            </Link>
            <Link to="/admin/orders" style={isActive("/admin/orders") ? styles.activeLink : styles.link}>
              Admin Orders
            </Link>
          </>
        )}

        <button onClick={toggleDarkMode} style={styles.themeBtn}>
          {darkMode ? "☀" : "🌙"}
        </button>

        {!token ? (
          <>
            <Link to="/login" style={styles.loginBtn}>Login</Link>
            <Link to="/register" style={styles.registerBtn}>Sign Up</Link>
          </>
        ) : (
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

/* 🔥 NEXT LEVEL STYLES */

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backdropFilter: "blur(20px)",
    background: "rgba(10,6,18,0.85)",
    borderBottom: "1px solid rgba(201,146,42,0.2)",
    transition: "0.3s",
  },

  logo: {
    fontSize: "28px",
    fontFamily: "'Cormorant Garamond', serif",
    color: "#f5d080",
    textDecoration: "none",
  },

  hamburger: {
    display: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "#f5d080",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  mobileOpen: {
    position: "absolute",
    top: "70px",
    right: "20px",
    flexDirection: "column",
    background: "rgba(10,6,18,0.95)",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid rgba(201,146,42,0.2)",
  },

  link: {
    color: "rgba(245,230,200,0.7)",
    textDecoration: "none",
    fontWeight: "600",
    transition: "0.3s",
  },

  activeLink: {
    color: "#f5d080",
    borderBottom: "2px solid #f5d080",
    paddingBottom: "2px",
  },

  themeBtn: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(201,146,42,0.4)",
    background: "rgba(201,146,42,0.1)",
    color: "#f5d080",
    cursor: "pointer",
  },

  loginBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    color: "#f5e6c8",
    border: "1px solid rgba(201,146,42,0.3)",
    textDecoration: "none",
  },

  registerBtn: {
    padding: "10px 18px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, rgba(201,146,42,0.6), rgba(245,208,128,0.3))",
    color: "#fff",
    textDecoration: "none",
    boxShadow: "0 0 20px rgba(201,146,42,0.3)",
  },

  logoutBtn: {
    padding: "10px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,80,80,0.4)",
    background: "rgba(255,80,80,0.1)",
    color: "#ff6b6b",
    cursor: "pointer",
  },
};