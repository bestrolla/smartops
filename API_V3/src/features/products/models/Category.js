const mongoose = require('mongoose');
const AppError = require('../../../shared/errors.utils');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validación para evitar categorías circulares
categorySchema.pre('save', async function(next) {
  if (this.parentCategory) {
    if (this._id.equals(this.parentCategory)) {
      return next(new AppError('Una categoría no puede ser padre de sí misma', 400));
    }
    
    const parent = await this.constructor.findById(this.parentCategory);
    if (parent && parent.parentCategory && parent.parentCategory.equals(this._id)) {
      return next(new AppError('Relación circular detectada entre categorías', 400));
    }
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);