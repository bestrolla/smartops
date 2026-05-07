const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Tenant = require('../../../core/tenant/models/tenant.model');

const inventorySchema = new mongoose.Schema({
  tenant_id: {
    type: String,
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    required: false,  // Ahora es opcional para permitir productos sin variantes
    default: null
  },
  current_stock: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'El stock debe ser un número entero'
    }
  },
  reserved_stock: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'El stock reservado debe ser un número entero'
    }
  },
  low_stock_threshold: {
    type: Number,
    default: 5,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'El umbral de stock bajo debe ser un número entero'
    }
  },
  high_stock_threshold: {
    type: Number,
    default: 100,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'El umbral de stock alto debe ser un número entero'
    }
  },
  location: {
    type: String,
    default: 'default'
  },
  last_movement_date: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  versionKey: false,
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});

// Añade el plugin de paginación
inventorySchema.plugin(mongoosePaginate);

// Índices para búsquedas rápidas - actualizado para permitir variant_id null
inventorySchema.index({ tenant_id: 1, product_id: 1, variant_id: 1 }, { 
  unique: true,
  sparse: true // Permite valores null únicos
});
inventorySchema.index({ tenant_id: 1, current_stock: 1 });
inventorySchema.index({ tenant_id: 1, location: 1 });
inventorySchema.index({ tenant_id: 1, variant_id: 1 });

// Virtual para stock disponible
inventorySchema.virtual('available_stock').get(function() {
  return Math.max(0, this.current_stock - this.reserved_stock);
});

// Virtual para estado de stock
inventorySchema.virtual('stock_status').get(function() {
  if (this.current_stock <= this.low_stock_threshold) {
    return 'low';
  }
  if (this.current_stock >= this.high_stock_threshold) {
    return 'high';
  }
  return 'normal';
});

// Pre-save middleware para validación adicional
inventorySchema.pre('save', async function(next) {
  try {
    console.log('Pre-save hook de Inventory');
    
    // Si este es un documento nuevo y viene de la creación de la variante, omitir validación
    if (this.isNew && this.metadata?.created_from === 'variant_creation') {
      return next();
    }
    
    const session = this.$session();
    
    // Validar que el producto existe
    const Product = mongoose.model('Product');
    const product = await Product.findOne({ 
      _id: this.product_id,
      tenantId: this.tenant_id
    }).session(session);

    if (!product) {
      throw new Error('El producto no existe o no pertenece al tenant especificado');
    }

    // Si hay variant_id, validar que la variante existe y pertenece al producto
    if (this.variant_id) {
      const ProductVariant = mongoose.model('ProductVariant');
      const variant = await ProductVariant.findOne({
        _id: this.variant_id,
        productId: this.product_id,
        tenantId: this.tenant_id
      }).session(session);

      if (!variant) {
        throw new Error('La variante no existe o no pertenece al producto/tenant especificado');
      }
    } else {
      // Si no hay variant_id, validar que el producto no tenga variantes
      if (product.hasVariants) {
        throw new Error('Los productos con variantes deben tener un variant_id especificado');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Método para reservar stock
inventorySchema.methods.reserveStock = async function(quantity) {
  if (quantity > this.available_stock) {
    throw new Error('No hay suficiente stock disponible');
  }
  
  this.reserved_stock += quantity;
  await this.save();
  return this.available_stock;
};

// Método para liberar stock reservado
inventorySchema.methods.releaseReservedStock = async function(quantity) {
  if (quantity > this.reserved_stock) {
    throw new Error('La cantidad a liberar excede el stock reservado');
  }
  
  this.reserved_stock -= quantity;
  await this.save();
  return this.available_stock;
};

// Método para confirmar stock reservado (convertir en venta)
inventorySchema.methods.confirmReservedStock = async function(quantity) {
  if (quantity > this.reserved_stock) {
    throw new Error('La cantidad a confirmar excede el stock reservado');
  }
  
  this.current_stock -= quantity;
  this.reserved_stock -= quantity;
  this.last_movement_date = new Date();
  await this.save();
  return this.available_stock;
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;