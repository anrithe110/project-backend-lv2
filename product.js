const db = require("./db");
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specs: { type: String, required: true },
  price: { type: Number, required: true },
  class: { type: String, required: true },
  productCode: { type: Number },
  image: {
    img1: { type: String },
    img2: { type: String },
    img3: { type: String }
  }
});

module.exports = mongoose.model("Product", ProductSchema);