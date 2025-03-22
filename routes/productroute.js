// routes/category.js

const express = require('express');
const category = require('../models/category');
const router = express.Router();

// Create a new category


// Get all categories for a shopkeeper
router.get('/getCategory', async (req, res) => {
    try {
        const predefinedCategories = await category.find();
        console.log(predefinedCategories);
        
        res.status(200).json(predefinedCategories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
});





module.exports = router;
