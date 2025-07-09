const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
  variantName: String, // e.g. "Black S"
  variantValues: [{ type: String }], // e.g. ["Black", "S"]
  images: [String],
  mrp: Number,
  price: Number,
  salePrice: Number,
  sku: String,


  openingStock: { type: Number, default: 0 },
  // currentStock: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 5 },

  maximumStock: { type: Number, default: 1000 },

  reorderLevel: { type: Number, default: 10 },
  status: { type: Boolean, default: true }
  
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: String,
  images: [String],
  sku: String,
  price: Number,
  mrpPrice: Number,
  salePrice: Number,
  unit: String,
  gst: { type: Number, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'subcategory' },
  descriptionShort: String,
  descriptionLong: String,
  slug: String,
  status: { type: Boolean, default: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'brand' },
  variants: [productVariantSchema],
    deletedAt: { type: Date, default: null },

  productBenefits: [{ images: [String] }], // Multiple images for benefits
  productFeatures: [{
    title: String,
    description: String,
    image: String
  }],
  productVideos: [{ link: String }]
}, { timestamps: true });

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

productSchema.set('toObject', { virtuals: true });
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);