import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './src/db/index.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
   
const allowedOrigins = [
    "http://localhost:5173",

    "http://localhost:5174",
    "https://testing-e-comm.vercel.app",
    "https://sandeep-testing.vercel.app",
    "https://mai-santani.vercel.app"
    // "http://localhost:3000",
//     "https://papaya-scone-5da1a9.netlify.app",
//     "https://regal-pika-ea7151.netlify.app",
//    "https://eloquent-treacle-df9187.netlify.app",
//    "https://e-commerce-frntend-dz.vercel.app"
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(cookieParser());

// Critical JSON middleware - must come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Database connection
connectDB();

// Import routes
import attributeRoutes from './src/routes/attributes.routes.js';
import historyRouters from './src/routes/history.router.js';
import  orderRouter  from './src/routes/order.routes.js';
import userRouter   from './src/routes/user.routes.js';


try {
    const adminRouter = await import('./src/routes/admin.routes.js');
    const productRouter = await import('./src/routes/product.routes.js');
    const paymentRouter = await import('./src/routes/payment.routes.js');

    app.use("/admin", adminRouter.default);
    app.use('/product', productRouter.default);
    app.use('/payment', paymentRouter.default);
    app.use('/attributes', attributeRoutes); // Attributes routes
    app.use('/historyStock', historyRouters);
    app.use('/orders', orderRouter);
    app.use('/user', userRouter);
} catch (error) {
    console.error('Error loading routes:', error.message);
    process.exit(1);
}

io.on("connection", (socket) => {
    console.log("New client connected");
    // ... (socket.io logic remains unchanged)
});

app.set("io", io);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Running on http://localhost:${PORT}`);
});