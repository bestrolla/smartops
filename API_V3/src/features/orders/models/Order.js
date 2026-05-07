const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: Schema.Types.ObjectId,
    ref: 'ProductVariant',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1'],
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad debe ser un número entero'
    }
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo']
  },
  options: [{
    name: String,
    value: Schema.Types.Mixed
  }],
  variantInfo: {
    sku: String,
    variantOptions: [{
      name: String,
      value: Schema.Types.Mixed
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'reserved', 'completed', 'cancelled'],
    default: 'pending'
  },
  reservationId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

const orderSchema = new Schema({
  tenant_id: {
    type: String,
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    validate: [arr => arr.length > 0, 'Debe haber al menos un item en la orden'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'processing', 'completed', 'cancelled'],
    default: 'draft'
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'cash', 'transfer'],
    required: true
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Índices
orderSchema.index({ tenant_id: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenant_id: 1, customer: 1 });
orderSchema.index({ tenant_id: 1, status: 1 });
orderSchema.index({ tenant_id: 1, 'items.product': 1 });
orderSchema.index({ tenant_id: 1, 'items.variant': 1 });

// Middleware pre-save para generar número de orden
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const lastOrder = await this.constructor.findOne(
      { tenant_id: this.tenant_id },
      {},
      { sort: { orderNumber: -1 } }
    );

    const lastNumber = lastOrder ? parseInt(lastOrder.orderNumber.slice(3)) : 0;
    this.orderNumber = `ORD${String(lastNumber + 1).padStart(6, '0')}`;
  }
  next();
});

// Middleware pre-save para calcular totales
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.tax = this.subtotal * 0.16; // 16% de impuesto
    this.total = this.subtotal + this.tax;
  }
  next();
});

// Método para reservar productos
orderSchema.methods.reserveProducts = async function() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Inventory = mongoose.model('Inventory');

    for (const [idx, item] of this.items.entries()) {
      const query = {
        tenant_id: this.tenant_id,
        product_id: item.product
      };

      // Si el item tiene variante, incluirla en la búsqueda
      if (item.variant) {
        query.variant_id = item.variant;
      }

      const inventory = await Inventory.findOne(query).session(session);
      
      if (!inventory) {
        throw new Error(`Inventario no encontrado para el producto ${item.product}`);
      }

      if (inventory.available_stock < item.quantity) {
        throw new Error(`Stock insuficiente para el producto ${item.product}`);
      }

      await inventory.reserveStock(item.quantity);
      
      item.status = 'reserved';
      item.reservationId = `${this._id}-${item.product}${item.variant ? `-${item.variant}` : ''}-${idx}`;
    }

    this.status = 'processing';
    await this.save({ session });
    await session.commitTransaction();

    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Método para liberar productos reservados
orderSchema.methods.releaseReservations = async function() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Inventory = mongoose.model('Inventory');

    for (const item of this.items) {
      if (item.status !== 'reserved') continue;

      const query = {
        tenant_id: this.tenant_id,
        product_id: item.product
      };

      if (item.variant) {
        query.variant_id = item.variant;
      }

      const inventory = await Inventory.findOne(query).session(session);
      
      if (inventory) {
        await inventory.releaseReservedStock(item.quantity);
      }

      item.status = 'cancelled';
      item.reservationId = null;
    }

    this.status = 'cancelled';
    await this.save({ session });
    await session.commitTransaction();

    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Método para confirmar la orden y actualizar el inventario
orderSchema.methods.confirmOrder = async function() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const Inventory = mongoose.model('Inventory');

    for (const item of this.items) {
      if (item.status !== 'reserved') {
        throw new Error(`Item ${item.product} no está reservado`);
      }

      const query = {
        tenant_id: this.tenant_id,
        product_id: item.product
      };

      if (item.variant) {
        query.variant_id = item.variant;
      }

      const inventory = await Inventory.findOne(query).session(session);
      
      if (!inventory) {
        throw new Error(`Inventario no encontrado para el producto ${item.product}`);
      }

      await inventory.confirmReservedStock(item.quantity);
      item.status = 'completed';
    }

    this.status = 'completed';
    await this.save({ session });
    await session.commitTransaction();

    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Middleware para actualizar la fecha de modificación
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.paymentMethod === 'manual' && this.status === 'processing') {
    throw new Error('Órdenes manuales no pueden pasar directamente a processing');
  }
  next();
});

// Aplicar el plugin de paginación
orderSchema.plugin(mongoosePaginate);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;