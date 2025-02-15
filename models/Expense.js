// models/Expense.js

const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    shopkeeper_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Wallet', 'Other'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
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

module.exports = mongoose.model('Expense', ExpenseSchema);
