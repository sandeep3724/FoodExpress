const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant"
  },
  name: String,
  price: Number,
  image: String,
  description: String
});

module.exports = mongoose.model("Food", foodSchema);