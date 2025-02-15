// models/ExpenseCategory.js

const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
