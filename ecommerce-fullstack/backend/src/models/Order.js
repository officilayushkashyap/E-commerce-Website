const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  paymentMethod: String,
  orderStatus: { type: String, default: 'pending' },
  subtotal: Number,
  totalAmount: Number,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
