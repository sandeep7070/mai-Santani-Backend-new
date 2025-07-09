import Stripe from 'stripe';
import { Order } from '../models/order.model.js';
import { Payment } from '../models/payment.models.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
    const { amount, currency, items, userId, billingDetails } = req.body;

    if (!amount || !currency || !items || !userId || !billingDetails) {
        return res.status(400).json({
            status: 400,
            success: false,
            message: 'All required fields must be provided'
        });
    }

    try {
        const order = new Order({
            userId,
            amount,
            currency,
            items,
            billingDetails,
            status: 'pending'
        });

        await order.save();

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: currency || 'usd',
            metadata: { 
                orderId: order._id.toString()
            }
        });

        return res.status(201).json({
            status: 201,
            success: true,
            clientSecret: paymentIntent.client_secret,
            orderId: order._id,
            message: "Payment intent created successfully"
        });

    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server Error",
            error: error.message
        });
    }
};

export const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook error:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        try {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            await Order.findByIdAndUpdate(orderId, {
                status: 'completed',
                paymentIntentId: paymentIntent.id,
                paymentGateway: 'stripe'
            });

            const order = await Order.findById(orderId);
            
            const payment = new Payment({
                orderId,
                userId: order.userId,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: 'completed',
                gateway: 'stripe',
                gatewayPaymentId: paymentIntent.id,
                paymentMethod: paymentIntent.payment_method_types?.[0] || 'card'
            });
            await payment.save();

            console.log(`Payment succeeded for order ${orderId}`);
        } catch (error) {
            console.error('Error processing webhook:', error);
        }
    }

    res.json({ received: true });
};

export const getPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
        
        res.status(200).json({
            status: 200,
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({
            status: 500,
            success: false,
            message: "Error fetching payment history",
            error: error.message
        });
    }
};