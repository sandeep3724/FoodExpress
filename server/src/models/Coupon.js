const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["percent", "flat"], required: true },
  value: { type: Number, required: true },
  maxDiscount: { type: Number, default: 0 },
  minOrder: { type: Number, default: 0 },

  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },

  expiry: Date,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Coupon", couponSchema);