import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import API from "../services/api";

const chartColors = ["#ff5a1f", "#1677ff", "#22a45d", "#d48806", "#cf1322"];

export default function Admin() {
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");

  const [editingRestaurantId, setEditingRestaurantId] = useState(null);
  const [editingFoodId, setEditingFoodId] = useState(null);

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    location: "",
    image: null,
    rating: "",
  });

  const [foodForm, setFoodForm] = useState({
    restaurantId: "",
    name: "",
    price: "",
    image: null,
    description: "",
  });

  const [toast, setToast] = useState("");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetchRestaurants();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchFoods(selectedRestaurantId);
    } else {
      setFoods([]);
    }
  }, [selectedRestaurantId]);

  const analytics = useMemo(() => {
    return {
      totalRestaurants: restaurants.length,
      totalFoodsShown: foods.length,
      totalOrders: orders.length,
      deliveredOrders: orders.filter((order) => order.status === "Delivered").length,
      pendingOrders: orders.filter((order) => order.status === "Pending").length,
    };
  }, [restaurants, foods, orders]);

  const orderStatusData = useMemo(() => {
    const statuses = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

    return statuses.map((status) => ({
      name: status,
      value: orders.filter((order) => order.status === status).length,
    }));
  }, [orders]);

  const orderBarData = useMemo(() => {
    return orderStatusData.map((item) => ({
      status: item.name,
      orders: item.value,
    }));
  }, [orderStatusData]);

  const fetchRestaurants = async () => {
    try {
      const res = await API.get("/restaurants");
      setRestaurants(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchFoods = async (restaurantId) => {
    try {
      const res = await API.get(`/foods/${restaurantId}`);
      setFoods(res.data);
    } catch (err) {
      console.log(err);
      setToast("Failed to load foods");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const resetRestaurantForm = () => {
    setRestaurantForm({
      name: "",
      location: "",
      image: null,
      rating: "",
    });
    setEditingRestaurantId(null);
  };

  const resetFoodForm = () => {
    setFoodForm({
      restaurantId: "",
      name: "",
      price: "",
      image: null,
      description: "",
    });
    setEditingFoodId(null);
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", restaurantForm.name);
      formData.append("location", restaurantForm.location);
      formData.append("rating", restaurantForm.rating);

      if (restaurantForm.image) {
        formData.append("image", restaurantForm.image);
      }

      if (editingRestaurantId) {
        await API.put(`/restaurants/${editingRestaurantId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setToast("Restaurant updated successfully");
      } else {
        await API.post("/restaurants", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setToast("Restaurant added successfully");
      }

      resetRestaurantForm();
      fetchRestaurants();
    } catch (err) {
      console.log(err);
      setToast("Failed to save restaurant");
    }
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("restaurantId", foodForm.restaurantId);
      formData.append("name", foodForm.name);
      formData.append("price", foodForm.price);
      formData.append("description", foodForm.description);

      if (foodForm.image) {
        formData.append("image", foodForm.image);
      }

      if (editingFoodId) {
        await API.put(`/foods/${editingFoodId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setToast("Food updated successfully");
      } else {
        await API.post("/foods", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setToast("Food item added successfully");
      }

      const chosenRestaurant = foodForm.restaurantId || selectedRestaurantId;

      resetFoodForm();

      if (chosenRestaurant) {
        setSelectedRestaurantId(chosenRestaurant);
        fetchFoods(chosenRestaurant);
      }
    } catch (err) {
      console.log(err);
      setToast("Failed to save food item");
    }
  };

  const startEditRestaurant = (restaurant) => {
    setEditingRestaurantId(restaurant._id);
    setRestaurantForm({
      name: restaurant.name || "",
      location: restaurant.location || "",
      image: null,
      rating: restaurant.rating || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditFood = (food) => {
    setEditingFoodId(food._id);
    setFoodForm({
      restaurantId: food.restaurantId || selectedRestaurantId,
      name: food.name || "",
      price: food.price || "",
      image: null,
      description: food.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRestaurant = async (id) => {
    try {
      await API.delete(`/restaurants/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (selectedRestaurantId === id) {
        setSelectedRestaurantId("");
        setFoods([]);
      }

      fetchRestaurants();
      setToast("Restaurant deleted");
    } catch (err) {
      console.log(err);
      setToast("Delete failed");
    }
  };

  const deleteFood = async (foodId) => {
    try {
      await API.delete(`/foods/${foodId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (selectedRestaurantId) {
        fetchFoods(selectedRestaurantId);
      }

      setToast("Food deleted successfully");
    } catch (err) {
      console.log(err);
      setToast("Failed to delete food");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div style={styles.deniedWrap}>
        <div style={styles.deniedCard}>
          <div style={styles.deniedIcon}>🔒</div>
          <h2 style={styles.deniedTitle}>Admin access only</h2>
          <p style={styles.deniedText}>
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.page}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subTitle}>
              Manage restaurants, foods, and business overview from one place
            </p>
          </div>

          <Link to="/admin/orders" style={styles.ordersBtn}>
            View Orders
          </Link>
        </div>

        <div style={styles.analyticsGrid}>
          <div style={styles.analyticsCard}>
            <p style={styles.analyticsLabel}>Total Restaurants</p>
            <h3 style={styles.analyticsValue}>{analytics.totalRestaurants}</h3>
          </div>

          <div style={styles.analyticsCard}>
            <p style={styles.analyticsLabel}>Foods Shown</p>
            <h3 style={styles.analyticsValue}>{analytics.totalFoodsShown}</h3>
          </div>

          <div style={styles.analyticsCard}>
            <p style={styles.analyticsLabel}>Total Orders</p>
            <h3 style={styles.analyticsValue}>{analytics.totalOrders}</h3>
          </div>

          <div style={styles.analyticsCard}>
            <p style={styles.analyticsLabel}>Delivered Orders</p>
            <h3 style={styles.analyticsValue}>{analytics.deliveredOrders}</h3>
          </div>

          <div style={styles.analyticsCard}>
            <p style={styles.analyticsLabel}>Pending Orders</p>
            <h3 style={styles.analyticsValue}>{analytics.pendingOrders}</h3>
          </div>
        </div>

        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Order Status Overview</h2>
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={orderBarData}>
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#ff5a1f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.chartCard}>
            <h2 style={styles.chartTitle}>Orders Distribution</h2>
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.formHeader}>
              <h2 style={styles.cardTitle}>
                {editingRestaurantId ? "Edit Restaurant" : "Add Restaurant"}
              </h2>

              {editingRestaurantId && (
                <button style={styles.cancelEditBtn} onClick={resetRestaurantForm}>
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleRestaurantSubmit} style={styles.form}>
              <input
                type="text"
                placeholder="Restaurant name"
                value={restaurantForm.name}
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, name: e.target.value })
                }
                style={styles.input}
                required
              />

              <input
                type="text"
                placeholder="Location"
                value={restaurantForm.location}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    location: e.target.value,
                  })
                }
                style={styles.input}
                required
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    image: e.target.files[0] || null,
                  })
                }
                style={styles.input}
              />

              <input
                type="number"
                step="0.1"
                placeholder="Rating"
                value={restaurantForm.rating}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    rating: e.target.value,
                  })
                }
                style={styles.input}
              />

              <button type="submit" style={styles.primaryBtn}>
                {editingRestaurantId ? "Update Restaurant" : "Add Restaurant"}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <div style={styles.formHeader}>
              <h2 style={styles.cardTitle}>
                {editingFoodId ? "Edit Food Item" : "Add Food Item"}
              </h2>

              {editingFoodId && (
                <button style={styles.cancelEditBtn} onClick={resetFoodForm}>
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleFoodSubmit} style={styles.form}>
              <select
                value={foodForm.restaurantId}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, restaurantId: e.target.value })
                }
                style={styles.input}
                required
              >
                <option value="">Select Restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Food name"
                value={foodForm.name}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, name: e.target.value })
                }
                style={styles.input}
                required
              />

              <input
                type="number"
                placeholder="Price"
                value={foodForm.price}
                onChange={(e) =>
                  setFoodForm({ ...foodForm, price: e.target.value })
                }
                style={styles.input}
                required
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFoodForm({
                    ...foodForm,
                    image: e.target.files[0] || null,
                  })
                }
                style={styles.input}
              />

              <textarea
                placeholder="Description"
                value={foodForm.description}
                onChange={(e) =>
                  setFoodForm({
                    ...foodForm,
                    description: e.target.value,
                  })
                }
                style={styles.textarea}
                rows={4}
              />

              <button type="submit" style={styles.primaryBtn}>
                {editingFoodId ? "Update Food" : "Add Food Item"}
              </button>
            </form>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.cardTitle}>Restaurants</h2>
            <span style={styles.countBadge}>{restaurants.length}</span>
          </div>

          {restaurants.length === 0 ? (
            <div style={styles.emptyBox}>No restaurants available</div>
          ) : (
            <div style={styles.restaurantGrid}>
              {restaurants.map((restaurant) => (
                <div key={restaurant._id} style={styles.restaurantCard}>
                  <img
                    src={
                      restaurant.image ||
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000"
                    }
                    alt={restaurant.name}
                    style={styles.restaurantImage}
                  />
                  <div style={styles.restaurantBody}>
                    <div style={styles.restaurantTop}>
                      <h3 style={styles.restaurantName}>{restaurant.name}</h3>
                      <span style={styles.rating}>
                        ⭐ {restaurant.rating || 4.3}
                      </span>
                    </div>

                    <p style={styles.restaurantLocation}>
                      {restaurant.location}
                    </p>

                    <div style={styles.restaurantActions}>
                      <button
                        onClick={() => setSelectedRestaurantId(restaurant._id)}
                        style={styles.secondaryBtn}
                      >
                        View Foods
                      </button>

                      <button
                        onClick={() => startEditRestaurant(restaurant)}
                        style={styles.editBtn}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteRestaurant(restaurant._id)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.cardTitle}>Food Items</h2>
            <span style={styles.countBadge}>{foods.length}</span>
          </div>

          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            style={{ ...styles.input, marginBottom: "18px" }}
          >
            <option value="">Select Restaurant to View Foods</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name}
              </option>
            ))}
          </select>

          {!selectedRestaurantId ? (
            <div style={styles.emptyBox}>Select a restaurant to view its foods</div>
          ) : foods.length === 0 ? (
            <div style={styles.emptyBox}>No food items found for this restaurant</div>
          ) : (
            <div style={styles.foodGrid}>
              {foods.map((food) => (
                <div key={food._id} style={styles.foodCard}>
                  <img
                    src={
                      food.image ||
                      "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000"
                    }
                    alt={food.name}
                    style={styles.foodImage}
                  />

                  <div style={styles.foodBody}>
                    <h3 style={styles.foodName}>{food.name}</h3>
                    <p style={styles.foodDesc}>
                      {food.description || "Freshly prepared food item."}
                    </p>
                    <p style={styles.foodPrice}>₹{food.price}</p>

                    <div style={styles.foodActions}>
                      <button
                        onClick={() => startEditFood(food)}
                        style={styles.editBtn}
                      >
                        Edit Food
                      </button>

                      <button
                        onClick={() => deleteFood(food._id)}
                        style={styles.deleteBtn}
                      >
                        Delete Food
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    padding: "40px 28px",
    minHeight: "100vh",
    background:
      "radial-gradient(ellipse at top, #1b0e30 0%, #0a060f 45%, #060408 100%)",
    color: "#f5e6c8",
    fontFamily: "'Montserrat', sans-serif",
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "32px",
  },

  title: {
    fontSize: "42px",
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: "400",
    letterSpacing: "1px",
  },

  subTitle: {
    color: "rgba(245,230,200,0.5)",
    marginTop: "6px",
  },

  ordersBtn: {
    padding: "14px 20px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, rgba(201,146,42,0.6), rgba(245,208,128,0.2))",
    border: "1px solid rgba(201,146,42,0.6)",
    color: "#f5d080",
    fontWeight: "700",
    textDecoration: "none",
    boxShadow: "0 0 25px rgba(201,146,42,0.3)",
  },

  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },

  analyticsCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    borderRadius: "20px",
    padding: "22px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
    transition: "0.3s",
  },

  analyticsLabel: {
    color: "rgba(245,230,200,0.4)",
    fontSize: "13px",
  },

  analyticsValue: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#f5d080",
  },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "28px",
    marginBottom: "32px",
  },

  chartCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    borderRadius: "22px",
    padding: "24px",
    backdropFilter: "blur(18px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },

  chartTitle: {
    fontSize: "20px",
    marginBottom: "14px",
    color: "#f5d080",
  },

  chartWrap: {
    width: "100%",
    height: "280px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "28px",
    marginBottom: "32px",
  },

  card: {
    background: "linear-gradient(160deg, rgba(28,16,48,0.7), rgba(10,6,18,0.9))",
    border: "1px solid rgba(201,146,42,0.25)",
    borderRadius: "22px",
    padding: "28px",
    backdropFilter: "blur(22px)",
    boxShadow: "0 15px 50px rgba(0,0,0,0.8)",
    transition: "0.3s",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  cardTitle: {
    fontSize: "22px",
    color: "#f5d080",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(201,146,42,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
  },

  textarea: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(201,146,42,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
  },

  primaryBtn: {
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(201,146,42,0.6)",
    background:
      "linear-gradient(135deg, rgba(201,146,42,0.5), rgba(245,208,128,0.2))",
    color: "#f5d080",
    fontWeight: "700",
  },

  secondaryBtn: {
    flex: 1,
    padding: "10px",
    background: "rgba(201,146,42,0.1)",
    color: "#f5d080",
    borderRadius: "10px",
  },

  editBtn: {
    flex: 1,
    padding: "10px",
    background: "rgba(100,150,255,0.15)",
    color: "#9ecbff",
    borderRadius: "10px",
  },

  deleteBtn: {
    flex: 1,
    padding: "10px",
    background: "rgba(255,80,80,0.15)",
    color: "#ff6b6b",
    borderRadius: "10px",
  },

  restaurantGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },

  restaurantCard: {
    borderRadius: "22px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
    transition: "0.3s",
  },

  restaurantImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    filter: "brightness(0.75)",
  },

  restaurantBody: {
    padding: "20px",
  },

  restaurantName: {
    fontSize: "20px",
    color: "#f5e6c8",
  },

  restaurantLocation: {
    color: "rgba(245,230,200,0.4)",
  },

  rating: {
    color: "#f5d080",
  },

  foodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
  },

  foodCard: {
    borderRadius: "22px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(201,146,42,0.2)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.7)",
  },

  foodImage: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    filter: "brightness(0.75)",
  },

  foodBody: {
    padding: "20px",
  },

  foodName: {
    fontSize: "20px",
    color: "#f5e6c8",
  },

  foodDesc: {
    color: "rgba(245,230,200,0.4)",
  },

  foodPrice: {
    color: "#f5d080",
    fontWeight: "700",
  },

  emptyBox: {
    padding: "22px",
    textAlign: "center",
    color: "rgba(245,230,200,0.4)",
  },

  toast: {
    position: "fixed",
    top: "90px",
    right: "20px",
    background: "rgba(10,6,18,0.95)",
    border: "1px solid rgba(201,146,42,0.3)",
    color: "#f5d080",
    padding: "12px 18px",
    borderRadius: "12px",
  },
};