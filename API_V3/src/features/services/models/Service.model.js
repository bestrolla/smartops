const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const serviceSchema = new mongoose.Schema({
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
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory'
  },
  duration: {
    type: Number,
    required: true,
    min: 5,
    max: 1440
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    length: 3
  },
  professionals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional'
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPackage: {
    type: Boolean,
    default: false
  },
  packageServices: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    order: Number
  }],
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

// Plugin para paginación
serviceSchema.plugin(mongoosePaginate);

// Índices para mejorar consultas
serviceSchema.index({ tenantId: 1, isActive: 1 });
serviceSchema.index({ tenantId: 1, categoryId: 1 });
serviceSchema.index({ tenantId: 1, isPackage: 1 });

// Virtual para obtener la categoría completa
serviceSchema.virtual('category', {
  ref: 'ServiceCategory',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Virtual para obtener los profesionales completos
serviceSchema.virtual('professionalDetails', {
  ref: 'Professional',
  localField: 'professionals',
  foreignField: '_id'
});

module.exports = mongoose.model('Service', serviceSchema);