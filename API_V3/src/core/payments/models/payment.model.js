// core/payments/models/Payment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
    // Índice manejado por los índices compuestos
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    sparse: true
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['order_payment', 'subscription', 'refund'],
    required: true
  },
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'cash', 'transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'verified', 'rejected', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    sparse: true
  },
  proofImage: {
    fileName: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    url: String
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  verificationDate: {
    type: Date,
    sparse: true
  },
  rejectionReason: {
    type: String,
    sparse: true
  },
  notes: {
    type: String,
    trim: true
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Índices
paymentSchema.index({ tenant: 1, createdAt: -1 });
paymentSchema.index({ tenant: 1, status: 1 });
paymentSchema.index({ tenant: 1, type: 1 });
paymentSchema.index({ tenant: 1, order: 1 }, { sparse: true });
paymentSchema.index({ transactionId: 1 }, { sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;