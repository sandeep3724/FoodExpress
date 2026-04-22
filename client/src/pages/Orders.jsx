import { useEffect, useState } from "react";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

const orderSteps = [
  "Pending",
  "Preparing",
  "Out for Delivery",
  "Picked up by Rider",
  "Rider Arrived at Location",
  "Delivered Successfully",
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await API.get("/orders/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setOrders(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStepIndex = (status) => {
    if (status === "Cancelled") return -1;
    return orderSteps.indexOf(status);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Orders</h1>
        <p style={styles.subTitle}>
          Track your food journey in real-time
        </p>
      </div>

      {loading ? (
        <div style={styles.loader}></div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyBox}>
          <h3>No orders yet</h3>
          <p>Place your first order 🍔</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map((order) => {
            const stepIndex = getStepIndex(order.status);

            return (
              <div key={order._id} style={styles.card}>
                <div style={styles.top}>
                  <div>
                    <h3>Order</h3>
                    <p style={styles.meta}>
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span style={styles.status}>{order.status}</span>
                </div>

                <p style={styles.total}>₹{order.totalPrice}</p>

                {order.status !== "Cancelled" && (
                  <div style={styles.steps}>
                    {orderSteps.map((step, i) => (
                      <div key={i} style={styles.step}>
                        <div
                          style={{
                            ...styles.circle,
                            background:
                              i <= stepIndex ? "#c9922a" : "#333",
                          }}
                        >
                          {i <= stepIndex ? "✓" : i + 1}
                        </div>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.items}>
                  {order.items.map((item, i) => (
                    <div key={i} style={styles.item}>
                      <span>{item.name}</span>
                      <span>
                        {item.quantity} x ₹{item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* 🔥 PREMIUM STYLES */

const styles = {
  page: {
    padding: "40px 24px",
    minHeight: "100vh",
    background:
      "radial-gradient(ellipse at top, #1b0e30 0%, #0a060f 45%, #060408 100%)",
    color: "#f5e6c8",
    fontFamily: "'Montserrat', sans-serif",
  },

  header: {
    marginBottom: "30px",
  },

  title: {
    fontSize: "42px",
    fontWeight: "300",
    fontFamily: "'Cormorant Garamond', serif",
  },

  subTitle: {
    color: "rgba(245,230,200,0.45)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },

  card: {
    padding: "22px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    backdropFilter: "blur(16px)",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
  },

  meta: {
    fontSize: "13px",
    color: "rgba(245,230,200,0.4)",
  },

  status: {
    background: "rgba(201,146,42,0.2)",
    padding: "6px 12px",
    borderRadius: "999px",
    color: "#f5d080",
  },

  total: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f5d080",
    margin: "12px 0",
  },

  steps: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  step: {
    textAlign: "center",
    fontSize: "10px",
  },

  circle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    margin: "0 auto 6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  items: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "10px",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },

  emptyBox: {
    textAlign: "center",
    padding: "40px",
  },

  loader: {
    width: "40px",
    height: "40px",
    margin: "60px auto",
    border: "4px solid rgba(201,146,42,0.2)",
    borderTop: "4px solid #f5d080",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};