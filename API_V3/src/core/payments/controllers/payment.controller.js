const PaymentService = require('../services/payment.service');
const PaymentProcessor = require('../services/paymentProcessor.service');
const PaymentPolicy = require('../policies/payment.policy');
const validate = require('../validations/payment.validation');
const Payment = require('../models/payment.model');
const { createError } = require('../../../shared/errors.utils');

class PaymentController {

  async create(req, res, next) {
    try {
      const paymentData = {
        ...req.body,
        user: req.user.userId,
        tenant: req.user.tenantId,
        type: req.body.type || 'order_payment',
        proofImage: req.file?.path
      };

      console.log('[PaymentController] Creando pago:', {
        type: paymentData.type,
        tenant: paymentData.tenant,
        amount: paymentData.amount
      });

      const payment = await PaymentService.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error('[PaymentController] Error al crear pago:', error);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const payments = await PaymentService.findPaymentsByTenant(
        req.user.tenantId,
        req.query
      );
      
      res.json(payments);
    } catch (error) {
      next(error);
    }
  }

  async verifySubscription(req, res, next) {
    try {
      console.log('[PaymentController] Verificando suscripción:', {
        paymentId: req.params.id,
        userId: req.user.userId
      });

      const payment = await PaymentService.getPaymentById(req.params.id);
      if (!payment) {
        throw createError(404, 'Pago no encontrado');
      }

      console.log('[PaymentController] Pago encontrado:', {
        paymentId: payment._id,
        type: payment.type,
        status: payment.status,
        tenant: payment.tenant
      });

      PaymentPolicy.verifySubscription(req.user, payment);
      
      if (payment.type !== 'subscription') {
        throw createError(400, 'Este pago no es de tipo suscripción');
      }

      const updated = await PaymentService.verifyPayment(
        req.params.id,
        req.user.userId,
        true // isSubscription = true
      );
      
      console.log('[PaymentController] Pago verificado:', {
        paymentId: updated._id,
        status: updated.status
      });

      res.json(updated);
    } catch (error) {
      console.error('[PaymentController] Error al verificar suscripción:', error);
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);
      PaymentPolicy.reject(req.user, payment);
      
      const updated = await PaymentService.rejectPayment(
        req.params.id,
        req.user.userId,
        req.body.reason
      );
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async createAutomaticPayment(req, res, next) {
    try {
      const { amount, currency, paymentMethod } = req.body;
      const processor = new PaymentProcessor(req.user.tenantId);

      const result = await processor.processPayment(
        amount, 
        currency, 
        req.body
      );

      const payment = await Payment.create({
        tenant: req.user.tenantId,
        user: req.user.userId,
        amount,
        currency,
        type: 'subscription',
        status: result.status,
        externalId: result.paymentId,
        paymentMethod
      });

      res.status(201).json({
        ...payment.toObject(),
        approvalUrl: result.approvalUrl,
        qrCode: result.qrCode
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const { event_type, resource } = req.body;
      
      if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const payment = await Payment.findOneAndUpdate(
          { externalId: resource.id },
          { status: 'completed' },
          { new: true }
        );

        if (payment && payment.type === 'subscription') {
          await PaymentService.verifyPayment(
            payment._id,
            'system',
            true
          );
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      next(error);
    }
  }

  async updateManual(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id);
      if (!payment) throw createError(404, 'Pago no encontrado');
      // Solo el creador o admin/superadmin puede editar
      if (
        String(payment.user) !== String(req.user.userId) &&
        !['admin', 'superadmin'].includes(req.user.role?.name)
      ) {
        throw createError(403, 'No tienes permisos para editar este pago');
      }
      const updated = await PaymentService.updateManualPayment(
        req.params.id,
        req.user.userId,
        req.body
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async approveManual(req, res, next) {
    try {
      if (!['admin', 'superadmin'].includes(req.user.role?.name)) {
        throw createError(403, 'Solo admin o superadmin pueden aprobar pagos manuales');
      }
      const updated = await PaymentService.approveManualPayment(
        req.params.id,
        req.user.userId,
        req.body.notes
      );
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();