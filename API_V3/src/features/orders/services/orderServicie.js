const Order = require('../models/Order');
const Product = require('../../products/models/Product');
const AppError = require('../../../shared/errors.utils');
const mongoose = require('mongoose');
const InventoryService = require('../../inventory/services/invetoryService');
class OrderService {
  constructor(tenantId) {
    if (typeof tenantId !== 'string') {
      throw new AppError('El tenantId debe ser un string', 400);
    }
    this.tenantId = tenantId; // Guardamos como string ("cliente1")
  }

  async createOrder(orderData) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { items } = await this.validateOrderItems(orderData.items);
      
      // 1. Reservar en Inventory
      const inventoryService = new InventoryService(this.tenantId);
      await inventoryService.reserveForOrder(items, { session });
  
      // 2. Crear orden
      const order = await Order.create([{
        ...orderData,
        tenant: this.tenantId,
        items
      }], { session });
  
      await session.commitTransaction();
      return order[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async validateOrderItems(items) {
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        throw new AppError(`ID de producto no válido: ${item.product}`, 400);
      }

      // Busqueda usando tenantId como string
      const product = await Product.findOne({ 
        _id: item.product, 
        tenantId: this.tenantId, // "cliente1"
        isActive: true 
      });
      
      if (!product) {
        console.error(`Producto no encontrado - ID: ${item.product}, Tenant: ${this.tenantId}`);
        throw new AppError(`Producto no encontrado: ${item.product}`, 404);
      }
      
      if (product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`, 400);
      }
      
      const subtotal = item.price * item.quantity * (1 - (item.discount || 0) / 100);
      totalAmount += subtotal;
      
      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        subtotal
      });
    }
    
    return { items: validatedItems, totalAmount };
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
    
    const query = { tenant: this.tenantId };
    
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
      throw new AppError('ID de orden no válido', 400);
    }

    const order = await Order.findOne({
      _id: orderId,
      tenant: this.tenantId
    })
    .populate('customer', 'name email phone')
    .populate('items.product', 'name sku price images');
    
    if (!order) {
      throw new AppError('Orden no encontrada', 404);
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
      tenant: this.tenantId
    });
    
    if (!order) {
      throw new AppError('Orden no encontrada', 404);
    }
    
    if (!validTransitions[order.status].includes(status)) {
      throw new AppError(`Transición de estado no válida: ${order.status} -> ${status}`, 400);
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
      // 1. Liberar stock
      const inventoryService = new InventoryService(this.tenantId);
      await inventoryService.releaseReservation(orderId, { session });
  
      // 2. Actualizar orden
      const order = await Order.findOneAndUpdate(
        { _id: orderId },
        { status: 'cancelled' },
        { new: true, session }
      );
  
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