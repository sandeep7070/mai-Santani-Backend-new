import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';

const AttributesSchema = new mongoose.Schema({
  name: {
    type: String,
  },

  sku: {
    type: String,
  },

  distributorPrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.salePrice;
      },
      message: 'Distributor price cannot be higher than sale price'
    }
  },

  mrpPrice: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },

  salePrice: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.mrpPrice;
      },
      message: 'Sale price cannot be higher than MRP price'
    }
  },

  coverImage: {
    type: String,
    required: false
  },

  size: {
    type: String,
  },

  color: {
    type: String,

  },

  material: {
    type: String,
 
  },

  fittype: {
    type: String,
  },

  sleevetype: {
    type: String,
  },

  neckstyle: {
    type: String,
  },

  pattern: {
    type: String,
  },

  //  Stock Field
  stock: {
    type: Number,
    min: [0, 'Stock cannot be negative'],
    default: 0
  },


  unstock: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//  Pre-save hook to auto-set unstock based on stock
AttributesSchema.pre('save', function (next) {
  this.unstock = this.stock <= 0;
  next();
});

//  Virtual for formatted prices
AttributesSchema.virtual('formattedPrices').get(function () {
  return {
    distributor: `₹${this.distributorPrice?.toFixed(2) || '0.00'}`,
    mrp: `₹${this.mrpPrice?.toFixed(2) || '0.00'}`,
    sale: `₹${this.salePrice?.toFixed(2) || '0.00'}`,
    discount: `${this.getDiscountPercentage()}%`
  };
});

//  Virtual for stock status
AttributesSchema.virtual('stockStatus').get(function () {
  return this.stock > 0 ? 'In Stock' : 'Out of Stock';
});

//  Method to calculate discount %
AttributesSchema.methods.getDiscountPercentage = function () {
  if (this.mrpPrice && this.salePrice) {
    return Math.round(((this.mrpPrice - this.salePrice) / this.mrpPrice) * 100);
  }
  return 0;
};

// Pagination plugin
AttributesSchema.plugin(mongoosePaginate);

export default mongoose.model('ProductAttributes', AttributesSchema);
