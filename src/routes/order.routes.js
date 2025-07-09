import  Router from 'express';
import { createOrder, deleteOrder, generateInvoicePDF, getOrderById, getOrders, getOrdersByCustomer, updateOrder, updateOrderStatus } from '../controllers/order.controller.js';


const router = Router();

// Order routes
router.post('/create', createOrder);

router.get('/getAllOrders', getOrders);

router.get('/getById/:id', getOrderById);

router.put('/update/:id', updateOrder);

router.delete('/delete/:id', deleteOrder);

router.delete('/bulk/delete', deleteOrder);

router.get('/customer/:customerId', getOrdersByCustomer);

router.patch('/:id/status', updateOrderStatus);

//  order status   download 

// GET /api/orders/:id/receipt
router.post('/generate', generateInvoicePDF);

// routes/orderRoutes.js



export default router;