const mongoose = require('mongoose');
const { Schema } = mongoose;
const { createError } = require('../../../shared/errors.utils');

const productVariantSchema = new Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  // SKU único para esta variante
  sku: {
    type: String,
    required: [true, 'El SKU es requerido'],
    trim: true
  },
  // Combinación de atributos de la variante (ej: {color: "Rojo", talla: "M"})
  attributes: {
    type: Map,
    of: String,
    required: [true, 'Los atributos de la variante son requeridos'],
    validate: {
      validator: function(v) {
        return v && v.size > 0;
      },
      message: 'La variante debe tener al menos un atributo'
    }
  },
  // Precio específico de esta variante
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo'],
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  // Costo base específico de esta variante
  baseCost: {
    type: Number,
    min: [0, 'El costo base no puede ser negativo'],
    default: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  // Stock específico de esta variante
  stock: {
    type: Number,
    default: 0,
    min: [0, 'El stock no puede ser negativo'],
    validate: {
      validator: Number.isInteger,
      message: 'El stock debe ser un número entero'
    }
  },
  // Imágenes específicas de esta variante (opcionales)
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        if (!v || v.trim() === '') return true;
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'La URL de la imagen no es válida'
    }
  }],
  // Estado de la variante
  isActive: {
    type: Boolean,
    default: true
  },
  // Orden de visualización (opcional)
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Índices optimizados
productVariantSchema.index({ tenantId: 1, productId: 1 });
productVariantSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productVariantSchema.index({ tenantId: 1, productId: 1, isActive: 1 });

// Virtual para obtener nombre descriptivo de la variante
productVariantSchema.virtual('displayName').get(function() {
  if (!this.attributes || this.attributes.size === 0) {
    return this.sku;
  }
  
  const attributePairs = [];
  for (const [key, value] of this.attributes) {
    attributePairs.push(`${key}: ${value}`);
  }
  return attributePairs.join(', ');
});

// Método para generar SKU automático basado en el producto padre
productVariantSchema.methods.generateSku = function(baseProductSku) {
  if (!this.attributes || this.attributes.size === 0) {
    return `${baseProductSku}-VAR`;
  }
  
  const attributeValues = [];
  for (const [key, value] of this.attributes) {
    // Tomar las primeras 3 letras del valor y convertir a mayúsculas
    const shortValue = value.substring(0, 3).toUpperCase();
    attributeValues.push(shortValue);
  }
  
  return `${baseProductSku}-${attributeValues.join('-')}`;
};

// Pre-save hook para validaciones
productVariantSchema.pre('save', async function(next) {
  try {
    // Limpiar imágenes vacías
    if (this.images && this.images.length > 0) {
      this.images = this.images.filter(img => img && img.trim() !== '');
    }

    next();
  } catch (error) {
    console.error('Error en pre-save hook de ProductVariant:', error);
    next(error);
  }
});

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

module.exports = ProductVariant; 