// routes/dashboard.js

const express = require('express');
const mongoose = require('mongoose');
const Sales = require('../models/sales');
const Expense = require('../models/Expense');
const Inventory = require('../models/Inventory');
const User = require('../models/user');
const router = express.Router();

// Get Dashboard Summary
router.get('/:shopkeeper_id', async (req, res) => {
    try {
        const shopkeeper_id = new mongoose.Types.ObjectId(req.params.shopkeeper_id);

        // Fetch total sales
        const salesTotal = await Sales.aggregate([
            { $match: { shopkeeper_id: shopkeeper_id } },
            { $group: { _id: null, total: { $sum: '$total_amount' } } }
        ]);
        const discountTotal = await Sales.aggregate([
            { $match: { shopkeeper_id: shopkeeper_id } },
            { $group: { _id: null, total: { $sum: '$discount' } } }
        ]);

        // Fetch total expenses
        const expensesTotal = await Expense.aggregate([
            { $match: { shopkeeper_id: shopkeeper_id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Fetch total inventory value
        const inventory = await Inventory.findOne({ shopkeeper_id });
        const shopkeeper=await User.findOne({_id:shopkeeper_id})
        console.log(shopkeeper);
        
        let inventoryValue = 0;
        if (inventory && inventory.products.length > 0) {
            inventoryValue = inventory.products.reduce((acc, product) => acc + (product.stock_quantity * product.purchase_price), 0);
        }

        res.status(200).json({
            shopkeeper,
            total_sales: salesTotal.length > 0 ? salesTotal[0].total : 0,
            total_expenses: expensesTotal.length > 0 ? expensesTotal[0].total : 0,
            total_profit: (salesTotal.length > 0 ? salesTotal[0].total : 0) - (expensesTotal.length > 0 ? expensesTotal[0].total : 0),
            inventory_value: inventoryValue,
            discountTotal:discountTotal[0].total,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard data', error });
    }
});

module.exports = router;
