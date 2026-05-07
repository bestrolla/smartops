const Cart = require('../models/Cart');
const Order = require('../../orders/models/Order');
const PaymentService = require('../../../core/payments/services/payment.service');
const AppError = require('../../../shared/errors.utils');
const fileUploadService = require('../../../core/file-uploads/services/fileUpload.service');

class CheckoutController {
  static async generateOrderNumber(tenantId) {
    const lastOrder = await Order.findOne(
      { tenant_id: tenantId },
      {},
      { sort: { orderNumber: -1 } }
    );

    const lastNumber = lastOrder ? parseInt(lastOrder.orderNumber.slice(3)) : 0;
    return `ORD${String(lastNumber + 1).padStart(6, '0')}`;
  }

  static async initiateCheckout(req, res, next) {
    try {
      const { method, transactionId } = req.body;
      const receiptFile = req.file;

      console.log('Iniciando checkout:', {
        method,
        transactionId,
        hasFile: !!receiptFile,
        fileInfo: receiptFile ? {
          filename: receiptFile.filename,
          path: receiptFile.path,
          mimetype: receiptFile.mimetype,
          size: receiptFile.size
        } : null,
        userId: req.user.userId,
        tenantId: req.user.tenantId
      });

      // Validaciones básicas
      if (!method) {
        throw new AppError('Método de pago es requerido', 400);
      }

      // Mapear métodos de pago externos a los aceptados por el sistema
      const paymentMethodMap = {
        'binance': 'transfer',
        'zinli': 'transfer',
        'pago_movil': 'transfer',
        'transferencia': 'transfer',
        'efectivo': 'cash',
        'credit_card': 'credit_card',
        'debit_card': 'debit_card'
      };

      const systemPaymentMethod = paymentMethodMap[method];
      if (!systemPaymentMethod) {
        throw new AppError('Método de pago no válido', 400);
      }

      if (!receiptFile) {
        throw new AppError('Comprobante de pago es requerido', 400);
      }

      // Obtener carrito
      const cart = await Cart.findOne({ 
        tenantId: req.user.tenantId, 
        user: req.user.userId 
      }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        throw new AppError('Carrito vacío', 400);
      }

      console.log('Carrito encontrado:', {
        cartId: cart._id,
        itemsCount: cart.items.length
      });

      // Calcular totales
      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.16; // 16% de impuesto
      const total = subtotal + tax;

      // Generar número de orden
      const orderNumber = await CheckoutController.generateOrderNumber(req.user.tenantId);

      // Crear orden
      const order = new Order({
        tenant_id: req.user.tenantId,
        orderNumber,
        customer: req.user.userId,
        items: cart.items.map(item => ({
          product: item.product._id,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
          status: 'pending',
          variantInfo: item.variantInfo || null
        })),
        subtotal,
        tax,
        total,
        paymentMethod: systemPaymentMethod,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: {
          street: "Por definir",
          city: "Por definir",
          state: "Por definir",
          country: "Por definir",
          zipCode: "00000"
        }
      });

      await order.save();

      console.log('Orden creada:', {
        orderId: order._id,
        orderNumber,
        total
      });

      // Procesar pago usando el servicio directamente
      const payment = await PaymentService.createOrderPayment({
        tenant: req.user.tenantId,
        user: req.user.userId,
        orderId: order._id,
        amount: order.total
      }, {
        method: systemPaymentMethod,
        transactionId: transactionId || `MANUAL-${Date.now()}`
      }, {
        ...receiptFile,
        url: fileUploadService.getFileUrl(receiptFile.path)
      });

      console.log('Pago creado:', {
        paymentId: payment._id,
        status: payment.status,
        method: payment.method,
        receiptUrl: payment.proofImage
      });

      // Limpiar carrito
      await Cart.findByIdAndUpdate(cart._id, { items: [], total: 0 });

      res.status(201).json({
        success: true,
        data: { 
          order,
          payment: {
            ...payment.toObject(),
            receiptUrl: payment.proofImage ? fileUploadService.getFileUrl(payment.proofImage) : null
          },
          message: 'Checkout completado. Para aprobar el pago use: ' +
                   `/api/checkout/payments/${payment._id}/approve`
        }
      });

    } catch (err) {
      // Si hay un error, intentamos limpiar el archivo si se subió
      if (req.file) {
        await fileUploadService.deleteFile(req.file.path).catch(console.error);
      }
      console.error('Error en checkout:', err);
      next(err);
    }
  }

  static async listPayments(req, res, next) {
    try {
      console.log('Listando pagos para:', {
        tenantId: req.user.tenantId,
        userId: req.user.userId
      });

      const payments = await PaymentService.getCheckoutPayments(
        req.user.tenantId,
        { user: req.user.userId }
      );

      console.log('Pagos encontrados:', payments.length);

      // Formatear la respuesta para incluir información útil
      const formattedPayments = payments.map(payment => ({
        id: payment._id,
        orderId: payment.order?._id,
        orderNumber: payment.order?.orderNumber,
        amount: payment.amount,
        status: payment.status,
        method: payment.method,
        createdAt: payment.createdAt,
        approveUrl: `/api/checkout/payments/${payment._id}/approve`
      }));
      
      res.json({
        success: true,
        count: payments.length,
        data: formattedPayments,
        message: payments.length === 0 ? 
          'No se encontraron pagos' : 
          `Se encontraron ${payments.length} pagos. Para aprobar un pago, use la URL en approveUrl`
      });
    } catch (err) {
      console.error('Error listando pagos:', {
        error: err.message,
        stack: err.stack
      });
      next(err);
    }
  }

  static async approvePayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      const { userId, tenantId } = req.user;

      if (!paymentId) {
        throw new AppError('ID de pago es requerido', 400);
      }

      console.log('Iniciando aprobación de pago:', {
        paymentId,
        userId,
        requestTenantId: tenantId,
        requestTenantIdType: typeof tenantId
      });

      // Primero verificar que el pago existe y pertenece al tenant
      const payment = await PaymentService.getPaymentById(paymentId);
      
      if (!payment) {
        // Intentar obtener pagos pendientes para dar una mejor sugerencia
        const pendingPayments = await PaymentService.getCheckoutPayments(tenantId, { status: 'pending' });
        
        let errorMessage = `El pago con ID ${paymentId} no existe.\n\n`;
        
        if (pendingPayments.length > 0) {
          const paymentsList = pendingPayments.map(p => ({
            id: p._id.toString(),
            orderNumber: p.order?.orderNumber,
            amount: p.amount,
            method: p.method,
            url: `/api/checkout/payments/${p._id}/approve`
          }));
          
          errorMessage += 'Pagos pendientes disponibles:\n';
          paymentsList.forEach(p => {
            errorMessage += `- Pago ID: ${p.id}\n`;
            errorMessage += `  Orden: ${p.orderNumber}\n`;
            errorMessage += `  Monto: ${p.amount}\n`;
            errorMessage += `  Método: ${p.method}\n`;
            errorMessage += `  URL para aprobar: ${p.url}\n`;
          });
        } else {
          errorMessage += 'No hay pagos pendientes para este tenant.';
        }
        
        throw new AppError(errorMessage, 404);
      }

      console.log('Verificación de pago:', {
        found: true,
        paymentTenant: payment.tenant,
        paymentTenantType: typeof payment.tenant,
        requestTenant: tenantId,
        status: payment.status
      });

      // Convertir el tenant del pago a string para comparación
      const paymentTenantStr = payment.tenant.toString();
      const requestTenantStr = tenantId.toString();

      console.log('Comparación de tenants:', {
        paymentTenant: paymentTenantStr,
        requestTenant: requestTenantStr,
        areEqual: paymentTenantStr === requestTenantStr
      });

      if (paymentTenantStr !== requestTenantStr) {
        throw new AppError('No tienes permiso para aprobar este pago', 403);
      }

      if (payment.status !== 'pending') {
        throw new AppError(`No se puede aprobar un pago en estado: ${payment.status}`, 400);
      }

      const updatedPayment = await PaymentService.approvePayment(
        paymentId,
        userId
      );
      
      console.log('Pago aprobado:', {
        paymentId: updatedPayment._id,
        status: updatedPayment.status,
        orderId: updatedPayment.order?._id
      });

      res.json({
        success: true,
        data: updatedPayment,
        message: 'Pago aprobado correctamente'
      });
    } catch (err) {
      console.error('Error aprobando pago:', {
        error: err.message,
        stack: err.stack,
        paymentId: req.params.paymentId,
        tenantId: req.user.tenantId
      });

      // Si es un error conocido, lo pasamos como está
      if (err instanceof AppError) {
        next(err);
      } else {
        // Si es un error no manejado, creamos un error genérico
        next(new AppError('Error al procesar la aprobación del pago', 500));
      }
    }
  }
}

module.exports = CheckoutController;