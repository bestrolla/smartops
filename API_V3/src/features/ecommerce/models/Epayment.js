const mongoose = require('mongoose');

const epaymentSchema = new mongoose.Schema({
  tenantId: { 
    type: String, 
    required: true,
    index: true 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { 
    type: String, 
    enum: ['card', 'paypal', 'transfer', 'cash'], 
    required: true 
  },
  paymentIntentId: String, // ID de Stripe/PayPal
  status: { 
    type: String, 
    enum: ['requires_payment_method', 'requires_confirmation', 'processing', 'succeeded', 'canceled', 'failed'],
    default: 'requires_payment_method'
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Índices para búsquedas frecuentes
epaymentSchema.index({ tenantId: 1, status: 1 });
epaymentSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Epayment', epaymentSchema);