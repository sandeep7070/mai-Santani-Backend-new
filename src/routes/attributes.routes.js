
import Router from 'express'
import {

       createProductAttributes,
       deleteProductAttributes,
        getAllProductAttributes,
         getDiscountPercentage, 
     
          updateProductAttributes,
           updateProductPrice,
           updateProductStock,
           updateProductStockById,
           updateStockByName,
           updateStockBySKU
         } from '../controllers/attributes.controller.js';
import upload from '../middleware/multer.middleware.js';

const router = Router()

router.post('/create', upload.single('coverImage'), createProductAttributes);



router.get('/getAllAttributes', getAllProductAttributes);

router.put('/:id/stock', updateProductStock); 

router.put('/:id/stock', updateProductStockById);

router.put('/sku/:sku/stock', updateStockBySKU);

router.put('/name/:name/stock', updateStockByName);

// Update product with multiple image types

router.put('/update/:id', updateProductAttributes);


router.delete('/delete/:id', deleteProductAttributes);

router.patch('/prices/:id', updateProductPrice);

router.get('/:id/discount', getDiscountPercentage);

export default router;