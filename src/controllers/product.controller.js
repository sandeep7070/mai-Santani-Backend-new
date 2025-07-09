import { Product } from '../models/product.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';


const createProduct = async (req, res) => {
  try {
    const {
      name,
      productcode,
      sku,
      price,
      saleprice,
      stock,
      title,
      description,
      youtubeLink,
      category,
      tags,
      status
    } = req.body;

    if (!name || !price || !stock || !description || !category || !status) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Required fields: name, price, stock, description, category, status"
      });
    }

    let productImageUrl = '';
    let coverImageUrl = '';
    let benefitImagesUrls = [];

    if (req.file) {
      const cloudinaryResponse = await uploadOnCloudinary(req.file);
      productImageUrl = cloudinaryResponse?.url || '';
    }

    if (req.files) {
      if (req.files.productImage) {
        const response = await uploadOnCloudinary(req.files.productImage[0]);
        productImageUrl = response?.url || '';
      }
      if (req.files.coverImage) {
        const response = await uploadOnCloudinary(req.files.coverImage[0]);
        coverImageUrl = response?.url || '';
      }
      if (req.files.benefitImages) {
        for (let file of req.files.benefitImages) {
          const response = await uploadOnCloudinary(file);
          if (response?.url) {
            benefitImagesUrls.push(response.url);
          }
        }
      }
    }

    // 🏷️ Parse tags (optional)
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // ✅ Create new product document
    const newProduct = await Product.create({
      name,
      productcode,
      sku,
      price: parseFloat(price),
      saleprice: saleprice ? parseFloat(saleprice) : undefined,
      stock: parseInt(stock),
      title,
      description,
      youtubeLink,
      productImage: productImageUrl,
      coverImage: coverImageUrl,
      benefitImages: benefitImagesUrls,
      category,
      tags: parsedTags,
      status: status || 'active'
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully!",
      data: newProduct
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message
    });
  }
};


// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            category, 
            status, 
            minPrice, 
            maxPrice,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            color,
            size,
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { productcode: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },

                  { color: { $regex: search, $options: 'i' } },
                { size: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        if (status) {
            filter.status = status;
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        return res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalProducts,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error retrieving products",
            error: error.message
        });
    }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product retrieved successfully",
            data: product
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error retrieving product",
            error: error.message
        });
    }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle file uploads for update
        if (req.file) {
            const cloudinaryResponse = await uploadOnCloudinary(req.file);
            updateData.productImage = cloudinaryResponse?.url || '';
        }

        if (req.files) {
            if (req.files.productImage) {
                const response = await uploadOnCloudinary(req.files.productImage[0]);
                updateData.productImage = response?.url || '';
            }
            if (req.files.coverImage) {
                const response = await uploadOnCloudinary(req.files.coverImage[0]);
                updateData.coverImage = response?.url || '';
            }
            if (req.files.benefitImages) {
                const benefitImagesUrls = [];
                for (let file of req.files.benefitImages) {
                    const response = await uploadOnCloudinary(file);
                    if (response?.url) {
                        benefitImagesUrls.push(response.url);
                    }
                }
                updateData.benefitImages = benefitImagesUrls;
            }
        }

        // Parse attributes if it's a string
        if (updateData.attributes && typeof updateData.attributes === 'string') {
            try {
                updateData.attributes = JSON.parse(updateData.attributes);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid attributes format"
                });
            }
        }

        // Parse tags if it's a string
        if (updateData.tags && typeof updateData.tags === 'string') {
            try {
                updateData.tags = JSON.parse(updateData.tags);
            } catch (error) {
                updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
            }
        }

        // Convert numeric fields
        if (updateData.price) updateData.price = parseFloat(updateData.price);
        if (updateData.saleprice) updateData.saleprice = parseFloat(updateData.saleprice);
        if (updateData.stock) updateData.stock = parseInt(updateData.stock);

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });

    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error updating product",
            error: error.message
        });
    }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: deletedProduct
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting product",
            error: error.message
        });
    }
};

// BULK DELETE PRODUCTS
const bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of product IDs"
            });
        }

        const result = await Product.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} products deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting products",
            error: error.message
        });
    }
};

// GET PRODUCTS BY CATEGORY
const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find({ 
            category: { $regex: category, $options: 'i' } 
        })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

        const totalProducts = await Product.countDocuments({ 
            category: { $regex: category, $options: 'i' } 
        });

        return res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            data: {
                products,
                totalProducts,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalProducts / parseInt(limit))
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error retrieving products",
            error: error.message
        });
    }
};

export { 
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    getProductsByCategory
};