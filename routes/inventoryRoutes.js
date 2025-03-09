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
    try {
      // Fetch all inventory docs for this shopkeeper, populating product details
      const inventories = await inventory
        .find({ shopkeeper_id: req.params.shopkeeper_id })
        .populate('products.product_id')
        .exec();
  
      // Transform the Mongoose documents into a cleaner, front-end-friendly response
      const transformed = inventories.map((inv) => ({
        id: inv._id, // rename _id -> id
        shopkeeperId: inv.shopkeeper_id,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
        products: inv.products.map((p) => ({
          // Each item in the "products" array
          id: p._id, // subdocument ID
          productId: p.product_id?._id, // the actual product's ID
          name: p.product_id?.name || p.name, // fallback if not populated
          description: p.product_id?.description,
          stockQuantity: p.stock_quantity,
          purchasePrice: p.purchase_price,
          sellingPrice: p.selling_price,
          barcode: p.product_id?.barcode,
          sku: p.product_id?.sku,
          category: p.product_id?.category,
          expirationDate: p.expiration_date,
        })),
      }));
  
      res.status(200).json(transformed);
    } catch (error) {
      console.error('Error fetching inventory:', error);
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
