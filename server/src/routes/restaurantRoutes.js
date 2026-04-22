const express = require("express");
const Restaurant = require("../models/Restaurant");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const router = express.Router();


// ================== GET ALL RESTAURANTS ==================
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================== ADD RESTAURANT (ADMIN) ==================
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      let imageUrl = "";

      // Upload image if exists
      if (req.file) {
        const uploadedImage = await uploadToCloudinary(
          req.file.buffer,
          "food-delivery-app/restaurants"
        );
        imageUrl = uploadedImage.secure_url;
      }

      const restaurant = new Restaurant({
        name: req.body.name,
        location: req.body.location,
        rating: Number(req.body.rating) || 0,
        image: imageUrl,
      });

      await restaurant.save();
      res.json(restaurant);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ================== UPDATE RESTAURANT (ADMIN) ==================
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, location, rating } = req.body;

      let updateData = {};

      // Only update fields if provided
      if (name) updateData.name = name;
      if (location) updateData.location = location;
      if (rating) updateData.rating = Number(rating);

      // If new image uploaded
      if (req.file) {
        const uploadedImage = await uploadToCloudinary(
          req.file.buffer,
          "food-delivery-app/restaurants"
        );
        updateData.image = uploadedImage.secure_url;
      }

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!restaurant) {
        return res.status(404).json({ msg: "Restaurant not found" });
      }

      res.json(restaurant);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// ================== DELETE RESTAURANT (ADMIN) ==================
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    res.json({ msg: "Restaurant deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;