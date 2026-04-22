const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: String,
  location: String,
  image: String,
  rating: Number
});

module.exports = mongoose.model("Restaurant", restaurantSchema);