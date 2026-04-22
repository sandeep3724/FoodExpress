const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  startOrderAutoProgress,
  clearOrderTimers,
} = require("../utils/orderAutoProgress");

const router = express.Router();

// Place order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, totalPrice } = req.body;

    const order = new Order({
      userId: req.user.id,
      items,
      totalPrice,
      status: "Pending",
      autoStatusEnabled: true,
    });

    await order.save();

    // start auto status flow
    startOrderAutoProgress(order._id.toString());

    res.json({
      msg: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.log("Place order error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get my orders
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (err) {
    console.log("Get my orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all orders
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log("Get all orders error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin: update order status
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // if admin cancels, stop automation
    if (status === "Cancelled") {
      order.status = "Cancelled";
      order.autoStatusEnabled = false;
      await order.save();

      clearOrderTimers(order._id.toString());

      return res.json(order);
    }

    // optional: block manual changes except cancel
    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.log("Update order status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;