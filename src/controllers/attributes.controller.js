import ProductAttributes from '../models/attribute.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { StockHistory } from '../models/stockHistory.model.js'
import mongoose from 'mongoose';


const createProductAttributes = async (req, res) => {
  try {
    const {
      name,
      sku,
      distributorPrice,
      mrpPrice,
      salePrice,
      material,
      color,
      size,
      fittype,
      sleevetype,
      neckstyle,
      pattern,
      stock,
      unstock
    } = req.body;

    const file = req.file;

  if (!name || !sku || !distributorPrice || !mrpPrice || !salePrice) {
  return res.status(400).json({
    success: false,
    message: 'Missing required fields: name, sku, distributorPrice, mrpPrice, salePrice'
  });
}

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a cover image"
      });
    }

    const cloudinaryResponse = await uploadOnCloudinary(file);
    if (!cloudinaryResponse?.url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload image"
      });
    }

    
    const product = new ProductAttributes({
      name,
      sku,
      distributorPrice: Number(distributorPrice),
      mrpPrice: Number(mrpPrice),
      salePrice: Number(salePrice),
      stock: stock != null ? Number(stock) : undefined, 
      unstock: Boolean(unstock),
      color,
      size,
      material,
      fittype,
      sleevetype,
      neckstyle,
      pattern,
      coverImage: cloudinaryResponse.url
    });

    const savedProduct = await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: savedProduct
    });

  } catch (error) {
    console.error("Error creating product:", error);

    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({
        success: false,
        message: "SKU must be unique",
        field: "sku"
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



const getAllProductAttributes = async (req, res) => {
  try {
    const { page = 1, limit = 32 } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const attributes = await ProductAttributes.paginate({}, options);
    
    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: attributes
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server Error',
      success: false,
      error: error.message
    });
  }
};

const getProductAttributesBySku = async (req, res) => {
  try {
    const { sku } = req.params;
    const attributes = await ProductAttributes.findOne({ sku });
    
    if (!attributes) {
      return res.status(404).json({
        message: 'Product attributes not found',
        success: false
      });
    }
    
    return res.status(200).json({
      message: "Product fetched successfully",
      success: true,
      data: attributes
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

const updateProductAttributes = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log("data check update ", updates);
    // Convert important fields to numbers to avoid validation errors
    const updates = {
      ...req.body,
      mrpPrice: req.body.mrpPrice !== undefined ? Number(req.body.mrpPrice) : undefined,
      salePrice: req.body.salePrice !== undefined ? Number(req.body.salePrice) : undefined,
      distributorPrice: req.body.distributorPrice !== undefined ? Number(req.body.distributorPrice) : undefined
    };

    console.log("Updating product with values:", updates);

    // Manual price validations (to prevent saving invalid data)
    if (updates.salePrice !== undefined && updates.mrpPrice !== undefined && updates.salePrice > updates.mrpPrice) {
      return res.status(400).json({
        message: "Sale price cannot be higher than MRP price",
        success: false
      });
    }

    if (updates.distributorPrice !== undefined && updates.salePrice !== undefined && updates.distributorPrice > updates.salePrice) {
      return res.status(400).json({
        message: "Distributor price cannot be higher than sale price",
        success: false
      });
    }

    const updatedAttributes = await ProductAttributes.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedAttributes) {
      return res.status(404).json({
        message: "Product attribute not found",
        success: false
      });
    }

    return res.status(200).json({
      message: 'Updated successfully',
      success: true,
      data: updatedAttributes
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};


const deleteProductAttributes = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProductAttributes = await ProductAttributes.findByIdAndDelete(id);

    if (!deletedProductAttributes) {
      return res.status(404).json({
        message: 'Product attribute not found',
        success: false
      });
    }

    return res.status(200).json({
      message: 'Product attribute deleted successfully',
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

const addSizeOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { options } = req.body;

    const attributes = await ProductAttributes.findById(id);

    if (!attributes) {
      return res.status(404).json({
        message: 'Product attributes not found',
        success: false
      });
    }

    await attributes.addSizeOption(options);
    
    return res.status(200).json({
      message: "Product size added successfully",
      success: true,
      data: attributes
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message
    });
  }
};

const addColorOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value } = req.body;

    const attributes = await ProductAttributes.findById(id);
    if (!attributes) {
      return res.status(404).json({ 
        message: 'Product attributes not found',
        success: false
      });
    }

    await attributes.addColorOption({ name, value });
    
    return res.status(200).json({
      message: "Color option added successfully",
      success: true,
      data: attributes
    });
  } catch (error) {
    return res.status(400).json({ 
      message: error.message,
      success: false
    });
  }
};

const updateProductPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { priceType, newPrice } = req.body;

    const attributes = await ProductAttributes.findById(id);
    if (!attributes) {
      return res.status(404).json({ 
        message: 'Product attributes not found',
        success: false
      });
    }

    await attributes.updatePrice(priceType, newPrice);
    
    return res.status(200).json({
      message: "Price updated successfully",
      success: true,
      data: attributes
    });
  } catch (error) {
    return res.status(400).json({ 
      message: error.message,
      success: false
    });
  }
};

const getDiscountPercentage = async (req, res) => {
  try {
    const { id } = req.params;

    const attributes = await ProductAttributes.findById(id);
    if (!attributes) {
      return res.status(404).json({ 
        message: 'Product attributes not found',
        success: false
      });
    }

    const discount = attributes.getDiscountPercentage();
    
    return res.status(200).json({ 
      message: "Discount percentage calculated successfully",
      success: true,
      data: {
        discountPercentage: discount
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      message: error.message,
      success: false
    });
  }
};

const getProductStockInfo = async (req, res) => {
  try {
    const { name, sku } = req.query;

    if (!name || !sku) {
      return res.status(400).json({
        success: false,
        message: 'Name and SKU are required'
      });
    }

    const stockProduct = await ProductAttributes.aggregate([
      {
        $match: {
          name: name,
          sku: sku
        }
      },
      {
        $lookup: {
          from: "stocks", // Adjust collection name as per your schema
          localField: "_id",
          foreignField: "productId",
          as: "stockEntries"
        }
      },
      {
        $lookup: {
          from: "unstocks", // Adjust collection name as per your schema
          localField: "_id",
          foreignField: "productId", 
          as: "unstockEntries"
        }
      },
      {
        $addFields: {
          totalStockIn: {
            $sum: "$stockEntries.quantity"
          },
          totalStockOut: {
            $sum: "$unstockEntries.quantity"
          },
          currentStock: {
            $subtract: [
              { $sum: "$stockEntries.quantity" },
              { $sum: "$unstockEntries.quantity" }
            ]
          },
          isInStock: {
            $cond: {
              if: { 
                $gt: [
                  { 
                    $subtract: [
                      { $sum: "$stockEntries.quantity" },
                      { $sum: "$unstockEntries.quantity" }
                    ]
                  }, 
                  0
                ]
              },
              then: true,
              else: false
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          sku: 1,
          totalStockIn: 1,
          totalStockOut: 1,
          currentStock: 1,
          isInStock: 1,
          coverImage: 1,
          distributorPrice: 1,
          mrpPrice: 1,
          salePrice: 1
        }
      }
    ]);

    if (!stockProduct?.length) {
      return res.status(404).json({
        success: false,
        message: "Product does not exist"
      });
    }

    return res.status(200).json(
      new ApiResponse(200, stockProduct[0], "Product stock information fetched successfully")
    );

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};





const updateProductStock = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { stock, note, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const product = await ProductAttributes.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const oldStock = product.stock;
    const numericStock = parseInt(stock);

    if (isNaN(numericStock)) {
      return res.status(400).json({ success: false, message: "Invalid stock quantity" });
    }

    let newStock;
    let operationType = type;
    let quantityChange = 0;

    if (type === 'in') {
      newStock = oldStock + numericStock;
      quantityChange = numericStock;
    } else if (type === 'out') {
      if (oldStock < numericStock) {
        return res.status(400).json({ success: false, message: "Insufficient stock available" });
      }
      newStock = oldStock - numericStock;
      quantityChange = numericStock;
    } else {
      newStock = numericStock;
      quantityChange = Math.abs(newStock - oldStock);
      operationType = newStock > oldStock ? 'in' : 'out';
    }

    product.stock = newStock;
    await product.save();

    if (quantityChange > 0) {
      await StockHistory.create({
        productId,
        type: operationType,
        quantity: quantityChange,
        reason: 'manual adjustment',
        note: note || `Stock ${operationType} of ${quantityChange}`,
        createdBy: req.user?.id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully',
      data: {
        productId,
        oldStock,
        newStock,
        type: operationType,
        quantity: quantityChange
      }
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const history = await StockHistory.paginate(
      { id },
      options
    );

    return res.status(200).json({
      success: true,
      message: 'Stock history fetched',
      data: history
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getAllStockHistory = async (req, res) => {
  try {
    
    const { page = 1, limit = 10 } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'productId',
        select: 'name sku coverImage'
      }
    };

    const history = await StockHistory.paginate({}, options);

    return res.status(200).json({
      success: true,
      message: 'All stock history fetched successfully',
      data: history
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};


const updateStockCommon = async (product, newStock, adminId = null) => {
  const oldStock = product.stock;
  const difference = newStock - oldStock;

  // 🛑 Ignore if no stock change
  if (difference === 0) return product;

  // ✅ Update product stock
  const updatedProduct = await ProductAttributes.findByIdAndUpdate(
    product._id,
    { stock: newStock },
    { new: true, runValidators: true }
  );

  // ✅ Log in StockHistory
  await StockHistory.create({
    productId: product._id,
    type: difference > 0 ? "in" : "out",
    quantity: Math.abs(difference),
    reason: "manual adjustment",
    note: `Stock updated from ${oldStock} to ${newStock}`,
    // ✅ Use fallback admin ID if not present
    createdBy: adminId || new mongoose.Types.ObjectId('665d5ffda7cb73d6b0f78117')
  });

  return updatedProduct;
};


const updateProductStockById = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  const adminId = req.user?._id; // Make sure auth middleware sets this

  const product = await ProductAttributes.findById(id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const updated = await updateStockCommon(product, stock, adminId);
  return res.status(200).json({ success: true, message: "Stock updated", data: updated });
};

// ✅ Update by SKU
const updateStockBySKU = async (req, res) => {
  const { sku } = req.params;
  const { stock } = req.body;
  const adminId = req.user?._id;

  const product = await ProductAttributes.findOne({ sku });
  if (!product) return res.status(404).json({ success: false, message: "SKU not found" });

  const updated = await updateStockCommon(product, stock, adminId);
  return res.status(200).json({ success: true, message: "Stock updated", data: updated });
};

// ✅ Update by Name
const updateStockByName = async (req, res) => {
  const { name } = req.params;
  const { stock } = req.body;
  const adminId = req.user?._id;

  const product = await ProductAttributes.findOne({ name });
  if (!product) return res.status(404).json({ success: false, message: "Product name not found" });

  const updated = await updateStockCommon(product, stock, adminId);
  return res.status(200).json({ success: true, message: "Stock updated", data: updated });
};

export {
  createProductAttributes,
  updateProductStockById,
  updateStockBySKU,
  updateStockByName,
  getAllProductAttributes,
  getProductAttributesBySku,
  updateProductAttributes,
  deleteProductAttributes,
  addSizeOption,
  addColorOption,
  updateProductPrice,
  getDiscountPercentage,
  getProductStockInfo,
  updateProductStock,
  getStockHistory,
  getAllStockHistory
};