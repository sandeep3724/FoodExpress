import { useEffect, useState } from "react";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext"; // ✅ added

const orderStatuses = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Picked up by Rider",
  "Rider Arrived at Location",
  "Delivered Successfully",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const { theme } = useTheme(); // ✅ FIX
  const s = styles(theme);      // ✅ FIX

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch {
      setToast("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.put(`/orders/${orderId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status } : o)
      );

      setToast("Order status updated");
    } catch {
      setToast("Failed to update order");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered Successfully":
        return { background: "#eefaf1", color: "#22a45d" };
      case "Preparing":
        return { background: "#fff7e8", color: "#d48806" };
      case "Out for Delivery":
        return { background: "#eaf4ff", color: "#1677ff" };
      case "Cancelled":
        return { background: "#fff1f0", color: "#cf1322" };
      default:
        return { background: "#f4f4f5", color: "#555" };
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div style={s.deniedWrap}>
        <div style={s.deniedCard}>
          <div style={s.deniedIcon}>🔒</div>
          <h2 style={s.deniedTitle}>Admin access only</h2>
          <p style={s.deniedText}>No permission</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.page}>
        <h1 style={s.title}>Admin Orders</h1>
        <p style={s.subTitle}>Manage customer orders</p>

        {loading ? (
          <div style={s.loaderWrap}>
            <div style={s.loader}></div>
            <p style={s.loaderText}>Loading...</p>
          </div>
        ) : (
          <div style={s.grid}>
            {orders.map(order => (
              <div key={order._id} style={s.card}>
                <div style={s.topRow}>
                  <h3>Order</h3>
                  <span style={{
                    ...s.statusBadge,
                    ...getStatusStyle(order.status),
                  }}>
                    {order.status}
                  </span>
                </div>

                <p style={s.customer}>
                  {order.userId?.name} • {order.userId?.email}
                </p>

                <div style={s.summary}>
                  <span>Total</span>
                  <span style={s.totalAmount}>₹{order.totalPrice}</span>
                </div>

                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  style={s.select}
                >
                  {orderStatuses.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ✅ FIXED */
const styles = (theme) => ({
  page: {
    padding: "40px 24px",
    minHeight: "100vh",
    background:
      "radial-gradient(ellipse at top, #1b0e30 0%, #0a060f 45%, #060408 100%)",
    color: "#f5e6c8",
    fontFamily: "'Montserrat', sans-serif",
  },

  title: {
    fontSize: "42px",
    fontWeight: "300",
    fontFamily: "'Cormorant Garamond', serif",
    marginBottom: "8px",
  },

  subTitle: {
    color: "rgba(245,230,200,0.45)",
    marginBottom: "24px",
    letterSpacing: 1,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "22px",
  },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    borderRadius: "18px",
    padding: "20px",
    backdropFilter: "blur(14px)",
    transition: "0.3s",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  customer: {
    color: "rgba(245,230,200,0.4)",
    fontSize: "13px",
    marginBottom: "10px",
  },

  summary: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    fontSize: "14px",
  },

  totalAmount: {
    color: "#f5d080",
    fontWeight: "700",
  },

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid rgba(201,146,42,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    outline: "none",
  },

  statusBadge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  toast: {
    position: "fixed",
    top: "90px",
    right: "20px",
    background: "rgba(20,10,30,0.95)",
    border: "1px solid rgba(201,146,42,0.3)",
    color: "#f5d080",
    padding: "12px 18px",
    borderRadius: "12px",
    zIndex: 999,
  },

  loaderWrap: {
    textAlign: "center",
    padding: "60px",
  },

  loader: {
    width: "42px",
    height: "42px",
    border: "4px solid rgba(201,146,42,0.2)",
    borderTop: "4px solid #f5d080",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto",
  },

  loaderText: {
    marginTop: "10px",
    color: "rgba(245,230,200,0.4)",
  },

  deniedWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#060408",
  },

  deniedCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    padding: "30px",
    borderRadius: "20px",
    textAlign: "center",
  },

  deniedIcon: {
    fontSize: "42px",
    marginBottom: "10px",
  },

  deniedTitle: {
    color: "#f5d080",
    fontSize: "24px",
    marginBottom: "6px",
  },

  deniedText: {
    color: "rgba(245,230,200,0.4)",
  },
});