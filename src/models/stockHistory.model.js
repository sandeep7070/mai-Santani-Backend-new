// models/stockHistory.model.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2'; // Import pagination plugin

const stockHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductAttributes'
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  quantity: {
    type: Number,
    required: true, // Add required
    min: 1
  },
  reason: String,
  
  note: String,

   createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', // Ensure this matches your User model name
    required: false
  }
}, { timestamps: true }); // Add timestamps

// Apply pagination plugin
stockHistorySchema.plugin(mongoosePaginate);

export const StockHistory = mongoose.model('StockHistory', stockHistorySchema);