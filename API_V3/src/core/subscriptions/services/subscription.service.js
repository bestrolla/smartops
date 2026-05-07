const Subscription = require('../models/subscription.model');
const PlanService = require('../../plans/services/plan.service');

class SubscriptionService {
  static async createSubscription(tenantId, planId, paymentId = null) {
    console.log('[SubscriptionService] Creando suscripción:', {
      tenantId,
      planId,
      paymentId
    });

    const plan = await PlanService.getPlanById(planId);
    if (!plan) {
      throw new Error('Plan no encontrado.');
    }

    // Calcular fecha de fin (1 mes desde ahora)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const newSubscription = await Subscription.create({
      tenant_id: tenantId,
      plan: plan._id,
      startDate,
      endDate,
      payment_id: paymentId,
      // NUEVO: activar directamente si el plan es gratuito
      status: paymentId ? 'active' : (plan.price === 0 ? 'active' : 'pending')
    });

    console.log('[SubscriptionService] Suscripción creada:', {
      subscriptionId: newSubscription._id,
      status: newSubscription.status,
      endDate: newSubscription.endDate
    });

    return newSubscription;
  }

  static async getSubscriptionByTenant(tenantId) {
    return Subscription.findOne({ tenant_id: tenantId })
      .populate('plan')
      .populate('payment_id')
      .sort({ endDate: -1 });
  }

  static async updateSubscription(tenantId, subscriptionId, updateData) {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: subscriptionId, tenant_id: tenantId },
      { $set: updateData },
      { new: true }
    ).populate('plan').populate('payment_id');

    if (!subscription) {
      throw new Error(`Suscripción no encontrada o no pertenece al tenant ${tenantId}`);
    }
    return subscription;
  }

  static async updateSubscriptionStatus(subscriptionId, newStatus) {
    return Subscription.findByIdAndUpdate(
      subscriptionId, 
      { status: newStatus }, 
      { new: true }
    );
  }

  static async processPaymentForSubscription(payment) {
    console.log('[SubscriptionService] Procesando pago de suscripción:', {
      paymentId: payment._id,
      tenant: payment.tenant,
      type: payment.type,
      status: payment.status
    });

    // Validar que el pago sea de tipo suscripción y esté completado
    if (payment.type !== 'subscription' || payment.status !== 'completed') {
      console.error('[SubscriptionService] Pago inválido:', {
        paymentId: payment._id,
        type: payment.type,
        status: payment.status
      });
      throw new Error('El pago debe ser de tipo suscripción y estar completado');
    }

    // Buscar la suscripción pendiente para este tenant
    const subscription = await Subscription.findOne({
      tenant_id: payment.tenant,
      status: 'pending'
    });

    if (!subscription) {
      console.error('[SubscriptionService] No se encontró suscripción pendiente:', {
        tenant: payment.tenant,
        paymentId: payment._id
      });
      throw new Error('No se encontró una suscripción pendiente para este tenant');
    }

    console.log('[SubscriptionService] Suscripción encontrada:', {
      subscriptionId: subscription._id,
      tenant: subscription.tenant_id,
      status: subscription.status
    });

    // Actualizar la suscripción
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscription._id,
      {
        status: 'active',
        payment_id: payment._id,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedSubscription) {
      console.error('[SubscriptionService] Error al actualizar la suscripción:', {
        subscriptionId: subscription._id,
        paymentId: payment._id
      });
      throw new Error('Error al actualizar la suscripción');
    }

    console.log('[SubscriptionService] Suscripción actualizada exitosamente:', {
      subscriptionId: updatedSubscription._id,
      status: updatedSubscription.status,
      paymentId: updatedSubscription.payment_id
    });

    return updatedSubscription;
  }

  static async changePlan(tenantId, newPlanId) {
    console.log('[SubscriptionService] Cambiando plan:', {
      tenantId,
      newPlanId
    });

    // Verificar que el nuevo plan existe
    const newPlan = await PlanService.getPlanById(newPlanId);
    if (!newPlan) {
      throw new Error('El plan seleccionado no existe.');
    }

    // Buscar la suscripción actual del tenant
    const currentSubscription = await Subscription.findOne({ tenant_id: tenantId }).populate('plan');

    if (currentSubscription) {
      // Si hay una suscripción existente, actualizarla
      console.log('[SubscriptionService] Actualizando suscripción existente:', {
        subscriptionId: currentSubscription._id,
        currentPlan: currentSubscription.plan?.name,
        currentPrice: currentSubscription.plan?.price,
        newPlan: newPlan.name,
        newPrice: newPlan.price
      });

      // Determinar el nuevo estado basado en el precio del plan
      let newStatus = 'pending'; // Por defecto requiere verificación de pago
      let newPaymentId = null;

      // Si el nuevo plan es gratuito o cuesta lo mismo o menos, activar directamente
      if (newPlan.price === 0 || 
          (currentSubscription.plan && newPlan.price <= currentSubscription.plan.price)) {
        newStatus = 'active';
        // Mantener el payment_id actual si existe
        newPaymentId = currentSubscription.payment_id;
        console.log('[SubscriptionService] Plan gratuito o downgrade - activando directamente');
      } else {
        console.log('[SubscriptionService] Upgrade con costo - requiere verificación de pago');
      }

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        currentSubscription._id,
        {
          plan: newPlanId,
          status: newStatus,
          payment_id: newPaymentId,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('plan').populate('payment_id');

      console.log('[SubscriptionService] Suscripción actualizada:', {
        subscriptionId: updatedSubscription._id,
        newPlan: updatedSubscription.plan?.name,
        status: updatedSubscription.status,
        requiresPayment: newStatus === 'pending'
      });

      return updatedSubscription;
    } else {
      // Si no hay suscripción, crear una nueva
      console.log('[SubscriptionService] Creando nueva suscripción para cambio de plan');
      return await this.createSubscription(tenantId, newPlanId);
    }
  }

  static async getActiveSubscription(tenantId) {
    return Subscription.findOne({
      tenant_id: tenantId,
      status: 'active',
      endDate: { $gte: new Date() }
    }).populate('plan').populate('payment_id');
  }

  static async createSubscriptionWithPayment(tenantId, userId, planId, paymentData, proofFile) {
    const mongoose = require('mongoose');
    const Payment = require('../../payments/models/payment.model');
    const fileUploadService = require('../../file-uploads/services/fileUpload.service');
    const { createError } = require('../../../shared/errors.utils');
    
    console.log('[SubscriptionService] Creando suscripción con pago:', {
      tenantId,
      userId,
      planId,
      paymentData,
      hasProofFile: !!proofFile
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Verificar que el plan existe
      const PlanService = require('../../plans/services/plan.service');
      const plan = await PlanService.getPlanById(planId);
      if (!plan) {
        throw createError(404, 'Plan no encontrado.');
      }

      // 2. Verificar si hay pagos pendientes para este tenant
      const pendingPayments = await Payment.find({
        tenant: tenantId,
        status: 'pending',
        type: 'subscription'
      });

      if (pendingPayments.length > 0) {
        throw createError(409, 'Ya tienes un pago pendiente de aprobación. Por favor espera a que sea procesado antes de cambiar de plan.');
      }

      // 3. Obtener suscripción actual para comparar
      const currentSubscription = await Subscription.findOne({ tenant_id: tenantId }).populate('plan');
      
      // 4. Determinar si requiere pago basado en lógica de negocio
      let requiresPayment = false;
      let requiresProof = false;
      
      if (!currentSubscription) {
        // Primera suscripción
        requiresPayment = plan.price > 0;
        requiresProof = requiresPayment;
      } else {
        // Cambio de plan existente
        const currentPrice = currentSubscription.plan?.price || 0;
        const newPrice = plan.price;
        
        if (newPrice > currentPrice) {
          // Upgrade - siempre requiere pago y comprobante
          requiresPayment = true;
          requiresProof = true;
        } else if (newPrice < currentPrice) {
          // Downgrade - puede requerir aprobación administrativa
          requiresPayment = false;
          requiresProof = false; // El administrador puede configurar esto
        } else {
          // Mismo precio - cambio lateral, puede requerir aprobación
          requiresPayment = false;
          requiresProof = false;
        }
      }

      // 5. Validar comprobante si es requerido
      if (requiresProof && !proofFile) {
        throw createError(400, 'Este cambio de plan requiere un comprobante de pago.');
      }

      console.log('[SubscriptionService] Validación de plan:', {
        currentPrice: currentSubscription?.plan?.price || 0,
        newPrice: plan.price,
        requiresPayment,
        requiresProof,
        hasProofFile: !!proofFile
      });

      // 6. Crear o actualizar la suscripción basado en validaciones
      let subscription = currentSubscription;
      
      // Determinar el estado de la suscripción
      let subscriptionStatus;
      if (!requiresPayment) {
        // Downgrades o cambios que no requieren pago
        subscriptionStatus = 'active';
      } else if (requiresPayment && proofFile) {
        // Upgrades con comprobante proporcionado
        subscriptionStatus = 'active'; // Se activa automáticamente con comprobante
      } else {
        // Upgrades sin comprobante
        subscriptionStatus = 'pending';
      }
      
      if (subscription) {
        // Actualizar suscripción existente
        subscription = await Subscription.findByIdAndUpdate(
          subscription._id,
          {
            plan: planId,
            status: subscriptionStatus,
            updatedAt: new Date()
          },
          { new: true, session }
        );
      } else {
        // Crear nueva suscripción
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        subscription = await Subscription.create([{
          tenant_id: tenantId,
          plan: planId,
          startDate,
          endDate,
          status: subscriptionStatus
        }], { session });
        subscription = subscription[0];
      }

      // 7. Si no requiere pago, no crear pago
      if (!requiresPayment) {
        await session.commitTransaction();
        session.endSession();
        
        console.log('[SubscriptionService] Cambio de plan completado sin pago requerido:', {
          subscriptionId: subscription._id,
          status: subscription.status,
          reason: 'Downgrade o plan gratuito'
        });
        
        return {
          subscription: await Subscription.findById(subscription._id).populate('plan'),
          payment: null
        };
      }

      // 4. Subir comprobante de pago si existe
      let proofImage = null;
      if (proofFile) {
        try {
          console.log('[SubscriptionService] Procesando archivo:', {
            filename: proofFile.filename,
            originalname: proofFile.originalname,
            path: proofFile.path,
            size: proofFile.size
          });
          
          // Mover archivo desde temp a ubicación permanente
          const finalUrl = await fileUploadService.moveToPermanent(
            tenantId, 
            proofFile.filename, 
            'payments'
          );
          
          proofImage = {
            fileName: proofFile.filename,
            originalName: proofFile.originalname,
            path: proofFile.path,
            size: proofFile.size,
            mimetype: proofFile.mimetype,
            url: finalUrl
          };
          
          console.log('[SubscriptionService] Archivo procesado exitosamente:', {
            finalUrl,
            proofImage
          });
        } catch (uploadError) {
          console.error('[SubscriptionService] Error al subir comprobante:', uploadError);
          throw createError(400, 'Error al subir el comprobante de pago');
        }
      }

      // 5. Crear pago (completado si se proporciona comprobante)
      const paymentStatus = proofImage ? 'completed' : 'pending';
      
      const payment = await Payment.create([{
        tenant: tenantId,
        user: userId,
        subscription: subscription._id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        type: paymentData.type,
        method: paymentData.method,
        status: paymentStatus,
        transactionId: paymentData.transactionId,
        notes: paymentData.notes,
        proofImage
      }], { session });

      // 6. Actualizar suscripción con el ID del pago
      subscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        { payment_id: payment[0]._id },
        { new: true, session }
      );

      await session.commitTransaction();
      session.endSession();

      console.log('[SubscriptionService] Suscripción y pago creados exitosamente:', {
        subscriptionId: subscription._id,
        paymentId: payment[0]._id,
        subscriptionStatus: subscription.status,
        paymentStatus: payment[0].status
      });

      return {
        subscription: await Subscription.findById(subscription._id).populate('plan'),
        payment: payment[0]
      };

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      
      console.error('[SubscriptionService] Error en createSubscriptionWithPayment:', error);
      throw error;
    }
  }

  // NUEVO: crear suscripción de prueba por 7 días
  static async createTrialSubscription(tenantId, planId = null) {
    // Preferir plan de Trial (7 días) si existe; si no, usar el más barato
    let plan;
    if (planId) {
      plan = await PlanService.getPlanById(planId);
    } else {
      const Plan = require('../../plans/models/plan.model');
      const trialPlan = await Plan.findOne({ name: 'Trial (7 días)', isActive: true }).sort({ price: 1 });
      plan = trialPlan || await PlanService.getCheapestActivePlan();
    }
    if (!plan) {
      throw new Error('No hay planes activos para crear la prueba.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);

    const trialSub = await Subscription.create({
      tenant_id: tenantId,
      plan: plan._id,
      startDate,
      endDate,
      status: 'trial',
      payment_id: null,
      metadata: { source: 'signup', durationDays: 14 }
    });

    return trialSub;
  }
}

module.exports = SubscriptionService;