// controllers/orderController.js
import {Order} from '../models/order.model.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';


const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Set current status if not provided
    if (!orderData.currentStatus) {
      orderData.currentStatus = 'Order Received';
    }
    
    const order = new Order(orderData); // Changed from OrderHistory to Order
    const savedOrder = await order.save();
    
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error creating order',
      error: error.message 
    });
  }
};


// controllers/pdfController.js

const generateInvoicePDF = async (req, res) => {
  try {
    const { order } = req.body;

    if (!order) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    // Create a PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber || order._id}.pdf`);

    // Pipe PDF directly to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    
    // Add order details
    doc.fontSize(12)
       .text(`Order Number: ${order.orderNumber}`)
       .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
       .moveDown();
    
    // Add customer information
    doc.text('Customer Information:', { underline: true });
    doc.text(`Name: ${order.customer.name}`);
    doc.text(`Email: ${order.customer.email}`);
    doc.moveDown();
    
    // Add items table
    doc.text('Items:', { underline: true });
    order.items.forEach(item => {
      doc.text(`${item.name} - ${item.quantity} x $${item.price} = $${(item.quantity * item.price).toFixed(2)}`);
    });
    doc.moveDown();
    
    // Add totals
    doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`);
    doc.text(`Shipping: $${order.shippingCost.toFixed(2)}`);
    doc.text(`Total: $${order.totalAmount.toFixed(2)}`, { bold: true });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};


const getOrders = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      search: req.query.search,
      limit: parseInt(req.query.limit),
      skip: parseInt(req.query.skip)
    };
    
    const orders = await Order.getFilteredOrders(filters); // Changed from OrderHistory to Order
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
};



 const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer.id', 'name email')
      .populate('items.productId', 'name price image color');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      message: 'Error fetching order',
      error: error.message 
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Prevent certain fields from being updated
    delete updateData.orderNumber;
    delete updateData.orderDate;
    delete updateData.createdAt;
    
    const updatedOrder = await Order.findByIdAndUpdate( // Changed from OrderHistory to Order
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error updating order',
      error: error.message 
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const order = await Order.findById(id); // Changed from OrderHistory to Order
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update status and add to history
    order.currentStatus = status;
    order.statusHistory.push({ status, notes: notes || `Status updated to ${status}` });
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error updating status',
      error: error.message 
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id); // Changed from OrderHistory to Order
    
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting order',
      error: error.message 
    });
  }
};

const getOrdersByCustomer = async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.id': req.params.customerId }) // Changed from OrderHistory to Order
      .sort({ orderDate: -1 })
      .populate('items.productId', 'name');
        
    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching customer orders',
      error: error.message 
    });
  }
};

export {
  createOrder,
  generateInvoicePDF,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByCustomer
};