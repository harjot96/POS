// routes/inventory.js

const express = require('express');
const product = require('../models/product');
const inventory = require('../models/Inventory');

const router = express.Router();

// Add a Product to Inventory
// Add a New Product & Add to Inventory
router.post('/add-product-inventory', async (req, res) => {
    try {
        const {
            shopkeeper_id,
            name,
            category_id,
            sku,
            barcode,
            description,
            stock_quantity,
            price,
            purchase_price,
            selling_price,
            expiration_date
        } = req.body;

        // Step 1: Check if the product exists (by SKU or Barcode)
        let existingProduct = await product.findOne({ $or: [{ sku }, { barcode }] });

        if (!existingProduct) {
            // Step 2: Create a new product if it does not exist
            existingProduct = new product({
                shopkeeper_id,
                name,
                category: category_id,
                price,
                sku,
                barcode,
                description
            });
            await existingProduct.save();
        }

        // Step 3: Check if the shopkeeper's inventory exists
        let shopkeeperInventory = await inventory.findOne({ shopkeeper_id });

        if (!shopkeeperInventory) {
            // Step 4: Create inventory if it doesn't exist
            shopkeeperInventory = new inventory({
                shopkeeper_id,
                products: []
            });
        }

        // Step 5: Check if the product is already in the inventory
        const productExists = shopkeeperInventory.products.some(
            (item) => item.product_id.toString() === existingProduct._id.toString()
        );

        if (productExists) {
            return res.status(400).json({ message: 'Product already exists in inventory' });
        }

        console.log(existingProduct);
        
        // Step 6: Add the new product to the inventory
        shopkeeperInventory.products.push({
            product_id: existingProduct._id,
            name,
            stock_quantity,
            purchase_price,
            selling_price,
            expiration_date
        });

        await shopkeeperInventory.save();

        res.status(201).json({
            message: 'Product added to inventory successfully',
            inventory: shopkeeperInventory
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding product to inventory', error });
    }
});




// Get Inventory for a Shopkeeper
router.get('/:shopkeeper_id', async (req, res) => {
    console.log(req.params.shopkeeper_id);
    
    try {
        const inventorys = await inventory.find({ shopkeeper_id: req.params.shopkeeper_id });
        res.status(200).json(inventorys);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory', error });
    }
});

// Update Inventory Product Details
router.put('/update/:id', async (req, res) => {
    try {
        const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: 'Inventory updated successfully', updatedItem });
    } catch (error) {
        res.status(500).json({ message: 'Error updating inventory', error });
    }
});

// Delete an Inventory Product
router.delete('/delete/:id', async (req, res) => {
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product removed from inventory successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inventory product', error });
    }
});

module.exports = router;
