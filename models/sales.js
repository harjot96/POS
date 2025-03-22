// models/Sales.js

const mongoose = require('mongoose');

const SalesSchema = new mongoose.Schema({
    shopkeeper_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    customer_name: {
        type: String,
        required: false
    },
    customer_phone: {
        type: String,
        required: false
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Wallet', 'Other'],
        required: true
    },
    payment_status: {
        type: String,
        enum: ['Paid', 'Pending'],
        required: true,
        default: 'Paid'
    },
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
                required: true
            },
            product_name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            },
            total: {
                type: Number,
                required: true
            }
        }
    ],
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    final_amount: {
        type: Number,
        required: true
    },
    transaction_id: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        required: false
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

module.exports = mongoose.model('Sales', SalesSchema);
