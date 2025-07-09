import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({  

  name: { 
    type: String, 

  },
  productcode: { 
    type: String,
  },
  sku: { 
    type: String,
  },

  // Pricing
  price: { 
    type: Number, 
  },

  saleprice: { 
    type: Number,
 
  },

  // Stock
  stock: { 
    type: Number, 
  
 
  },

  // Description and Title
  title: { 
    type: String, 
   
  },
  description: { 
    type: String, 
  
  },

  // Images
  coverImage: { 
    type: String 
  },
  productImage: { 
    type: String 
  },
  benefitImages: [String], // multiple images for benefits
  
  

  // YouTube link 
  youtubeLink: { 
    type: String 
  },

  
  status: {
    type: String,
    enum: ['active', 'inactive', 'out-of-stock'],
    default: 'active'
  },
  category: {
    type: String,
    
  },
  tags: [String]
}, { 
  timestamps: true 
});

// Indexes for better performance
ProductSchema.index({ name: 1 });
ProductSchema.index({ productcode: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ status: 1 });

export const Product = mongoose.model("Product", ProductSchema);