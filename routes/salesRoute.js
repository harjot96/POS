// routes/sales.js

const express = require('express');
const mongoose = require('mongoose');
const Sales = require('../models/sales');
const {   generateProfessionalReceipt } = require('../utils/pdfGenerator');
const savePdfLocally = require('../services/localStorageService');
const Inventory = mongoose.models.Inventory || require('../models/Inventory');
const User = require('../models/user');

const router = express.Router();

// Add a new sale and update inventory
router.post('/add', async (req, res) => {
    try {
      const {
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
        notes,
      } = req.body;
  
      // Validate required fields
      let missingFields = [];
      if (!shopkeeper_id) missingFields.push('shopkeeper_id');
      if (!total_amount) missingFields.push('total_amount');
      if (!payment_method) missingFields.push('payment_method');
      if (!final_amount) missingFields.push('final_amount');
      if (!items || items.length === 0) missingFields.push('items');
  
      if (missingFields.length > 0) {
        return res
          .status(400)
          .json({ message: 'Missing required fields', missingFields });
      }
  
      // Check and update inventory
      let inventory = await Inventory.findOne({ shopkeeper_id });
      if (!inventory) {
        return res
          .status(400)
          .json({ message: 'Inventory not found for this shopkeeper' });
      }
  
      for (const item of items) {
        let productIndex = inventory.products.findIndex(
          (p) => p.product_id.toString() === item.product_id
        );
        if (productIndex === -1) {
          return res.status(400).json({
            message: `Product not found in inventory: ${item.product_name}`,
          });
        }
        if (inventory.products[productIndex].stock_quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for: ${item.product_name}`,
          });
        }
        // Deduct stock
        inventory.products[productIndex].stock_quantity -= item.quantity;
      }
      await inventory.save();
  
      // Save the sale
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
        notes,
      });
      await sale.save();
  
      // Generate PDF for the sale
      const pdfBuffer = await generateProfessionalReceipt(sale);
      // Create a unique filename, e.g., "bill_<saleId>.pdf"
      const filename = `bill_${sale._id}.pdf`;
      // Save the PDF locally
      const filePath = await savePdfLocally(pdfBuffer, filename);
  
      // Return the file path along with sale details
      return res.status(201).json({
        message: 'Sale recorded, inventory updated, and bill saved locally!',
        sale,
        filePath,
      });
    } catch (error) {
      console.error('Error recording sale:', error);
      return res
        .status(500)
        .json({ message: 'Error recording sale', error: error.message });
    }
  });

// Get all sales for a shopkeeper
router.get('/:shopkeeper_id', async (req, res) => {
  try {
    const { shopkeeper_id } = req.params;
    const { startDate, endDate } = req.query;
    const { ObjectId } = mongoose.Types;

    // 1) Ensure shopkeeper exists
    const user = await User.findById(shopkeeper_id);
    if (!user) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    const isPremium = user.subscription_plan === 'Premium';

    // 2) Base match – always filter by shopkeeper_id
    const match = { shopkeeper_id: new ObjectId(shopkeeper_id) };

    // 3) Date logic: only add created_at if user passed any date params.
    if (startDate || endDate) {
      match.created_at = {};
      if (startDate) match.created_at.$gte = new Date(startDate);
      if (endDate)   match.created_at.$lte = new Date(endDate);
    }
    // 4) If no dates AND user is Basic -> default to last 7 days
    else if (!isPremium) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      match.created_at = { $gte: sevenDaysAgo };
    }

    console.log('Match criteria:', match);

    // 5) Aggregate timeline by day
    const timeline = await Sales.aggregate([
      { $match: match },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
          },
          sales: { $push: '$$ROOT' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    return res.status(200).json(timeline);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return res.status(500).json({ message: 'Error fetching sales', error });
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
