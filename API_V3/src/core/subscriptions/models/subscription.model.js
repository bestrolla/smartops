const mongoose = require('mongoose');

// Dentro de la definición del esquema: ajustar manejo de endDate en validación
const SubscriptionSchema = new mongoose.Schema({
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
    // La unicidad se maneja a nivel de aplicación para permitir historial
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'cancelled', 'expired', 'trial'],
    default: 'pending'
  },
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { 
  timestamps: true 
});

// Método para calcular la fecha de fin (1 mes desde la fecha de inicio)
SubscriptionSchema.methods.calculateEndDate = function() {
  const endDate = new Date(this.startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  return endDate;
};

// Middleware pre-save para actualizar endDate si no está definido
SubscriptionSchema.pre('validate', function(next) {
  if (!this.endDate) {
    this.endDate = this.calculateEndDate();
  }
  next();
});

// Middleware post-save para actualizar los features del tenant
SubscriptionSchema.post('save', async function(doc) {
  try {
    // Solo actualizamos los features si la suscripción está activa o en prueba
    if (doc.status === 'active' || doc.status === 'trial') {
      await doc.populate('plan');
      await doc.populate('tenant_id');
      
      if (doc.tenant_id && doc.plan) {
        // Actualizamos los features del tenant según el plan
        doc.tenant_id.features = {
          ...doc.tenant_id.features,
          ...doc.plan.features
        };
        await doc.tenant_id.save();
      }
    }
  } catch (error) {
    console.error('Error actualizando features del tenant:', error);
  }
});

// Middleware pre-update para manejar cambios de estado (corregir paréntesis y leer $set.status)
SubscriptionSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() || {};
  const status = update.status ?? (update.$set && update.$set.status);

  if (status === 'cancelled' || status === 'expired') {
    try {
      const subscription = await this.model.findOne(this.getQuery()).populate('tenant_id');
      if (subscription && subscription.tenant_id) {
        // Desactivamos todos los features cuando la suscripción se cancela o expira
        Object.keys(subscription.tenant_id.features).forEach(feature => {
          subscription.tenant_id.features[feature] = false;
        });
        await subscription.tenant_id.save();
      }
    } catch (error) {
      console.error('Error desactivando features del tenant:', error);
    }
  }
  next();
});

// NUEVO: Middleware post-update para sincronizar features al activar o cambiar plan
SubscriptionSchema.post('findOneAndUpdate', async function(doc) {
  try {
    if (!doc) return;

    // Si la suscripción quedó activa o en prueba, sincronizar features del tenant
    if (doc.status === 'active' || doc.status === 'trial') {
      await doc.populate('plan');
      await doc.populate('tenant_id');

      if (doc.tenant_id && doc.plan) {
        doc.tenant_id.features = {
          ...doc.tenant_id.features,
          ...doc.plan.features
        };
        await doc.tenant_id.save();
      }
    }
  } catch (error) {
    console.error('Error post-update sincronizando features del tenant:', error);
  }
});

SubscriptionSchema.index({ tenant_id: 1, status: 1 });
SubscriptionSchema.index({ payment_id: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);