const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  tenant_id: {
    type: String,
    required: true,
    immutable: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'adjustment', 'return', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Índice para reportes
movementSchema.index({ tenant_id: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', movementSchema);