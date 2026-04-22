const express = require("express");
const Food = require("../models/Food");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const router = express.Router();

// Get foods by restaurant
router.get("/:restaurantId", async (req, res) => {
  try {
    const foods = await Food.find({ restaurantId: req.params.restaurantId });
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add food (ADMIN ONLY)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      let imageUrl = "";

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(
          req.file.buffer,
          "food-delivery-app/foods"
        );
        imageUrl = uploadedImage.secure_url;
      }

      const food = new Food({
        restaurantId: req.body.restaurantId,
        name: req.body.name,
        price: Number(req.body.price),
        description: req.body.description,
        image: imageUrl,
      });

      await food.save();
      res.json(food);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update food (ADMIN ONLY)
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const existingFood = await Food.findById(req.params.id);

      if (!existingFood) {
        return res.status(404).json({ msg: "Food not found" });
      }

      let imageUrl = existingFood.image;

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(
          req.file.buffer,
          "food-delivery-app/foods"
        );
        imageUrl = uploadedImage.secure_url;
      }

      const updatedFood = await Food.findByIdAndUpdate(
        req.params.id,
        {
          restaurantId: req.body.restaurantId || existingFood.restaurantId,
          name: req.body.name || existingFood.name,
          price: req.body.price ? Number(req.body.price) : existingFood.price,
          description: req.body.description || existingFood.description,
          image: imageUrl,
        },
        { new: true }
      );

      res.json(updatedFood);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete food
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ msg: "Food deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;