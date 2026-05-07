const Order = require('../models/Order');
const Product = require('../../products/models/Product');
const { createError } = require('../../../shared/errors.utils');
const mongoose = require('mongoose');
const InventoryService = require('../../inventory/services/inventoryService');
const ProductVariant = require('../../products/models/ProductVariant');

class OrderService {
  constructor(tenantId) {
    if (!tenantId || (typeof tenantId !== 'string' && typeof tenantId !== 'object')) {
      throw createError(400, 'El tenantId es requerido');
    }
    this.tenantId = tenantId;
  }

  async generateOrderNumber() {
    const lastOrder = await Order.findOne(
      { tenant_id: this.tenantId },
      {},
      { sort: { orderNumber: -1 } }
    );

    const lastNumber = lastOrder ? parseInt(lastOrder.orderNumber.slice(3)) : 0;
    return `ORD${String(lastNumber + 1).padStart(6, '0')}`;
  }

  async createOrder(orderData) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { items, subtotal } = await this.validateOrderItems(orderData.items, session);
      
      // Calcular impuestos y total
      const tax = subtotal * 0.16; // 16% de impuesto
      const total = subtotal + tax;

      // Generar número de orden
      const orderNumber = await this.generateOrderNumber();

      // 1. Crear orden primero para tener el ID
      const order = await Order.create([{
        tenant_id: this.tenantId,
        orderNumber,
        customer: orderData.customer || orderData.userId,
        items,
        subtotal,
        tax,
        total,
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
        status: 'pending',
        paymentStatus: 'pending',
        metadata: orderData.metadata || {}
      }], { session });
      
      // 2. Reservar en Inventory
      const inventoryService = new InventoryService(this.tenantId);
      await inventoryService.reserveForOrder(items, { 
        orderId: order[0]._id,
        session 
      });
  
      await session.commitTransaction();
      return order[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async validateOrderItems(items, session) {
    let subtotal = 0;
    const validatedItems = [];
    
    if (!Array.isArray(items) || items.length === 0) {
      throw createError(400, 'La orden debe tener al menos un item');
    }
    
    for (const item of items) {
      // Si el item viene con un campo variant explícito, usarlo
      if (item.variant) {
        // Buscar la variante y el producto principal
        const variant = await ProductVariant.findOne({
          _id: item.variant,
          tenantId: this.tenantId.toString(),
          isActive: true
        }).session(session);
        if (!variant) {
          throw createError(404, `Variante no encontrada: ${item.variant}`);
        }
        const price = item.price || variant.price;
        const itemSubtotal = price * item.quantity * (1 - (item.discount || 0) / 100);
        subtotal += itemSubtotal;
        validatedItems.push({
          product: variant.productId,
          variant: variant._id,
          quantity: item.quantity,
          price: price,
          status: 'pending',
          discount: item.discount || 0
        });
        continue;
      }

      // Si el item.product es un ID de variante, buscar la variante
      if (mongoose.Types.ObjectId.isValid(item.product)) {
        let variant = await ProductVariant.findOne({
          _id: item.product,
          tenantId: this.tenantId.toString(),
          isActive: true
        }).session(session);
        if (variant) {
          // Es una variante, usar sus datos
          if (variant.stock < item.quantity) {
            throw createError(400, `Stock insuficiente para la variante ${variant.sku}. Disponible: ${variant.stock}`);
          }
          const price = item.price || variant.price;
          const itemSubtotal = price * item.quantity * (1 - (item.discount || 0) / 100);
          subtotal += itemSubtotal;
          validatedItems.push({
            product: variant.productId,
            variant: variant._id,
            quantity: item.quantity,
            price: price,
            status: 'pending',
            discount: item.discount || 0
          });
          continue;
        }
      }

      // Si no es variante, buscar como producto simple
      const product = await Product.findOne({
        _id: item.product,
        tenantId: this.tenantId,
        isActive: true
      }).session(session);

      if (!product) {
        throw createError(404, `Producto o variante no encontrado: ${item.product}`);
      }

      if (product.hasVariants) {
        throw createError(400, `Debes seleccionar una variante para el producto ${product.name}`);
      }

      if (product.stock < item.quantity) {
        throw createError(400, `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
      }

      const price = item.price || product.basePrice;
      const itemSubtotal = price * item.quantity * (1 - (item.discount || 0) / 100);
      subtotal += itemSubtotal;

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: price,
        status: 'pending',
        discount: item.discount || 0
      });
    }
    
    return { items: validatedItems, subtotal };
  }

  async reserveInventory(tenant, items) {
    // Implementación básica - se puede mejorar con el módulo de inventario
    for (const item of items) {
      await Product.updateOne(
        { _id: item.product, tenant },
        { $inc: { stock: -item.quantity } }
      );
    }
  }

  async updateOrderStatus(tenant, orderId, status, userId) {
    const order = await Order.findOne({ _id: orderId, tenant });
    
    if (!order) {
      throw new ApiError(404, 'Orden no encontrada');
    }
    
    // Validar transición de estado
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    
    if (!validTransitions[order.status].includes(status)) {
      throw new ApiError(400, `Transición de estado no válida: ${order.status} -> ${status}`);
    }
    
    order.status = status;
    order.updatedBy = userId;
    await order.save();
    
    return order;
  }

  // Método para obtener órdenes paginadas
  async getOrders(filters = {}) {
    const { 
      page = 1, 
      limit = 10,
      status,
      customer,
      startDate,
      endDate
    } = filters;
    
    const query = { tenant_id: this.tenantId };
    
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'customer', select: 'name email' },
        { path: 'items.product', select: 'name sku price' }
      ]
    };
    
    return await Order.paginate(query, options);
  }

  // Método para obtener detalles de una orden específica
  async getOrderDetails(orderId) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new ApiError(400, 'ID de orden no válido');
    }

    const order = await Order.findOne({
      _id: orderId,
      tenant_id: this.tenantId
    })
    .populate('customer', 'name email phone')
    .populate('items.product', 'name sku price images');
    
    if (!order) {
      throw new ApiError(404, 'Orden no encontrada');
    }
    
    return order;
  }

  // Método para actualizar estado de una orden
  async updateOrderStatus(orderId, status, userId) {
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    
    const order = await Order.findOne({
      _id: orderId,
      tenant_id: this.tenantId
    });
    
    if (!order) {
      throw new ApiError(404, 'Orden no encontrada');
    }
    
    if (!validTransitions[order.status].includes(status)) {
      throw new ApiError(400, `Transición de estado no válida: ${order.status} -> ${status}`);
    }
    
    order.status = status;
    order.updatedBy = userId;
    await order.save();
    
    return order;
  }

  // Método para cancelar una orden
  async cancelOrder(orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const order = await Order.findOne({
        _id: orderId,
        tenant_id: this.tenantId
      }).session(session);

      if (!order) {
        throw new ApiError(404, 'Orden no encontrada');
      }

      if (order.status === 'cancelled') {
        throw new ApiError(400, 'La orden ya está cancelada');
      }

      if (!['pending', 'processing'].includes(order.status)) {
        throw new ApiError(400, 'No se puede cancelar una orden en estado ' + order.status);
      }

      // 1. Liberar stock
      const inventoryService = new InventoryService(this.tenantId);
      await inventoryService.releaseReservation(order.items, { 
        orderId: order._id,
        reason: 'order_cancelled',
        session 
      });
  
      // 2. Actualizar orden
      order.status = 'cancelled';
      await order.save({ session });
  
      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = OrderService;