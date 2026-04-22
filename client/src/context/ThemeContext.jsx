import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : true; // default DARK (important)
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));

    // apply background globally
    document.body.style.background = darkMode
      ? "radial-gradient(ellipse at top, #1b0e30 0%, #0a060f 45%, #060408 100%)"
      : "#f8f9fb";

    document.body.style.color = darkMode ? "#f5e6c8" : "#222";
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const theme = {
    darkMode,

    colors: darkMode
      ? {
          /* 🌙 PREMIUM DARK */
          background: "#060408",
          card: "rgba(255,255,255,0.03)",
          cardSoft: "rgba(255,255,255,0.06)",
          text: "#f5e6c8",
          subText: "rgba(245,230,200,0.5)",
          border: "rgba(201,146,42,0.2)",

          primary: "#c9922a",
          primarySoft: "rgba(201,146,42,0.15)",

          success: "#22a45d",
          danger: "#ff6b6b",
          muted: "rgba(245,230,200,0.4)",

          overlay: "rgba(10,6,18,0.85)",
        }
      : {
          /* ☀ LIGHT (optional fallback) */
          background: "#f8f9fb",
          card: "#ffffff",
          cardSoft: "#f1f5f9",
          text: "#222",
          subText: "#666",
          border: "#e5e7eb",

          primary: "#c9922a",
          primarySoft: "#f7ecd8",

          success: "#22a45d",
          danger: "#ff6b6b",
          muted: "#888",

          overlay: "rgba(0,0,0,0.5)",
        },
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}