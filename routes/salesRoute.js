// routes/sales.js

const express = require('express');
const mongoose = require('mongoose');
const Sales = require('../models/sales');
const Inventory = mongoose.models.Inventory || require('../models/Inventory');
const router = express.Router();

// Add a new sale and update inventory
router.post('/add', async (req, res) => {
    try {
        const { shopkeeper_id, customer_name, customer_phone, total_amount, payment_method, payment_status, items, discount, tax, final_amount, transaction_id, notes } = req.body;

        let missingFields = [];
        if (!shopkeeper_id) missingFields.push('shopkeeper_id');
        if (!total_amount) missingFields.push('total_amount');
        if (!payment_method) missingFields.push('payment_method');
        if (!final_amount) missingFields.push('final_amount');
        if (!items || items.length === 0) missingFields.push('items');

        if (missingFields.length > 0) {
            return res.status(400).json({ message: 'Missing required fields', missingFields });
        }

        // Check and update inventory
        let inventory = await Inventory.findOne({ shopkeeper_id });
        if (!inventory) {
            return res.status(400).json({ message: 'Inventory not found for this shopkeeper' });
        }

        for (const item of items) {
            let productIndex = inventory.products.findIndex(p => p.product_id.toString() === item.product_id);
            if (productIndex === -1) {
                return res.status(400).json({ message: `Product not found in inventory: ${item.product_name}` });
            }
            if (inventory.products[productIndex].stock_quantity < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for: ${item.product_name}` });
            }
            
            inventory.products[productIndex].stock_quantity -= item.quantity;
        }
        
        await inventory.save();

        const sale = new Sales({
            shopkeeper_id,
            customer_name,
            customer_phone,
            total_amount,
            payment_method,
            payment_status,
            items,
            discount,
            tax,
            final_amount,
            transaction_id,
            notes
        });

        await sale.save();
        res.status(201).json({ message: 'Sale recorded successfully and inventory updated', sale });
    } catch (error) {
        res.status(500).json({ message: 'Error recording sale', error });
    }
});

// Get all sales for a shopkeeper
router.get('/:shopkeeper_id', async (req, res) => {
    try {
        const sales = await Sales.find({ shopkeeper_id: req.params.shopkeeper_id }).sort({ created_at: -1 });
        res.status(200).json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error });
    }
});

// Get a single sale by ID
router.get('/detail/:id', async (req, res) => {
    try {
        const sale = await Sales.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: 'Sale not found' });
        res.status(200).json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale details', error });
    }
});

// Update a sale
router.put('/update/:id', async (req, res) => {
    try {
        const updatedSale = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Sale updated successfully', updatedSale });
    } catch (error) {
        res.status(500).json({ message: 'Error updating sale', error });
    }
});

// Delete a sale
router.delete('/delete/:id', async (req, res) => {
    try {
        await Sales.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sale', error });
    }
});

module.exports = router;
