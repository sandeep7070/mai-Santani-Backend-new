import mongoose from 'mongoose';
import { StockHistory } from '../models/stockHistory.model.js';
import ProductAttributes from '../models/attribute.model.js';

const createStockHistory = async (req, res) => {
  try {
    const { productId, type, quantity, reason, note } = req.body;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'in' or 'out'"
      });
    }

    const newRecord = await StockHistory.create({
      productId,
      type,
      quantity,
      reason,
      note,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Stock history record created successfully',
      data: newRecord
    });

  } catch (error) {
    console.error('Error creating stock history:', error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getStockHistory = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'productId', select: 'name sku' },
        { path: 'createdBy', select: 'name email' }
      ]
    };

    const history = await StockHistory.paginate({ productId }, options);

    // Enhance with stock calculations
    const enhancedDocs = history.docs.map(doc => {
      const docObj = doc.toObject();
      let oldStock, newStock;
      
      if (doc.type === 'in') {
        oldStock = (docObj.newStock || doc.productId?.stock || 0) - doc.quantity;
        newStock = docObj.newStock || doc.productId?.stock || 0;
      } else {
        oldStock = (docObj.newStock || doc.productId?.stock || 0) + doc.quantity;
        newStock = docObj.newStock || doc.productId?.stock || 0;
      }

      return {
        ...docObj,
        oldStock,
        newStock,
        productName: doc.productId?.name || 'Deleted Product'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        ...history,
        docs: enhancedDocs
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



const updateProductStock = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { stock, note, type } = req.body;

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    if (stock === undefined || stock === null || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        message: "Valid stock number is required"
      });
    }

    const numericStock = parseInt(stock);

    if (type && !['in', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'in' or 'out'"
      });
    }

    const product = await ProductAttributes.findById(productId); // Fixed: changed 'id' to 'productId'
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        productId: productId
      });
    }

    const oldStock = product.stock;
    let newStock;
    let quantityChange = 0;
    let operationType;

    if (type) {
      if (type === 'out' && product.stock < numericStock) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock available"
        });
      }
      
      operationType = type;
      quantityChange = numericStock;
      newStock = type === 'in' 
        ? product.stock + numericStock 
        : product.stock - numericStock;
    } else {
      newStock = numericStock;
      const difference = newStock - oldStock;
      
      if (difference !== 0) {
        quantityChange = Math.abs(difference);
        operationType = difference > 0 ? 'in' : 'out';
      }
    }

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative"
      });
    }

    product.stock = newStock;
    await product.save();

    const responseData = {
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        unstock: product.unstock
      },
      stockChange: null
    };

    if (quantityChange > 0) {
      await StockHistory.create({
        productId: productId, // Fixed: changed 'id' to 'productId'
        type: operationType,
        quantity: quantityChange,
        reason: type ? 'manual adjustment' : 'stock update',
        note: note || (type 
          ? `Stock ${operationType} of ${quantityChange}`
          : `Stock updated from ${oldStock} to ${newStock}`),
        createdBy: req.user?.id
      });

      responseData.stockChange = {
        oldStock,
        newStock,
        quantity: quantityChange,
        type: operationType
      };
    }

    return res.status(200).json({
      success: true,
      message: quantityChange > 0 
        ? 'Product stock updated successfully' 
        : 'Product stock unchanged',
      data: responseData
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




 const getStockSummary = async (req, res) => {
  try {
    const summary = await StockHistory.aggregate([
      {
        $group: {
          _id: "$productId",
          totalIn: {
            $sum: {
              $cond: [{ $eq: ["$type", "in"] }, "$quantity", 0]
            }
          },
          totalOut: {
            $sum: {
              $cond: [{ $eq: ["$type", "out"] }, "$quantity", 0]
            }
          },
          lastUpdated: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "productattributes",  // attributes model ka actual MongoDB collection name
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          productName: "$product.name",
          sku: "$product.sku",
          totalIn: 1,
          totalOut: 1,
          currentStock: "$product.stock",
          lastUpdated: 1
        }
      },
      { $sort: { lastUpdated: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error("Error in getStockSummary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get stock summary",
      error: error.message
    });
  }
};





export { createStockHistory,getStockSummary, getStockHistory, updateProductStock };