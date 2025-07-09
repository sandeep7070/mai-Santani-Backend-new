import { Router } from 'express';
import { bulkDeleteProducts, createProduct, deleteProduct, getAllProducts, getProductById, getProductsByCategory, updateProduct,  } from '../controllers/product.controller.js';
import { uploadConfigs, handleMulterError } from '../middleware/multer.middleware.js';

const router = Router();

router.post('/create', 
    uploadConfigs.productImages,
    handleMulterError,
    createProduct
);
// Alternative: Create product with single image only
router.post('/create-single', 
    uploadConfigs.singleProductImage,
    handleMulterError,
    createProduct
);
// Alternative: Create product with multiple benefit images only
router.post('/create-benefits', 
    uploadConfigs.multipleBenefitImages,
    handleMulterError,
    createProduct
);

// Update product with multiple image types
router.put('/:id', 
    uploadConfigs.productImages,
    handleMulterError,
    updateProduct
);

// Update product with single image only
router.put('/:id/single-image', 
    uploadConfigs.singleProductImage,
    handleMulterError,
    updateProduct
);

// Update product with multiple benefit images only
router.put('/:id/benefit-images', 
    uploadConfigs.multipleBenefitImages,
    handleMulterError,
    updateProduct
);

// Partial update (PATCH) with images
router.patch('/:id', 
    uploadConfigs.productImages,
    handleMulterError,
    updateProduct
);

router.post('/create', createProduct);

router.get('/getAllProduct', getAllProducts);

router.get('/product/:id', getProductById);   // single prodduct/by:id 

router.put('/update/:id', updateProduct);

router.delete('/delete/:id', deleteProduct);   // delete/by:id

router.delete('/bulk/delete', bulkDeleteProducts);

router.get('/category/:category', getProductsByCategory);

export default router;