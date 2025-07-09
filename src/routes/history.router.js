import { Router } from "express";
import { getStockHistory, updateProductStock, getStockSummary } from '../controllers/history.controller.js';

const router = Router();

// ✅ Add this above dynamic route
router.get('/summary', getStockSummary);

// Get stock history for a product
router.get('/:id/history', getStockHistory);

// Update product stock
router.put('/:id/stock', updateProductStock);

export default router;
