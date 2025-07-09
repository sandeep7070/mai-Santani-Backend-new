import { body, param } from 'express-validator';
import ProductAttributes from '../models/attribute.model.js';

export const validateProductAttributes = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  
  body('sku').trim().notEmpty().withMessage('SKU is required')
    .isUppercase().withMessage('SKU must be uppercase')
    .matches(/^[A-Z0-9-]+$/).withMessage('SKU can only contain letters, numbers, and hyphens')
    .custom(async (value) => {
      const exists = await ProductAttributes.findOne({ sku: value });
      if (exists) throw new Error('SKU already exists');
    }),
  
  body('distributorPrice').isFloat({ min: 0 }).withMessage('Distributor price must be a positive number'),
  body('mrpPrice').isFloat({ min: 0 }).withMessage('MRP price must be a positive number'),
  body('salePrice').isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  
  body('size').isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']).withMessage('Invalid size'),
  body('color').trim().notEmpty().withMessage('Color is required'),
  body('material').trim().notEmpty().withMessage('Material is required'),
  body('fittype').isIn(['Regular', 'Slim', 'Oversized', 'Relaxed', 'Skinny']).withMessage('Invalid fit type'),
  body('sleevetype').isIn(['Full', 'Half', 'Short', 'Sleeveless', 'Three-Quarter']).withMessage('Invalid sleeve type'),
  body('neckstyle').isIn(['Round', 'V-Neck', 'Polo', 'Turtle', 'Hooded', 'Crew']).withMessage('Invalid neck style'),
  body('pattern').isIn(['Solid', 'Striped', 'Printed', 'Checked', 'Floral', 'Geometric']).withMessage('Invalid pattern'),
  
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a positive integer')
];

export const validatePriceUpdate = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('priceType').isIn(['distributorPrice', 'salePrice', 'mrpPrice']).withMessage('Invalid price type'),
  body('value').isFloat({ min: 0 }).withMessage('Price must be a positive number')
];

export const validateStockUpdate = [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('operation').isIn(['add', 'subtract']).withMessage("Operation must be 'add' or 'subtract'"),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
];