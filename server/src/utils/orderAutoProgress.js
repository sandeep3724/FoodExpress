const Order = require("../models/Order");

const activeOrderTimers = new Map();

const clearOrderTimers = (orderId) => {
  const timers = activeOrderTimers.get(orderId);

  if (timers) {
    timers.forEach((timer) => clearTimeout(timer));
    activeOrderTimers.delete(orderId);
  }
};

const updateOrderStatusIfAllowed = async (orderId, newStatus) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) return;

    if (!order.autoStatusEnabled) return;
    if (order.status === "Cancelled") return;
    if (order.status === "Delivered Successfully") return;

    order.status = newStatus;
    await order.save();

    console.log(`Order ${orderId} updated to: ${newStatus}`);
  } catch (error) {
    console.log("Auto status update error:", error.message);
  }
};

const startOrderAutoProgress = (orderId) => {
  clearOrderTimers(orderId);

  const timers = [];

  timers.push(
    setTimeout(async () => {
      await updateOrderStatusIfAllowed(orderId, "Preparing");
    }, 2000)
  );

  timers.push(
    setTimeout(async () => {
      await updateOrderStatusIfAllowed(orderId, "Out for Delivery");
    }, 7000)
  );

  timers.push(
    setTimeout(async () => {
      await updateOrderStatusIfAllowed(orderId, "Picked up by Rider");
    }, 12000)
  );

  timers.push(
    setTimeout(async () => {
      await updateOrderStatusIfAllowed(orderId, "Rider Arrived at Location");
    }, 17000)
  );

  timers.push(
    setTimeout(async () => {
      await updateOrderStatusIfAllowed(orderId, "Delivered Successfully");
      clearOrderTimers(orderId);
    }, 22000)
  );

  activeOrderTimers.set(orderId, timers);

  console.log(`Auto progress started for order: ${orderId}`);
};

module.exports = {
  startOrderAutoProgress,
  clearOrderTimers,
};