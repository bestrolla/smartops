// features/products/models/Product.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const AppError = require('../../../shared/errors.utils');
const Tenant = require('../../../core/tenant/models/tenant.model');

const variantOptionDefinitionSchema = new Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la opción es requerido'],
    trim: true
  },
  values: [{
    type: Schema.Types.Mixed,
    required: [true, 'Los valores de la opción son requeridos']
  }]
});

// Esquema simplificado para atributos de variantes (ej: Color, Talla)
const variantAttributeSchema = new Schema({
  name: {
    type: String,
    required: [true, 'El nombre del atributo es requerido'],
    trim: true
  },
  values: [{
    type: String,
    required: [true, 'Los valores del atributo son requeridos'],
    trim: true
  }]
});

const productSchema = new Schema({
  tenantId: { 
    type: String, 
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'El tenantId es requerido'
    }
  },
  // Información básica del producto
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [120, 'El nombre no puede exceder 120 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
  },
  // SKU simplificado - solo para producto base
  sku: {
    type: String,
    required: [true, 'El SKU es requerido'],
    trim: true,
    minlength: [2, 'El SKU debe tener al menos 2 caracteres'],
    maxlength: [50, 'El SKU no puede exceder 50 caracteres']
  },
  // Precio - usado solo si NO tiene variantes
  price: {
    type: Number,
    min: [0, 'El precio no puede ser negativo'],
    get: v => v ? Math.round(v * 100) / 100 : v,
    set: v => v ? Math.round(v * 100) / 100 : v,
    validate: {
      validator: function(v) {
        // El precio es requerido solo si NO tiene variantes
        if (!this.hasVariants) {
          return v !== null && v !== undefined && v >= 0;
        }
        return true;
      },
      message: 'El precio es requerido para productos sin variantes'
    }
  },
  // Costo base del producto
  baseCost: {
    type: Number,
    min: [0, 'El costo base no puede ser negativo'],
    default: 0,
    get: v => v ? Math.round(v * 100) / 100 : v,
    set: v => v ? Math.round(v * 100) / 100 : v
  },
  // Stock - usado solo si NO tiene variantes
  stock: {
    type: Number,
    min: [0, 'El stock no puede ser negativo'],
    default: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'El stock debe ser un número entero'
    }
  },
  // Control de variantes simplificado
  hasVariants: {
    type: Boolean,
    default: false
  },
  // Atributos para crear variantes (ej: Color, Talla, Material)
  variantAttributes: [variantAttributeSchema],
  // Categoría (simplificado a una sola)
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es requerida'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'ID de categoría no válido'
    }
  },
  // Imágenes del producto
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        if (!v || v.trim() === '') return true; // Permitir strings vacíos
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
  // Estado del producto
  isActive: {
    type: Boolean,
    default: true
  },
  // Información adicional opcional
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'La marca no puede exceder 100 caracteres']
  },
  condition: {
    type: String,
    enum: ['new', 'used', 'refurbished'],
    default: 'new'
  },
  // Peso para envíos (en gramos)
  weight: {
    type: Number,
    min: [0, 'El peso no puede ser negativo']
  },
  // Dimensiones para envíos (en cm)
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    getters: true 
  }
});

// Índices optimizados para búsquedas
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, name: 'text', description: 'text' });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, isActive: 1 });

// Virtual para obtener todas las variantes
productSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'productId',
  options: { sort: { createdAt: 1 } }
});

// Método estático para buscar por SKU
productSchema.statics.findBySku = function(tenantId, sku) {
  return this.findOne({ tenantId, sku }).lean();
};

// Método para obtener el precio del producto (simple o mínimo de variantes)
productSchema.methods.getDisplayPrice = async function() {
  if (!this.hasVariants) {
    return this.price || 0;
  }
  
  // Si tiene variantes, obtener el precio mínimo
  const ProductVariant = mongoose.model('ProductVariant');
  const variants = await ProductVariant.find({ 
    productId: this._id, 
    isActive: true 
  }).select('price').lean();
  
  if (variants.length === 0) return 0;
  return Math.min(...variants.map(v => v.price));
};

// Método para obtener el rango de precios (para productos con variantes)
productSchema.methods.getPriceRange = async function() {
  if (!this.hasVariants) {
    return { min: this.price || 0, max: this.price || 0 };
  }
  
  const ProductVariant = mongoose.model('ProductVariant');
  const variants = await ProductVariant.find({ 
    productId: this._id, 
    isActive: true 
  }).select('price').lean();
  
  if (variants.length === 0) return { min: 0, max: 0 };
  
  const prices = variants.map(v => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

// Método para obtener el stock total
productSchema.methods.getTotalStock = async function() {
  if (!this.hasVariants) {
    return this.stock || 0;
  }
  
  const ProductVariant = mongoose.model('ProductVariant');
  const variants = await ProductVariant.find({ 
    productId: this._id, 
    isActive: true 
  }).select('stock').lean();
  
  return variants.reduce((total, variant) => total + (variant.stock || 0), 0);
};

// Pre-save hook para validaciones y limpieza
productSchema.pre('save', async function(next) {
  try {
    // Validar que si no tiene variantes, debe tener precio
    if (!this.hasVariants && (!this.price || this.price <= 0)) {
      return next(new Error('Los productos sin variantes deben tener un precio válido'));
    }

    // Si tiene variantes, limpiar precio y stock del producto base
    if (this.hasVariants) {
      this.price = undefined;
      this.stock = 0;
    }

    // Limpiar imágenes vacías
    if (this.images && this.images.length > 0) {
      this.images = this.images.filter(img => img && img.trim() !== '');
    }

    // Validar atributos de variantes
    if (this.hasVariants && this.variantAttributes && this.variantAttributes.length > 0) {
      for (const attr of this.variantAttributes) {
        if (!attr.name || !attr.values || attr.values.length === 0) {
          return next(new Error('Los atributos de variantes deben tener nombre y valores'));
        }
        // Limpiar valores vacíos
        attr.values = attr.values.filter(val => val && val.trim() !== '');
        if (attr.values.length === 0) {
          return next(new Error(`El atributo "${attr.name}" debe tener al menos un valor`));
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error en pre-save hook de Product:', error);
    next(error);
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;