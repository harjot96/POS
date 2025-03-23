// routes/inventory.js

const express = require('express');
const product = require('../models/product');
const inventory = require('../models/Inventory');
const sales = require('../models/sales');
const category = require('../models/category');
const { default: mongoose } = require('mongoose');
const { uploadImage } = require('../services/cloudinaryService');
const multer = require('multer');

const router = express.Router();

// Setup multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add a Product to Inventory
// Add a New Product & Add to Inventory
router.post('/add-product-inventory', upload.single('image'), async (req, res) => {
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
      expiration_date,
    } = req.body;

    // If an image file is provided, upload it to Cloudinary
    let imageUrl = '';
    if (req.file) {
      const result = await uploadImage(req.file);
      imageUrl = result.secure_url;
    }

    // Step 1: Check if the product already exists for this shopkeeper (by SKU or Barcode)
    // This ensures that within the same shop, the SKU/barcode combination is unique.
    let existingProduct = await product.findOne({
      shopkeeper_id,
      $or: [{ sku }, { barcode }]
    });
    if (existingProduct) {
      return res.status(400).json({
        message: 'Product with the same SKU or barcode already exists for this shop.'
      });
    }

    // Step 2: Create a new product for this shopkeeper
    const newProduct = new product({
      shopkeeper_id,
      name,
      category: category_id,
      price,
      sku,
      barcode,
      description,
      image: imageUrl,
    });
    await newProduct.save();

    // Step 3: Check if the shopkeeper's inventory exists, create if it doesn't
    let shopkeeperInventory = await inventory.findOne({ shopkeeper_id });
    if (!shopkeeperInventory) {
      shopkeeperInventory = new inventory({
        shopkeeper_id,
        products: [],
      });
    }

    // Step 4: Add the new product to the shopkeeper's inventory
    shopkeeperInventory.products.push({
      product_id: newProduct._id,
      name,
      stock_quantity,
      purchase_price,
      selling_price,
      expiration_date,
      image: imageUrl,
    });

    await shopkeeperInventory.save();

    res.status(201).json({
      message: 'Product added to inventory successfully',
      inventory: shopkeeperInventory,
    });
  } catch (error) {
    console.log(error);
    
    console.error(error);
    res.status(500).json({
      message: 'Error adding product to inventory',
      error: error.message
    });
  }
});





// Get Inventory for a Shopkeeper

router.get('/:shopkeeper_id', async (req, res) => {
  try {
    // Convert to ObjectId if necessary
    const shopkeeperId = new mongoose.Types.ObjectId(req.params.shopkeeper_id);

    // Find all inventory docs for this shopkeeper and populate product details along with category info
    const inventories = await inventory.find({ shopkeeper_id: shopkeeperId })
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
        // Check nested category existence
        category: p.product_id && p.product_id.category ? p.product_id.category.name : null,
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
  
      // Option 1: If your sales collection stores shopkeeper_id as an ObjectId:
      const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeper_id);
      // Option 2: If your sales collection stores shopkeeper_id as a string,
      // then you might want to use the raw shopkeeper_id (uncomment the line below)
      // const shopkeeperObjectId = shopkeeper_id;
  
      const pipeline = [
        {
          // Ensure this field name exactly matches your sales documents
          $match: {
            shopkeeper_id: shopkeeperObjectId
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product_id',       // Group by product id from each item
            totalSold: { $sum: '$items.quantity' } // Sum quantities sold
          }
        },
        { $sort: { totalSold: -1 } },
        {
          $lookup: {
            from: 'products',    // Ensure this matches the actual collection name
            localField: '_id',   // product id from the group
            foreignField: '_id', // product _id in the products collection
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $project: {
            productId: '$_id',
            totalSold: 1,
            'productInfo.name': 1,
            'productInfo.barcode': 1,
            'productInfo.sku': 1,
            'productInfo.price': 1,
            'productInfo.description': 1,
            'productInfo.image': 1,
            _id: 0
          }
        }
        // Optionally add a $limit stage here if you want only the top 5 fast-selling items
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

// Get Product Details by ID
router.get('/product/:id', async (req, res) => {
    console.log(req.params.id);
    
    try {
        const product = await product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product fetched successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product details', error });
    }
});

// Delete an Inventory Product
router.delete('/delete/:id', async (req, res) => {
    console.log(req.params.id);
    
    try {
        await Inventory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product removed from inventory successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inventory product', error });
    }
});

/**
 * GET /inventory/:shopkeeper_id/product-finder
 * Query Params: 
 *   - filter = 'Most Selling' | 'Low stock' | 'Achieved' (optional)
 *   - searchTerm = string (optional)
 */
router.get('/:shopkeeper_id/product-finder', async (req, res) => {
  try {
    const { shopkeeper_id } = req.params;
    const { filter, searchTerm } = req.query;
    const shopkeeperObjectId = new mongoose.Types.ObjectId(shopkeeper_id);

    // 1) Handle "Most Selling" filter with an aggregation pipeline
    if (filter === 'Most Selling') {
      const pipeline = [
        { $match: { shopkeeper_id: shopkeeperObjectId } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product_id',
            totalSold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalSold: -1 } },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        { $unwind: '$productInfo' },
        // --- LOOKUP INVENTORY to get leftover stock ---
        {
          $lookup: {
            from: 'inventories',
            let: { productId: '$_id', shopkeeper: shopkeeperObjectId },
            pipeline: [
              { $match: { $expr: { $eq: ['$shopkeeper_id', '$$shopkeeper'] } } },
              { $unwind: '$products' },
              {
                $match: {
                  $expr: { $eq: ['$products.product_id', '$$productId'] },
                },
              },
              { $project: { 'products.stock_quantity': 1, _id: 0 } },
            ],
            as: 'inventoryInfo',
          },
        },
        {
          $unwind: {
            path: '$inventoryInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            productId: '$_id',
            totalSold: 1,
            leftoverStock: '$inventoryInfo.products.stock_quantity',
            'productInfo.name': 1,
            'productInfo.barcode': 1,
            'productInfo.sku': 1,
            'productInfo.image': 1,
            'productInfo.price': 1,
            'productInfo.description': 1,
            _id: 0,
          },
        },
      ];

      const fastSelling = await sales.aggregate(pipeline).exec();

      // Optional searchTerm filter
      let filteredData = fastSelling;
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filteredData = fastSelling.filter((item) => {
          const name = item.productInfo.name?.toLowerCase() || '';
          const code =
            item.productInfo.sku?.toLowerCase() ||
            item.productInfo.barcode?.toLowerCase() ||
            '';
          return name.includes(lowerSearch) || code.includes(lowerSearch);
        });
      }

      // Transform aggregator result to match the consistent format
      const finalData = filteredData.map((item) => ({
        id: item.productId.toString(),
        image: item.productInfo.image || '',
        code: item.productInfo.sku || item.productInfo.barcode || '',
        name: item.productInfo.name,
        productId: item.productId.toString(),
        price: item.productInfo.price,
        description: item.productInfo.description || '',
        quantity: item.leftoverStock || 0,
        totalSold: item.totalSold,
      }));

      return res.json({
        filter: 'Most Selling',
        data: finalData,
      });
    }

    // 2) Otherwise, fetch from the shopkeeper’s inventory:
    const shopkeeperInventory = await inventory
      .findOne({ shopkeeper_id })
      .populate('products.product_id')
      .exec();

    if (!shopkeeperInventory) {
      return res.json({ filter: filter || 'None', data: [] });
    }

    // 3) Transform inventory docs into a front-end-friendly array with consistent keys
    let allProducts = shopkeeperInventory.products.map((p) => {
      const productDoc = p.product_id || {};
      return {
        // Using product id for consistency
        id: productDoc._id ? productDoc._id.toString() : '',
        image: productDoc.image || '',
        code: productDoc.sku || productDoc.barcode || '',
        name: productDoc.name || 'Unnamed Product',
        productId: productDoc._id ? productDoc._id.toString() : '',
        price: p.selling_price,
        description: productDoc.description || '',
        quantity: p.stock_quantity,
        totalSold: 0 // default value since this data isn't available here
      };
    });

    // 4) Apply searchTerm filter (by name or code)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      allProducts = allProducts.filter((item) => {
        const codeMatch = item.code.toLowerCase().includes(lowerSearch);
        const nameMatch = item.name.toLowerCase().includes(lowerSearch);
        return codeMatch || nameMatch;
      });
    }

    // 5) Apply filter logic for "Low stock" or "Achieved"
    if (filter === 'Low stock') {
      allProducts = allProducts.filter((item) => item.quantity < 5);
    } else if (filter === 'Achieved') {
      allProducts = allProducts.filter((item) => item.quantity > 0);
    }

    return res.json({
      filter: filter || 'None',
      data: allProducts,
    });
  } catch (error) {
    console.error('Error in product-finder route:', error);
    return res.status(500).json({
      message: 'Server error fetching products',
      error: error.message,
    });
  }
});



module.exports = router;
