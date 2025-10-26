require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(mongoSanitize());
app.use(morgan('dev'));

// Models
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// Simple Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth Routes
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, isEmailVerified: true });
    res.status(201).json({ success: true, message: 'User registered' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Auth Middleware
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(404).json({ message: 'Product not found' });
  }
});

// Cart Routes
app.get('/api/cart', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    res.json({ success: true, data: cart || { items: [] } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/cart/items', protect, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });
    
    const existingItem = cart.items.find(i => i.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    await cart.save();
    await cart.populate('items.productId');
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/cart/items/:productId', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
      await cart.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Order Routes
app.post('/api/orders', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity
    }));
    
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const order = await Order.create({
      orderNumber: 'ORD' + Date.now(),
      userId: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      totalAmount: subtotal
    });
    
    cart.items = [];
    await cart.save();
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
