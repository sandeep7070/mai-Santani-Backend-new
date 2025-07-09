import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    status: {
        type: String,
        required: true
    },
    gateway: {
        type: String,
        required: true
    },
    gatewayPaymentId: {
        type: String,
        required: true
    },
    paymentMethod: String
}, {
    timestamps: true 
});

export const Payment = mongoose.model("Payment", PaymentSchema); 