const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalPrice: Number,
    status: {
      type: String,
      default: "Pending",
    },
    autoStatusEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);