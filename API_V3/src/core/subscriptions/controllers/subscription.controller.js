const SubscriptionService = require('../services/subscription.service');
const { createError } = require('../../../shared/errors.utils');

class SubscriptionController {
  async create(req, res, next) {
    try {
      console.log('[SubscriptionController] Creando suscripción:', {
        tenantId: req.user.tenantId,
        planId: req.body.planId
      });

      const newSubscription = await SubscriptionService.createSubscription(
        req.user.tenantId,
        req.body.planId
      );

      console.log('[SubscriptionController] Suscripción creada:', {
        subscriptionId: newSubscription._id,
        status: newSubscription.status
      });

      res.status(201).json(newSubscription);
    } catch (error) {
      console.error('[SubscriptionController] Error al crear suscripción:', error);
      next(error);
    }
  }

  async getByTenant(req, res, next) {
    try {
      console.log('[SubscriptionController] Obteniendo suscripción del tenant:', {
        tenantId: req.user.tenantId
      });

      const subscription = await SubscriptionService.getSubscriptionByTenant(req.user.tenantId);
      
      if (!subscription) {
        throw createError(404, 'No se encontró una suscripción para este tenant');
      }

      console.log('[SubscriptionController] Suscripción encontrada:', {
        subscriptionId: subscription._id,
        status: subscription.status
      });

      res.json(subscription);
    } catch (error) {
      console.error('[SubscriptionController] Error al obtener suscripción:', error);
      next(error);
    }
  }

  async changePlan(req, res, next) {
    try {
      console.log('[SubscriptionController] Cambiando plan:', {
        tenantId: req.user.tenantId,
        newPlanId: req.body.planId
      });

      const updatedSubscription = await SubscriptionService.changePlan(
        req.user.tenantId,
        req.body.planId
      );

      console.log('[SubscriptionController] Plan cambiado exitosamente:', {
        subscriptionId: updatedSubscription._id,
        newPlan: updatedSubscription.plan,
        status: updatedSubscription.status
      });

      res.status(200).json(updatedSubscription);
    } catch (error) {
      console.error('[SubscriptionController] Error al cambiar plan:', error);
      next(error);
    }
  }

  async createWithPayment(req, res, next) {
    try {
      console.log('[SubscriptionController] Creando suscripción con pago:', {
        tenantId: req.user.tenantId,
        planId: req.body.planId,
        paymentData: {
          amount: req.body.amount,
          method: req.body.method,
          type: req.body.type
        },
        hasProofImage: !!req.file
      });

      const result = await SubscriptionService.createSubscriptionWithPayment(
        req.user.tenantId,
        req.user.userId,
        req.body.planId,
        {
          amount: parseFloat(req.body.amount),
          method: req.body.method,
          type: req.body.type || 'subscription',
          currency: req.body.currency || 'USD',
          transactionId: req.body.transactionId,
          notes: req.body.notes
        },
        req.file // Comprobante de pago
      );

      console.log('[SubscriptionController] Suscripción creada (con o sin pago):', {
        subscriptionId: result?.subscription?._id,
        subscriptionStatus: result?.subscription?.status,
        paymentId: result?.payment?._id || null,
        paymentStatus: result?.payment?.status || 'none'
      });

      res.status(201).json(result);
    } catch (error) {
      console.error('[SubscriptionController] Error al crear suscripción con pago:', error);
      next(error);
    }
  }

  async updateSubscription(req, res) {
    const { tenant_id, subscription_id } = req.params;
    const updateData = req.body;

    try {
      const updatedSubscription = await SubscriptionService.updateSubscription(tenant_id, subscription_id, updateData);
      res.status(200).json(updatedSubscription);
    } catch (error) {
      console.error('Error updating subscription:', error);
      if (error.message.includes('Suscripción no encontrada')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error updating subscription', error: error.message });
    }
  }
}

module.exports = new SubscriptionController();