// routes/inventory.js

const express = require('express');
const product = require('../models/product');
const inventory = require('../models/Inventory');
const sales = require('../models/sales');
const category = require('../models/category');
const { default: mongoose } = require('mongoose');

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
      // Find all inventory docs for this shopkeeper and populate product details along with category info
      const inventories = await inventory.find({ shopkeeper_id: req.params.shopkeeper_id })
        .populate({
          path: 'products.product_id',
          populate: { path: 'category', model: 'category' } // Nested population for category
        })
        .exec();
  
      // Transform the Mongoose documents into a front-end-friendly response
      const transformed = inventories.map((inv) => ({
        id: inv._id, // rename _id -> id
        shopkeeperId: inv.shopkeeper_id,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
        products: inv.products.map((p) => ({
            
          id: p._id, // subdocument ID
          productId: p.product_id ? p.product_id._id : null, // actual product's ID
          name: p.product_id ? p.product_id.name : p.name, // fallback if not populated
          description: p.product_id ? p.product_id.description : undefined,
          stockQuantity: p.stock_quantity,
          purchasePrice: p.purchase_price,
          sellingPrice: p.selling_price,
          barcode: p.product_id ? p.product_id.barcode : undefined,
          sku: p.product_id ? p.product_id.sku : undefined,
          // Category data from nested population
          category: p.product_id ? p.product_id.category.name : null,
          expirationDate: p.expiration_date,
        })),
      }));
  
      res.status(200).json(transformed);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ message: 'Error fetching inventory', error });
    }
  });
  

  router.get('/:shopkeeper_id/stats', async (req, res) => {
    const { shopkeeper_id } = req.params;
    const LOW_STOCK_THRESHOLD = 10; // Customize the threshold as needed
  
    try {
      // Find all inventory documents for this shopkeeper
      const inventories = await inventory.find({ shopkeeper_id }).exec();
  
      // We’ll accumulate the stats across all inventory records
      let totalProducts = 0;
      let outOfStock = 0;
      let lowInStock = 0;
  
      inventories.forEach((inv) => {
        inv.products.forEach((p) => {
          totalProducts++;
  
          if (p.stock_quantity === 0) {
            outOfStock++;
          } else if (p.stock_quantity < LOW_STOCK_THRESHOLD) {
            lowInStock++;
          }
        });
      });
  
      // Return the computed stats
      res.status(200).json({
        totalProducts,
        outOfStock,
        lowInStock
      });
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      res.status(500).json({ message: 'Error fetching inventory stats', error });
    }
  });

  router.get('/:shopkeeper_id/fastselling', async (req, res) => {
    try {
      const { shopkeeper_id } = req.params;
  
      // Convert to a Mongoose ObjectId (good practice to ensure correct format)
      const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeper_id);
  
      // Aggregation pipeline steps:
      // 1. Match sales belonging to this shopkeeper.
      // 2. Unwind "items" so each item in the array becomes its own document.
      // 3. Group by product_id, summing the quantities across all sales.
      // 4. Sort by totalSold in descending order.
      // 5. Lookup product details from the "products" collection.
      // 6. Unwind the looked-up array (productInfo).
      // 7. Project/rename fields as needed.
      // 8. (Optional) limit how many you want to return, e.g. top 5 or 10.
  
      const pipeline = [
        {
          $match: {
            shopkeeper_id: shopkeeperObjectId
          }
        },
        // Each item in "items" will become a separate doc in the pipeline
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: '$items.product_id',         // group by product's ObjectId
            totalSold: { $sum: '$items.quantity' } // sum the quantity across all sales
          }
        },
        {
          $sort: { totalSold: -1 } // sort by totalSold descending
        },
        {
          // Lookup product details from the "products" collection
          $lookup: {
            from: 'products',    // name of the Products collection in MongoDB
            localField: '_id',   // the product_id from our group
            foreignField: '_id', // _id of the product in the Products collection
            as: 'productInfo'
          }
        },
        // productInfo will be an array. Unwind it to flatten
        {
          $unwind: '$productInfo'
        },
        // (Optional) limit to top 5
        // { $limit: 5 }, 
        {
          // Choose which fields to return (rename as needed)
          $project: {
            productId: '$_id',
            totalSold: 1,
            'productInfo.name': 1,
            'productInfo.barcode': 1,
            'productInfo.sku': 1,
            'productInfo.price': 1,
            'productInfo.description': 1,
            _id: 0
          }
        }
      ];
  
      const fastSelling = await sales.aggregate(pipeline).exec();
  
      return res.status(200).json({
        message: 'Fast-selling products fetched successfully',
        data: fastSelling
      });
    } catch (error) {
      console.error('Error fetching fast-selling products:', error);
      res.status(500).json({ message: 'Server error', error });
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
