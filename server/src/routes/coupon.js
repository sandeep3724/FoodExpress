const router = require("express").Router();
const Coupon = require("../models/Coupon");

router.post("/apply-coupon", async (req, res) => {
  const { code, restaurantId, total } = req.body;

  const coupon = await Coupon.findOne({ code, restaurantId });

  if (!coupon || !coupon.isActive) {
    return res.status(400).json({ msg: "Invalid coupon" });
  }

  if (coupon.expiry && new Date() > coupon.expiry) {
    return res.status(400).json({ msg: "Expired coupon" });
  }

  if (total < coupon.minOrder) {
    return res.status(400).json({ msg: "Minimum order not met" });
  }

  let discount = 0;

  if (coupon.discountType === "percent") {
    discount = (total * coupon.value) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.value;
  }

  res.json({ discount });
});

module.exports = router;