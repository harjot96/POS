// models/Product.js

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  shopkeeper_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  barcode: {
    type: String,
    required: true
    // Removed global unique constraint here.
  },
  sku: {
    type: String,
    required: true,
    // No global unique here either.
  },
  image: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create compound indexes for uniqueness per shopkeeper
ProductSchema.index({ shopkeeper_id: 1, sku: 1 }, { unique: true });
ProductSchema.index({ shopkeeper_id: 1, barcode: 1 }, { unique: true });

module.exports = mongoose.model('Products', ProductSchema);
