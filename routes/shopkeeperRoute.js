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
  
      // Build default match filters for sales and expenses
      let salesMatch = { shopkeeper_id };
      let expenseMatch = { shopkeeper_id };
  
      // Check for query parameters for chart data
      let chartData = null;
      if (req.query.type === 'chart') {
        // Optional date range filtering
        if (req.query.startDate && req.query.endDate) {
          const startDate = new Date(req.query.startDate);
          const endDate = new Date(req.query.endDate);
          salesMatch.created_at = { $gte: startDate, $lte: endDate };
          expenseMatch.created_at = { $gte: startDate, $lte: endDate };
        }
  
        // Debug: count how many sales and expenses match the criteria
        const salesCount = await Sales.countDocuments(salesMatch);
        const expenseCount = await Expense.countDocuments(expenseMatch);
        console.log('Sales count:', salesCount);
        console.log('Expense count:', expenseCount);
  
        // Aggregate sales by month (format: YYYY-MM)
        const salesChartData = await Sales.aggregate([
          { $match: salesMatch },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
              totalSales: { $sum: "$total_amount" },
              totalDiscount: { $sum: "$discount" }
            }
          },
          { $sort: { _id: 1 } }
        ]);
  
        // Aggregate expenses by month
        const expenseChartData = await Expense.aggregate([
          { $match: expenseMatch },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
              totalExpenses: { $sum: "$amount" }
            }
          },
          { $sort: { _id: 1 } }
        ]);
  
        console.log('Sales Chart Data:', salesChartData);
        console.log('Expense Chart Data:', expenseChartData);
  
        // Merge sales and expenses into a unified chart dataset keyed by month
        const chartDataMap = {};
        salesChartData.forEach(item => {
          chartDataMap[item._id] = {
            month: item._id,
            totalSales: item.totalSales,
            totalDiscount: item.totalDiscount,
            totalExpenses: 0
          };
        });
        expenseChartData.forEach(item => {
          if (chartDataMap[item._id]) {
            chartDataMap[item._id].totalExpenses = item.totalExpenses;
          } else {
            chartDataMap[item._id] = {
              month: item._id,
              totalSales: 0,
              totalDiscount: 0,
              totalExpenses: item.totalExpenses
            };
          }
        });
        chartData = Object.values(chartDataMap).sort((a, b) => a.month.localeCompare(b.month));
      }
  
      // Dashboard aggregations
      const salesTotal = await Sales.aggregate([
        { $match: { shopkeeper_id } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]);
      const discountTotal = await Sales.aggregate([
        { $match: { shopkeeper_id } },
        { $group: { _id: null, total: { $sum: '$discount' } } }
      ]);
      const expensesTotal = await Expense.aggregate([
        { $match: { shopkeeper_id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
  
      // Inventory and shopkeeper info
      const inventory = await Inventory.findOne({ shopkeeper_id });
      const shopkeeper = await User.findOne({ _id: shopkeeper_id });
      
      let inventoryValue = 0;
      if (inventory && inventory.products.length > 0) {
        inventoryValue = inventory.products.reduce(
          (acc, product) => acc + (product.stock_quantity * product.purchase_price),
          0
        );
      }
      console.log("Inventory Value:", inventoryValue);
  
      // Build the response
      const response = {
        shopkeeper,
        total_sales: salesTotal.length > 0 ? salesTotal[0].total : 0,
        total_expenses: expensesTotal.length > 0 ? expensesTotal[0].total : 0,
        total_profit: (salesTotal.length > 0 ? salesTotal[0].total : 0) - (expensesTotal.length > 0 ? expensesTotal[0].total : 0),
        inventory_value: inventoryValue,
        discountTotal: discountTotal.length > 0 ? discountTotal[0].total : 0
      };
  
      // Append chart data if requested
      if (chartData !== null) {
        response.chartData = chartData;
      }
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
  });
      
  
  
  

module.exports = router;
