const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: { 
    type: String, 
    enum: ['manual', 'paypal', 'binance', 'stripe'], 
    required: true 
  },
  currency: {
    type: String,
    enum: ['USD', 'USDT', 'VES'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  config: { type: mongoose.Schema.Types.Mixed }, // Configuración específica
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);