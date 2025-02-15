// routes/expense.js

const express = require('express');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const router = express.Router();

// Get all expense categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await ExpenseCategory.find({}, 'name description');
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expense categories', error });
    }
});

// Add a new expense
router.post('/add', async (req, res) => {
    try {
        const { shopkeeper_id, amount, category_id, description, payment_method, date } = req.body;

        if (!shopkeeper_id || !amount || !category_id || !payment_method) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const category = await ExpenseCategory.findById(category_id);
        if (!category) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const expense = new Expense({
            shopkeeper_id,
            amount,
            category: category_id,
            description,
            payment_method,
            date
        });

        await expense.save();
        res.status(201).json({ message: 'Expense recorded successfully', expense });
    } catch (error) {
        res.status(500).json({ message: 'Error recording expense', error });
    }
});

// Get all expenses for a shopkeeper
router.get('/:shopkeeper_id', async (req, res) => {
    try {
        const expenses = await Expense.find({ shopkeeper_id: req.params.shopkeeper_id }).populate('category', 'name description').sort({ date: -1 });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error });
    }
});

// Get a single expense by ID
router.get('/detail/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id).populate('category', 'name description');
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.status(200).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expense details', error });
    }
});

// Update an expense
router.put('/update/:id', async (req, res) => {
    try {
        const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category', 'name description');
        res.status(200).json({ message: 'Expense updated successfully', updatedExpense });
    } catch (error) {
        res.status(500).json({ message: 'Error updating expense', error });
    }
});

// Delete an expense
router.delete('/delete/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting expense', error });
    }
});

module.exports = router;
