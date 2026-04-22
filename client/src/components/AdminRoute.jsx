import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  let token = null;
  let user = null;

  try {
    token = localStorage.getItem("token");
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (err) {
    console.error("LocalStorage parse error:", err);
    return <Navigate to="/login" replace />;
  }

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized
  return children;
}