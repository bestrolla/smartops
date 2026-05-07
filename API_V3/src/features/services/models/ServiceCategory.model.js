const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.tenantId;
      return ret;
    }
  }
});

// Índices
serviceCategorySchema.index({ tenantId: 1, parentCategory: 1 });
serviceCategorySchema.index({ tenantId: 1, isActive: 1 });

// Virtual para subcategorías
serviceCategorySchema.virtual('subcategories', {
  ref: 'ServiceCategory',
  localField: '_id',
  foreignField: 'parentCategory'
});

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);