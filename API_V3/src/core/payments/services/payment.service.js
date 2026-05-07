const mongoose = require('mongoose');
const fs = require('fs').promises;
const Payment = require('../models/payment.model');
const Order = require('../../../features/orders/models/Order');
const UploadService = require('../../file-uploads/services/fileUpload.service');
const SubscriptionService = require('../../subscriptions/services/subscription.service');
const Subscription = require('../../subscriptions/models/subscription.model');
const { createError } = require('../../../shared/errors.utils');

class PaymentService {
  async createPayment(paymentData) {
    try {
      console.log('[PaymentService] Creando pago:', {
        type: paymentData.type,
        tenant: paymentData.tenant,
        amount: paymentData.amount
      });

      // Validar pagos duplicados pendientes para la misma orden
      if (paymentData.type === 'order_payment' && paymentData.order) {
        const existingPending = await Payment.findOne({
          order: paymentData.order,
          type: 'order_payment',
          status: 'pending'
        });
        if (existingPending) {
          throw createError(400, 'Ya existe un pago pendiente para esta orden.');
        }
      }

      const payment = await Payment.create(paymentData);

      // Si es un pago de suscripción, actualizar la suscripción pendiente
      if (payment.type === 'subscription') {
        console.log('[PaymentService] Buscando suscripción pendiente para actualizar:', {
          tenant: payment.tenant,
          paymentId: payment._id
        });

        const subscription = await Subscription.findOne({
          tenant_id: payment.tenant,
          status: { $in: ['pending', 'cancelled', 'expired', 'trial'] }
        });

        if (subscription) {
          console.log('[PaymentService] Actualizando suscripción con payment_id:', {
            subscriptionId: subscription._id,
            paymentId: payment._id
          });

          subscription.payment_id = payment._id;
          await subscription.save();
        } else {
          console.log('[PaymentService] No se encontró suscripción pendiente para actualizar');
        }
      }

      return payment;
    } catch (error) {
      console.error('[PaymentService] Error al crear pago:', error);
      throw error;
    }
  }

  async getPaymentById(id) {
    const payment = await Payment.findById(id);
    if (!payment) {
      throw createError(404, 'Pago no encontrado');
    }
    return payment;
  }

  async findPaymentsByTenant(tenantId, filters = {}) {
    const query = { tenant: tenantId, ...filters };
    return Payment.find(query).sort({ createdAt: -1 });
  }

  async verifyPayment(paymentId, verifiedBy, isSubscription = false) {
    const session = await Payment.startSession();
    session.startTransaction();

    try {
      console.log('[PaymentService] Verificando pago:', {
        paymentId,
        verifiedBy,
        isSubscription
      });

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw createError(404, 'Pago no encontrado');
      }

      if (payment.status !== 'pending') {
        throw createError(400, 'El pago ya ha sido procesado');
      }

      payment.status = 'completed';
      payment.verifiedBy = verifiedBy;
      payment.verificationDate = new Date();
      await payment.save({ session });

      if (isSubscription) {
        console.log('[PaymentService] Actualizando suscripción:', {
          paymentId,
          tenant: payment.tenant
        });

        const subscription = await Subscription.findOne({
          tenant_id: payment.tenant,
          payment_id: payment._id
        });

        if (!subscription) {
          throw createError(404, 'No se encontró la suscripción asociada al pago');
        }

        subscription.status = 'active';
        await subscription.save({ session });
      }

      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async rejectPayment(paymentId, rejectedBy, reason) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw createError(404, 'Pago no encontrado');
    }

    if (payment.status !== 'pending') {
      throw createError(400, 'El pago ya ha sido procesado');
    }

    payment.status = 'rejected';
    payment.verifiedBy = rejectedBy;
    payment.verificationDate = new Date();
    payment.rejectionReason = reason;
    return payment.save();
  }

  static async createOrderPayment(orderData, paymentData, receiptFile) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Subir comprobante
      let proofImage;
      if (receiptFile) {
        proofImage = await UploadService.upload(receiptFile, {
          folder: `tenants/${orderData.tenant}/orders/${orderData.orderId}/payments`,
          prefix: 'receipt_'
        });
      }

      // 2. Crear pago
      const payment = await Payment.create([{
        tenant: orderData.tenant,
        user: orderData.user,
        order: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || 'USD',
        proofImage,
        type: 'order_payment',
        method: paymentData.method,
        transactionId: paymentData.transactionId,
        status: 'pending',
        metadata: {
          items: orderData.items,
          cartTotal: orderData.amount
        }
      }], { session });

      await session.commitTransaction();
      return payment[0];
      
    } catch (error) {
      await session.abortTransaction();
      if (receiptFile?.path) {
        await fs.unlink(receiptFile.path).catch(console.error);
      }
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  // Método actualizado para aprobación
  static async approvePayment(paymentId, approvedBy, notes = '') {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        throw new Error(`ID de pago inválido: ${paymentId}`);
      }

      // Primero obtener el pago para verificar su tipo
      const existingPayment = await Payment.findById(paymentId);
      
      if (!existingPayment) {
        throw new Error(`Pago no encontrado con ID: ${paymentId}`);
      }

      // Luego actualizar basado en el tipo
      const payment = await Payment.findOneAndUpdate(
        { 
          _id: paymentId,
          status: 'pending'
        },
        {
          status: existingPayment.type === 'order_payment' ? 'completed' : 'verified',
          verifiedBy: approvedBy,
          verificationDate: new Date(),
          notes
        },
        { new: true, session }
      ).populate('order');
      
      if (!payment) {
        throw new Error(`Pago no encontrado o ya procesado. ID: ${paymentId}, Status: ${existingPayment.status}`);
      }

      // Lógica específica para pagos de orden
      if (payment.type === 'order_payment' && payment.order) {
        await PaymentService.processOrderPaymentApproval(payment, session);
      } else if (payment.type === 'subscription') {
        await SubscriptionService.processPaymentForSubscription(payment);
      }
      
      await session.commitTransaction();
      return payment;
      
    } catch (error) {
      console.error('Error en approvePayment:', {
        paymentId,
        error: error.message,
        stack: error.stack
      });
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async processOrderPaymentApproval(payment, session) {
    try {
      // 1. Validar que el pago tiene una orden asociada
      if (!payment.order) {
        throw new Error('Pago no tiene una orden asociada');
      }

      // 2. Obtener y actualizar la orden
      // Cambiar estado a 'completed' y paymentStatus a 'paid'
      const order = await Order.findOneAndUpdate(
        { 
          _id: payment.order,
          status: { $in: ['pending', 'payment_pending', 'processing', 'payment_verified'] },
          paymentStatus: { $in: ['pending', 'paid'] }
        },
        {
          status: 'completed',
          paymentStatus: 'paid',
          updatedAt: new Date()
        },
        { new: true, session }
      ).populate('items.product');

      if (!order) {
        throw new Error('Orden no encontrada o ya procesada');
      }

      // 3. Verificar inventario antes de actualizar
      const Inventory = require('../../../features/inventory/models/Inventory');
      // Verificar que hay suficiente stock reservado y actual
      const inventoryChecks = await Promise.all(order.items.map(async item => {
        const query = {
          tenant_id: order.tenant_id,
          product_id: item.product,
        };
        if (item.variant) query.variant_id = item.variant;
        const inventory = await Inventory.findOne(query).session(session);
        return {
          productId: item.product ? item.product.toString() : 'null',
          variantId: item.variant ? item.variant.toString() : '',
          required: item.quantity,
          available: inventory?.current_stock ?? 0,
          reserved: inventory?.reserved_stock ?? 0,
          hasStock: inventory && inventory.current_stock >= item.quantity && inventory.reserved_stock >= item.quantity,
          found: !!inventory
        };
      }));
      const insufficientStock = inventoryChecks.filter(check => !check.hasStock);
      if (insufficientStock.length > 0) {
        const stockDetails = insufficientStock.map(item =>
          item.found
            ? `${item.productId}${item.variantId ? ` (variante ${item.variantId})` : ''}: necesita ${item.required}, disponible ${item.available}, reservado ${item.reserved}`
            : `INVENTARIO NO ENCONTRADO para producto ${item.productId}${item.variantId ? ` variante ${item.variantId}` : ''}`
        ).join(', ');
        throw new Error(`Stock insuficiente o reserva insuficiente para los siguientes productos: ${stockDetails}`);
      }
      // 4. Actualizar inventario: descontar tanto reserved_stock como current_stock
      const inventoryUpdates = order.items.map(item => {
        const filter = {
          tenant_id: order.tenant_id,
          product_id: item.product,
        };
        if (item.variant) filter.variant_id = item.variant;
        return {
          updateOne: {
            filter: {
              ...filter,
              current_stock: { $gte: item.quantity },
              reserved_stock: { $gte: item.quantity }
            },
            update: {
              $inc: {
                current_stock: -item.quantity,
                reserved_stock: -item.quantity
              }
            }
          }
        };
      });
      const inventoryResult = await Inventory.bulkWrite(inventoryUpdates, { session });
      if (inventoryResult.modifiedCount !== order.items.length) {
        throw new Error(`Error al actualizar el inventario: se actualizaron ${inventoryResult.modifiedCount} de ${order.items.length} productos`);
      }

      // 4.1. Actualizar el stock de la variante si aplica
      for (const item of order.items) {
        if (item.variant) {
          const ProductVariant = require('../../../features/products/models/ProductVariant');
          await ProductVariant.updateOne(
            { _id: item.variant },
            { $inc: { stock: -item.quantity } },
            { session }
          );
        }
      }

      // 5. (Opcional) Marcar los items de la orden como completados
      order.items.forEach(item => {
        item.status = 'completed';
      });
      await order.save({ session });
      return { success: true, order };
    } catch (error) {
      console.error('[Payment Approval Error]', {
        paymentId: payment._id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async getCheckoutPayments(tenantId, filters = {}) {
    const { status, user } = filters;
    const baseQuery = { 
      tenant: tenantId,
      type: 'order_payment' 
    };
    
    if (status) baseQuery.status = status;
    if (user) baseQuery.user = user;

    const payments = await Payment.find(baseQuery)
      .populate('user', 'name email')
      .populate('order', 'orderNumber total status')
      .sort({ createdAt: -1 });

    return payments;
  }

  static async updateManualPayment(paymentId, userId, updateData) {
    // Solo permitir actualizar pagos que no sean de suscripción y estén pendientes
    const payment = await Payment.findOne({
      _id: paymentId,
      type: { $ne: 'subscription' },
      status: 'pending'
    });
    if (!payment) {
      throw new Error('Solo se pueden actualizar pagos manuales pendientes');
    }
    // Solo campos permitidos
    if (updateData.amount !== undefined) payment.amount = updateData.amount;
    if (updateData.method !== undefined) payment.method = updateData.method;
    if (updateData.currency !== undefined) payment.currency = updateData.currency;
    if (updateData.notes !== undefined) payment.notes = updateData.notes;
    payment.updatedAt = new Date();
    await payment.save();
    return payment;
  }

  async approveManualPayment(paymentId, approvedBy, notes = '') {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await Payment.findOne({
        _id: paymentId,
        type: { $ne: 'subscription' },
        status: 'pending'
      }).session(session);
      if (!payment) {
        throw new Error('Solo se pueden aprobar pagos manuales pendientes');
      }
      payment.status = 'completed';
      payment.verifiedBy = approvedBy;
      payment.verificationDate = new Date();
      if (notes) payment.notes = notes;
      await payment.save({ session });
      // Si es pago de orden, actualizar orden e inventario
      if (payment.type === 'order_payment' && payment.order) {
        await PaymentService.processOrderPaymentApproval(payment, session);
      }
      await session.commitTransaction();
      return payment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new PaymentService();