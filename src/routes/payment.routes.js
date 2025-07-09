import express from 'express';
import { 
    createPaymentIntent, 
    handleWebhook, 
    getPaymentHistory 
} from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create', createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/history/:userId', getPaymentHistory);

export default router;