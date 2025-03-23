const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    shopkeeper_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true // Ensures one inventory per shopkeeper
    },
    products: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products', // Reference to Product model
                required: true
            },
            stock_quantity: {
                type: Number,
                required: true,
                default: 0
            },
            name: {
                type: String,
                required: true
            },
            image:{
                type: String,
                required: false,
            },

            purchase_price: {
                type: Number,
                required: true
            },
            selling_price: {
                type: Number,
                required: true
            },
            expiration_date: {
                type: Date
            }
        }
    ],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inventory', InventorySchema);
