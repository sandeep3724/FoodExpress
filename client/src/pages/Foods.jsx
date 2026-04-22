import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

const categories = ["All", "Biryani", "Burger", "Pizza", "Chicken", "Rice", "Dessert"];

export default function Foods() {
  const { id } = useParams();
  const { theme } = useTheme();

  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(`cart_${id}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await API.get(`/foods/${id}`);
        setFoods(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [id]);

  useEffect(() => {
    localStorage.setItem(`cart_${id}`, JSON.stringify(cart));
  }, [cart, id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesSearch = `${food.name} ${food.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        `${food.name} ${food.description || ""}`
          .toLowerCase()
          .includes(activeCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [foods, search, activeCategory]);

  const showToast = (message) => {
    setToast(message);
  };

  const addToCart = (food) => {
    const existing = cart.find((item) => item._id === food._id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }

    showToast(`${food.name} added to cart`);
  };

  const increaseQuantity = (foodId) => {
    setCart(
      cart.map((item) =>
        item._id === foodId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (foodId) => {
    const item = cart.find((cartItem) => cartItem._id === foodId);

    setCart(
      cart
        .map((cartItem) =>
          cartItem._id === foodId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );

    if (item && item.quantity === 1) {
      showToast(`${item.name} removed from cart`);
    }
  };

  const removeItem = (foodId) => {
    const item = cart.find((cartItem) => cartItem._id === foodId);
    setCart(cart.filter((cartItem) => cartItem._id !== foodId));
    if (item) showToast(`${item.name} removed from cart`);
  };

  const clearCart = () => {
    setCart([]);
    showToast("Cart cleared");
  };

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 40 : 0;
  const taxes = cart.length > 0 ? Math.round(subtotal * 0.05) : 0;
  const totalAmount = subtotal + deliveryFee + taxes;

  const paymentQrText = `upi://pay?pa=7989291892@ybl&pn=Sandeep&am=${totalAmount}&cu=INR`;

  const openPaymentModal = () => {
    if (cart.length === 0) {
      showToast("Your cart is empty");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please login first");
      return;
    }

    setShowPaymentModal(true);
  };

  const handleMockPaymentSuccess = async () => {
    try {
      setPaymentLoading(true);

      const token = localStorage.getItem("token");

      const orderData = {
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: totalAmount,
      };

      const res = await API.post("/orders", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const createdOrder = res.data.order || res.data;

      setLastOrder({
        orderId: createdOrder._id || `FD-${Date.now()}`,
        items: cart,
        itemCount,
        subtotal,
        deliveryFee,
        taxes,
        totalAmount,
        paidAt: new Date().toLocaleString(),
        paymentMethod: "QR Demo Payment",
        status: createdOrder.status || "Pending",
      });

      setCart([]);
      localStorage.removeItem(`cart_${id}`);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      showToast("Payment successful and order placed");
    } catch (err) {
      console.log(err);
      showToast("Order failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <>
      {toast && <div style={styles.toast}>{toast}</div>}

      {showPaymentModal && (
        <div
          style={{
            ...styles.modalOverlay,
            background: theme.colors.overlay,
          }}
        >
          <div
            style={{
              ...styles.modal,
              background: theme.colors.card,
            }}
          >
            <button
              style={{
                ...styles.closeBtn,
                color: theme.colors.subText,
              }}
              onClick={() => setShowPaymentModal(false)}
            >
              ×
            </button>

            <div style={styles.modalBody}>
              <h2 style={{ ...styles.modalTitle, color: theme.colors.text }}>
                Scan & Pay
              </h2>
              <p style={{ ...styles.modalSubTitle, color: theme.colors.subText }}>
                Demo QR payment for project presentation
              </p>

              <div
                style={{
                  ...styles.upiBadge,
                  background: theme.colors.cardSoft,
                  color: theme.colors.text,
                }}
              >
                UPI ID: 7989291892@ybl
              </div>

              <div
                style={{
                  ...styles.qrBox,
                  background: theme.colors.cardSoft,
                }}
              >
                <QRCodeCanvas value={paymentQrText} size={150} />
              </div>

              <p style={{ ...styles.scanNote, color: theme.colors.subText }}>
                Scan using PhonePe / GPay / Paytm
              </p>

              <div
                style={{
                  ...styles.paymentDetails,
                  background: theme.colors.cardSoft,
                }}
              >
                <div style={{ ...styles.paymentRow, color: theme.colors.subText }}>
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div style={{ ...styles.paymentRow, color: theme.colors.subText }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ ...styles.paymentRow, color: theme.colors.subText }}>
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div style={{ ...styles.paymentRow, color: theme.colors.subText }}>
                  <span>Taxes</span>
                  <span>₹{taxes}</span>
                </div>
                <div style={{ ...styles.paymentTotal, color: theme.colors.text }}>
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                ...styles.modalButtons,
                background: theme.colors.card,
              }}
            >
              <button
                style={{
                  ...styles.cancelBtn,
                  background: theme.colors.cardSoft,
                  color: theme.colors.text,
                }}
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
              >
                Cancel
              </button>

              <button
                style={styles.payBtn}
                onClick={handleMockPaymentSuccess}
                disabled={paymentLoading}
              >
                {paymentLoading ? "Processing..." : "I Have Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && lastOrder && (
        <div
          style={{
            ...styles.modalOverlay,
            background: theme.colors.overlay,
          }}
        >
          <div
            style={{
              ...styles.successModal,
              background: theme.colors.card,
            }}
          >
            <div style={styles.successIcon}>✅</div>
            <h2 style={{ ...styles.successTitle, color: theme.colors.text }}>
              Payment Successful
            </h2>
            <p style={{ ...styles.successText, color: theme.colors.subText }}>
              Your order has been placed successfully.
            </p>

            <div
              style={{
                ...styles.successSummary,
                background: theme.colors.cardSoft,
              }}
            >
              <div style={{ ...styles.successRow, color: theme.colors.text }}>
                <span>Order ID</span>
                <span>{lastOrder.orderId}</span>
              </div>
              <div style={{ ...styles.successRow, color: theme.colors.text }}>
                <span>Amount Paid</span>
                <span>₹{lastOrder.totalAmount}</span>
              </div>
              <div style={{ ...styles.successRow, color: theme.colors.text }}>
                <span>Status</span>
                <span>{lastOrder.status}</span>
              </div>
            </div>

            <div
              style={{
                ...styles.modalButtons,
                background: theme.colors.card,
              }}
            >
              <button
                style={{
                  ...styles.cancelBtn,
                  background: theme.colors.cardSoft,
                  color: theme.colors.text,
                }}
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
              <button
                style={styles.payBtn}
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowInvoiceModal(true);
                }}
              >
                View Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && lastOrder && (
        <div
          style={{
            ...styles.modalOverlay,
            background: theme.colors.overlay,
          }}
        >
          <div
            style={{
              ...styles.invoiceModal,
              background: theme.colors.card,
            }}
          >
            <button
              style={{
                ...styles.closeBtn,
                color: theme.colors.subText,
              }}
              onClick={() => setShowInvoiceModal(false)}
            >
              ×
            </button>

            <div id="invoice-section" style={styles.invoiceContent}>
              <div
                style={{
                  ...styles.invoiceHeader,
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                <div>
                  <h2 style={styles.invoiceTitle}>FoodExpress</h2>
                  <p style={{ ...styles.invoiceSub, color: theme.colors.subText }}>
                    Payment Invoice
                  </p>
                </div>
                <div style={styles.invoiceStatus}>Paid</div>
              </div>

              <div style={styles.invoiceMeta}>
                <div>
                  <p style={{ ...styles.metaLabel, color: theme.colors.muted }}>
                    Order ID
                  </p>
                  <p style={{ ...styles.metaValue, color: theme.colors.text }}>
                    {lastOrder.orderId}
                  </p>
                </div>
                <div>
                  <p style={{ ...styles.metaLabel, color: theme.colors.muted }}>
                    Date
                  </p>
                  <p style={{ ...styles.metaValue, color: theme.colors.text }}>
                    {lastOrder.paidAt}
                  </p>
                </div>
                <div>
                  <p style={{ ...styles.metaLabel, color: theme.colors.muted }}>
                    Method
                  </p>
                  <p style={{ ...styles.metaValue, color: theme.colors.text }}>
                    {lastOrder.paymentMethod}
                  </p>
                </div>
              </div>

              <div
                style={{
                  ...styles.invoiceItems,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div
                  style={{
                    ...styles.invoiceTableHeader,
                    background: theme.colors.cardSoft,
                    color: theme.colors.text,
                  }}
                >
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Amount</span>
                </div>

                {lastOrder.items.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      ...styles.invoiceItemRow,
                      borderTop: `1px solid ${theme.colors.border}`,
                      color: theme.colors.text,
                    }}
                  >
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={styles.invoiceTotals}>
                <div style={{ ...styles.invoiceTotalRow, color: theme.colors.subText }}>
                  <span>Subtotal</span>
                  <span>₹{lastOrder.subtotal}</span>
                </div>
                <div style={{ ...styles.invoiceTotalRow, color: theme.colors.subText }}>
                  <span>Delivery Fee</span>
                  <span>₹{lastOrder.deliveryFee}</span>
                </div>
                <div style={{ ...styles.invoiceTotalRow, color: theme.colors.subText }}>
                  <span>Taxes</span>
                  <span>₹{lastOrder.taxes}</span>
                </div>
                <div
                  style={{
                    ...styles.invoiceGrandTotal,
                    borderTop: `2px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                  }}
                >
                  <span>Total Paid</span>
                  <span>₹{lastOrder.totalAmount}</span>
                </div>
              </div>

              <p style={{ ...styles.invoiceFooter, color: theme.colors.subText }}>
                Thank you for ordering with FoodExpress.
              </p>
            </div>

            <div
              style={{
                ...styles.modalButtons,
                background: theme.colors.card,
              }}
            >
              <button
                style={{
                  ...styles.cancelBtn,
                  background: theme.colors.cardSoft,
                  color: theme.colors.text,
                }}
                onClick={() => setShowInvoiceModal(false)}
              >
                Close
              </button>
              <button style={styles.payBtn} onClick={handlePrintInvoice}>
                Download / Print
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="foods-layout" style={styles.page}>
        <div style={styles.left}>
          <div style={styles.header}>
            <h1 style={{ ...styles.heading, color: theme.colors.text }}>
              Explore Food Items
            </h1>
            <p style={{ ...styles.subHeading, color: theme.colors.subText }}>
              Choose your favorite dishes and add them to cart
            </p>

            <input
              type="text"
              placeholder="Search food items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...styles.searchInput,
                background: theme.colors.card,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            />

            <div style={styles.chips}>
              {categories.map((category) => (
                <button
                  key={category}
                  style={{
                    ...styles.chip,
                    background:
                      activeCategory === category
                        ? theme.colors.primary
                        : theme.colors.primarySoft,
                    color: activeCategory === category ? "#fff" : theme.colors.primary,
                    border: `1px solid ${theme.colors.primary}`,
                  }}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={styles.loaderWrap}>
              <div style={styles.loader}></div>
              <p style={{ ...styles.loaderText, color: theme.colors.subText }}>
                Loading food items...
              </p>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div
              style={{
                ...styles.emptyBox,
                background: theme.colors.card,
              }}
            >
              <div style={styles.emptyEmoji}>🍔</div>
              <h3 style={{ ...styles.emptyTitle, color: theme.colors.text }}>
                No food items found
              </h3>
              <p style={{ ...styles.emptyText, color: theme.colors.subText }}>
                Try another search or category.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredFoods.map((food) => (
                <div
                  key={food._id}
                  style={{
                    ...styles.card,
                    background: theme.colors.card,
                  }}
                >
                  <img
                    src={
                      food.image ||
                      "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000"
                    }
                    alt={food.name}
                    style={styles.image}
                  />

                  <div style={styles.cardBody}>
                    <h3 style={{ ...styles.foodName, color: theme.colors.text }}>
                      {food.name}
                    </h3>
                    <p style={{ ...styles.desc, color: theme.colors.subText }}>
                      {food.description || "Tasty and freshly prepared food."}
                    </p>

                    <div style={styles.bottomRow}>
                      <span style={styles.price}>₹{food.price}</span>
                      <button style={styles.addBtn} onClick={() => addToCart(food)}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            ...styles.cartBox,
            background: theme.colors.card,
          }}
        >
          <div style={styles.cartTop}>
            <h2 style={{ ...styles.cartTitle, color: theme.colors.text }}>
              Your Cart
            </h2>
            {cart.length > 0 && (
              <button style={styles.clearBtn} onClick={clearCart}>
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div style={styles.cartEmptyWrap}>
              <div style={styles.cartEmptyEmoji}>🛒</div>
              <p style={{ ...styles.empty, color: theme.colors.text }}>
                Your cart is empty
              </p>
              <p style={{ ...styles.cartEmptySub, color: theme.colors.subText }}>
                Add some delicious items to continue.
              </p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={item._id}
                  style={{
                    ...styles.cartItem,
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={styles.cartInfo}>
                    <p style={{ ...styles.cartName, color: theme.colors.text }}>
                      {item.name}
                    </p>
                    <p style={{ ...styles.cartPrice, color: theme.colors.subText }}>
                      ₹{item.price} each
                    </p>
                  </div>

                  <div style={styles.cartActions}>
                    <div
                      style={{
                        ...styles.qtyBox,
                        background: theme.colors.cardSoft,
                      }}
                    >
                      <button
                        style={styles.qtyBtn}
                        onClick={() => decreaseQuantity(item._id)}
                      >
                        -
                      </button>
                      <span style={{ ...styles.qtyText, color: theme.colors.text }}>
                        {item.quantity}
                      </span>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => increaseQuantity(item._id)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      style={styles.removeBtn}
                      onClick={() => removeItem(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div
                style={{
                  ...styles.summaryBox,
                  background: theme.colors.cardSoft,
                }}
              >
                <div style={{ ...styles.summaryRow, color: theme.colors.subText }}>
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div style={{ ...styles.summaryRow, color: theme.colors.subText }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ ...styles.summaryRow, color: theme.colors.subText }}>
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div style={{ ...styles.summaryRow, color: theme.colors.subText }}>
                  <span>Taxes</span>
                  <span>₹{taxes}</span>
                </div>
                <div
                  style={{
                    ...styles.totalRow,
                    borderTop: `1px solid ${theme.colors.border}`,
                    color: theme.colors.text,
                  }}
                >
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <button style={styles.orderBtn} onClick={openPaymentModal}>
                Pay with QR
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "28px",
    padding: "30px 20px",
    alignItems: "start",
  },
  left: {
    minWidth: 0,
  },
  header: {
    marginBottom: "22px",
  },
  heading: {
    fontSize: "34px",
    fontWeight: "800",
    marginBottom: "6px",
  },
  subHeading: {
    marginBottom: "18px",
  },
  searchInput: {
    width: "100%",
    maxWidth: "420px",
    padding: "14px 16px",
    borderRadius: "12px",
    outline: "none",
    fontSize: "15px",
    marginBottom: "16px",
  },
  chips: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  chip: {
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: "700",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "22px",
  },
  card: {
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  image: {
    width: "100%",
    height: "190px",
    objectFit: "cover",
  },
  cardBody: {
    padding: "16px",
  },
  foodName: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  desc: {
    fontSize: "14px",
    lineHeight: "1.5",
    marginBottom: "14px",
    minHeight: "42px",
  },
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  price: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#ff5a1f",
  },
  addBtn: {
    background: "#ff5a1f",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    border: "none",
  },
  cartBox: {
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    position: "sticky",
    top: "95px",
  },
  cartTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  cartTitle: {
    fontSize: "24px",
    fontWeight: "800",
  },
  clearBtn: {
    background: "#fff0eb",
    color: "#ff5a1f",
    border: "none",
    padding: "8px 12px",
    borderRadius: "10px",
    fontWeight: "700",
  },
  empty: {
    fontWeight: "700",
  },
  cartEmptyWrap: {
    textAlign: "center",
    padding: "20px 0",
  },
  cartEmptyEmoji: {
    fontSize: "40px",
    marginBottom: "10px",
  },
  cartEmptySub: {
    marginTop: "6px",
  },
  cartItem: {
    padding: "14px 0",
  },
  cartInfo: {
    marginBottom: "12px",
  },
  cartName: {
    fontWeight: "700",
    marginBottom: "4px",
  },
  cartPrice: {
    fontSize: "14px",
  },
  cartActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  qtyBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 10px",
    borderRadius: "12px",
  },
  qtyBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    border: "none",
    background: "#ff5a1f",
    color: "#fff",
    fontWeight: "700",
    fontSize: "16px",
  },
  qtyText: {
    minWidth: "18px",
    textAlign: "center",
    fontWeight: "700",
  },
  removeBtn: {
    background: "#fff0eb",
    color: "#ff5a1f",
    border: "none",
    padding: "9px 12px",
    borderRadius: "10px",
    fontWeight: "700",
  },
  summaryBox: {
    borderRadius: "14px",
    padding: "14px",
    marginTop: "18px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    paddingTop: "12px",
    fontSize: "20px",
    fontWeight: "800",
  },
  orderBtn: {
    width: "100%",
    marginTop: "18px",
    background: "#22a45d",
    color: "#fff",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "16px",
    border: "none",
  },
  emptyBox: {
    padding: "36px 20px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  },
  emptyEmoji: {
    fontSize: "44px",
    marginBottom: "12px",
  },
  emptyTitle: {
    fontSize: "22px",
    marginBottom: "8px",
  },
  emptyText: {},
  loaderWrap: {
    textAlign: "center",
    padding: "40px 20px",
  },
  loader: {
    width: "40px",
    height: "40px",
    margin: "0 auto 14px",
    border: "4px solid #ffe0d3",
    borderTop: "4px solid #ff5a1f",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loaderText: {},
  toast: {
    position: "fixed",
    top: "92px",
    right: "20px",
    background: "#222",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: "12px",
    zIndex: 2000,
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3000,
    padding: "16px",
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    borderRadius: "20px",
    padding: "18px",
    position: "relative",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalBody: {
    overflowY: "auto",
    paddingRight: "4px",
  },
  successModal: {
    width: "100%",
    maxWidth: "430px",
    borderRadius: "22px",
    padding: "30px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
  },
  invoiceModal: {
    width: "100%",
    maxWidth: "700px",
    borderRadius: "22px",
    padding: "28px",
    position: "relative",
    boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: "10px",
    right: "12px",
    background: "transparent",
    border: "none",
    fontSize: "28px",
    lineHeight: 1,
    zIndex: 2,
    cursor: "pointer",
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: "6px",
  },
  modalSubTitle: {
    textAlign: "center",
    marginBottom: "10px",
    fontSize: "14px",
  },
  upiBadge: {
    textAlign: "center",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: "700",
    marginBottom: "14px",
  },
  qrBox: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
    padding: "10px",
    borderRadius: "14px",
  },
  scanNote: {
    textAlign: "center",
    marginBottom: "14px",
    fontSize: "14px",
  },
  paymentDetails: {
    borderRadius: "14px",
    padding: "12px",
    marginBottom: "8px",
  },
  paymentRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
  },
  paymentTotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
    paddingTop: "12px",
    fontSize: "20px",
    fontWeight: "800",
  },
  successIcon: {
    fontSize: "54px",
    marginBottom: "12px",
  },
  successTitle: {
    fontSize: "30px",
    fontWeight: "800",
    marginBottom: "8px",
  },
  successText: {
    marginBottom: "20px",
  },
  successSummary: {
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "20px",
    textAlign: "left",
  },
  successRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    gap: "12px",
  },
  invoiceContent: {
    marginTop: "8px",
  },
  invoiceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    paddingBottom: "18px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  invoiceTitle: {
    fontSize: "30px",
    fontWeight: "800",
    color: "#ff5a1f",
  },
  invoiceSub: {
    marginTop: "4px",
  },
  invoiceStatus: {
    background: "#eefaf1",
    color: "#22a45d",
    padding: "10px 16px",
    borderRadius: "12px",
    fontWeight: "800",
  },
  invoiceMeta: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },
  metaLabel: {
    fontSize: "13px",
    marginBottom: "6px",
  },
  metaValue: {
    fontWeight: "700",
  },
  invoiceItems: {
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "22px",
  },
  invoiceTableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "12px",
    padding: "14px 16px",
    fontWeight: "800",
  },
  invoiceItemRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: "12px",
    padding: "14px 16px",
  },
  invoiceTotals: {
    maxWidth: "320px",
    marginLeft: "auto",
  },
  invoiceTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
  },
  invoiceGrandTotal: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "12px",
    marginTop: "10px",
    fontSize: "22px",
    fontWeight: "800",
  },
  invoiceFooter: {
    marginTop: "24px",
    textAlign: "center",
  },
  modalButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
    position: "sticky",
    bottom: 0,
    paddingTop: "10px",
    zIndex: 1,
  },
  cancelBtn: {
    flex: 1,
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    fontWeight: "700",
    cursor: "pointer",
  },
  payBtn: {
    flex: 1,
    padding: "13px",
    borderRadius: "12px",
    border: "none",
    background: "#22a45d",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
};