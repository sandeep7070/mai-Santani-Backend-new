import mongoose from 'mongoose';


const orderHistorySchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    // required: true,
   
  },
  orderDate: {
    type: Date,
    // required: true,
    default: Date.now
  },

  // Order Status Tracking
  statusHistory: [{
    status: {
      type: String,
      // required: true,
      enum: ['Order Received', 'Processing', 'Order Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  currentStatus: {
    type: String,
    // required: true,
    enum: ['Order Received', 'Processing', 'Order Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Order Received'
  },

  // Customer Information
  customer: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    contact: {
      type: String,
      required: true
    },
    shippingAddress: {
      street : {
        type: String
      },

      city:{
        type: String
      },
      state: {
        type: String
      },

      zipCode:{
        type: String
      },
      country: {
        type: String,
        default: 'india'
      }
    }
  },

  // Order Items
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      // required: true,
      min: 0
    },
    quantity: {
      type: Number,
      // required: true,
      min: 1
    },
    subtotal: {
      type: Number,
      // required: true,
      min: 0
    },
      productImage: { 
    type: String 
  },
  }],

  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    code: String
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment Information
  payment: {
    status: {
      type: String,
      // required: true,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded', 'Cancelled'],
      default: 'Pending'
    },
    method: {
      type: String,
      // required: true,
enum: ['credit_card', 'Debit Card', 'RazarPay', 'Bank Transfer', 'UPI', 'Cash on Delivery', 'Net Banking']
    },
    transactionId: String,
    paymentDate: Date
  },

  // Shipping Information
  shipping: {
    method: {
      type: String,
      enum: ['Standard', 'Express', 'Overnight', 'Free'],
      default: 'Standard'
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },

  // System Metadata
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Pre-save hooks
orderHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-add to status history when status changes
  if (this.isModified('currentStatus')) {
    this.statusHistory.push({
      status: this.currentStatus,
      notes: `Status updated to ${this.currentStatus}`
    });
  }
  
  next();
});

// Virtuals
orderHistorySchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

orderHistorySchema.virtual('formattedTotal').get(function() {
  return `$${this.totalAmount.toFixed(2)}`;
});

orderHistorySchema.virtual('customer.fullAddress').get(function() {
  const addr = this.customer.shippingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Statics
orderHistorySchema.statics.getFilteredOrders = async function(filters = {}) {
  const query = {};
  
  // Date filter
  if (filters.startDate || filters.endDate) {
    query.orderDate = {};
    if (filters.startDate) query.orderDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.orderDate.$lte = new Date(filters.endDate);
  }
  
  // Status filters
  if (filters.status) query['currentStatus'] = filters.status;
  if (filters.paymentStatus) query['payment.status'] = filters.paymentStatus;
  
  // Search filter
  if (filters.search) {
    query.$or = [
      { orderNumber: { $regex: filters.search, $options: 'i' } },
      { 'customer.name': { $regex: filters.search, $options: 'i' } },
      { 'customer.email': { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .sort({ orderDate: -1 })
    .limit(filters.limit || 20)
    .skip(filters.skip || 0)
    .populate('customer.id', 'name email')
    .populate('items.productId', 'name price');
};

// Indexes
orderHistorySchema.index({ orderNumber: 1 });
orderHistorySchema.index({ orderDate: -1 });
orderHistorySchema.index({ 'customer.id': 1 });
orderHistorySchema.index({ 'currentStatus': 1 });
orderHistorySchema.index({ 'payment.status': 1 });
orderHistorySchema.index({ 
  orderDate: -1, 
  'currentStatus': 1,
  'payment.status': 1 
});

export const Order = mongoose.model('OrderHistory', orderHistorySchema);
