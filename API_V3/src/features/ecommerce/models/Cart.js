const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariant',
    default: null
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad debe ser un número entero'
    }
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  options: [{
    name: String,
    value: mongoose.Schema.Types.Mixed
  }],
  // Nuevo campo para almacenar información de la variante seleccionada
  variantInfo: {
    sku: String,
    variantOptions: [{
      name: String,
      value: mongoose.Schema.Types.Mixed
    }]
  }
});

const cartSchema = new mongoose.Schema({
  tenantId: { 
    type: String, 
    required: true,
    index: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [cartItemSchema],
  coupon: {
    type: String,
    trim: true
  },
  discount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: '30d' // Auto-borrado después de 30 días
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Índices
cartSchema.index({ tenantId: 1, user: 1 });
cartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 días

// Virtual para calcular el subtotal (sin descuento)
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Virtual para calcular el total (con descuento)
cartSchema.virtual('total').get(function() {
  return Math.max(0, this.subtotal - this.discount);
});

// Middleware para validar y actualizar precios
cartSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('items')) return next();

    const Product = mongoose.model('Product');
    const ProductVariant = mongoose.model('ProductVariant');
    const Inventory = mongoose.model('Inventory');

    for (const item of this.items) {
      // Obtener producto
      const product = await Product.findOne({
        _id: item.product,
        tenantId: this.tenantId
      });

      if (!product) {
        throw new Error(`Producto no encontrado: ${item.product}`);
      }

      if (!product.isActive) {
        throw new Error(`El producto ${product.name} no está disponible`);
      }

      // Si el producto tiene variantes, validar la variante
      if (product.hasVariants) {
        if (!item.variant) {
          throw new Error(`El producto ${product.name} requiere seleccionar una variante`);
        }

        const variant = await ProductVariant.findOne({
          _id: item.variant,
          productId: product._id,
          tenantId: this.tenantId
        });

        if (!variant) {
          throw new Error(`Variante no encontrada para el producto ${product.name}`);
        }

        if (!variant.isActive) {
          throw new Error(`La variante seleccionada de ${product.name} no está disponible`);
        }

        // Validar stock usando el inventario por variante
        const inventory = await Inventory.findOne({
          tenant_id: this.tenantId,
          product_id: product._id,
          variant_id: variant._id
        });

        if (!inventory) {
          throw new Error(`No hay inventario configurado para la variante de ${product.name}`);
        }

        if (inventory.available_stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name} (${variant.sku}). Disponible: ${inventory.available_stock}, Solicitado: ${item.quantity}`);
        }

        // Actualizar precio y información de la variante
        item.price = variant.price;
        item.options = variant.options;
        item.variantInfo = {
          sku: variant.sku,
          variantOptions: variant.options
        };
      } else {
        // Para productos sin variantes, buscar inventario sin variant_id
        // NOTA: Esto puede requerir un ajuste en el modelo de Inventory
        const inventory = await Inventory.findOne({
          tenant_id: this.tenantId,
          product_id: product._id,
          variant_id: null
        });

        if (!inventory) {
          throw new Error(`No hay inventario configurado para ${product.name}`);
        }

        if (inventory.available_stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${inventory.available_stock}, Solicitado: ${item.quantity}`);
        }

        // Actualizar precio base del producto
        item.price = product.basePrice;
        item.variantInfo = {
          sku: product.sku,
          variantOptions: []
        };
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;