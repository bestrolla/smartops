const mongoose = require('mongoose');

const qaFlowSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  automationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Automation',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Flujo de conversación
  flow: {
    welcome: {
      message: { type: String, required: true },
      options: [{
        text: String,
        value: String,
        nextStep: String
      }]
    },
    steps: [{
      id: { type: String, required: true },
      name: String,
      type: { 
        type: String, 
        enum: ['question', 'response', 'condition', 'action', 'end'],
        required: true 
      },
      
      // Para preguntas
      question: {
        text: String,
        inputType: { 
          type: String, 
          enum: ['text', 'number', 'email', 'phone', 'date', 'choice', 'multiple_choice'],
          default: 'text'
        },
        options: [{
          text: String,
          value: String
        }],
        validation: {
          required: { type: Boolean, default: false },
          minLength: Number,
          maxLength: Number,
          pattern: String,
          errorMessage: String
        }
      },
      
      // Para respuestas
      response: {
        text: String,
        media: {
          type: { type: String, enum: ['image', 'video', 'audio', 'document'] },
          url: String,
          caption: String
        }
      },
      
      // Para condiciones
      condition: {
        variable: String,
        operator: { type: String, enum: ['equals', 'contains', 'greater', 'less', 'regex'] },
        value: String,
        trueStep: String,
        falseStep: String
      },
      
      // Para acciones
      action: {
        type: { type: String, enum: ['save_data', 'send_email', 'create_lead', 'webhook', 'n8n_trigger'] },
        config: mongoose.Schema.Types.Mixed
      },
      
      // Navegación
      nextStep: String, // ID del siguiente paso
      previousStep: String // ID del paso anterior
    }]
  },
  
  // Configuración de comportamiento
  settings: {
    timeout: { type: Number, default: 300 }, // 5 minutos
    maxRetries: { type: Number, default: 3 },
    fallbackMessage: { type: String, default: 'Lo siento, no entendí tu respuesta. ¿Podrías intentar de nuevo?' },
    endMessage: { type: String, default: 'Gracias por tu tiempo. ¡Que tengas un excelente día!' },
    
    // Configuración de guardado de datos
    saveUserData: { type: Boolean, default: true },
    dataRetention: { type: Number, default: 365 }, // días
    
    // Configuración de análisis
    enableAnalytics: { type: Boolean, default: true },
    trackUserJourney: { type: Boolean, default: true }
  },
  
  // Variables personalizadas que se pueden usar en el flujo
  variables: [{
    name: String,
    type: { type: String, enum: ['string', 'number', 'boolean', 'date'] },
    defaultValue: String,
    description: String
  }],
  
  // Integraciones externas
  integrations: {
    n8n: {
      webhookUrl: String,
      workflowId: String,
      triggerOnStart: { type: Boolean, default: false },
      triggerOnEnd: { type: Boolean, default: true },
      sendUserData: { type: Boolean, default: true }
    },
    crm: {
      enabled: { type: Boolean, default: false },
      createContact: { type: Boolean, default: true },
      updateExisting: { type: Boolean, default: true },
      leadSource: String
    },
    email: {
      enabled: { type: Boolean, default: false },
      template: String,
      sendTo: [String], // emails adicionales
      sendCopy: { type: Boolean, default: false }
    }
  },
  
  // Estadísticas del flujo
  stats: {
    totalStarts: { type: Number, default: 0 },
    totalCompletions: { type: Number, default: 0 },
    totalDropoffs: { type: Number, default: 0 },
    avgCompletionTime: { type: Number, default: 0 }, // seconds
    stepAnalytics: [{
      stepId: String,
      visits: { type: Number, default: 0 },
      dropoffs: { type: Number, default: 0 },
      avgTimeSpent: { type: Number, default: 0 }
    }]
  },
  
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },
  
  version: { type: Number, default: 1 },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para rendimiento
qaFlowSchema.index({ tenantId: 1, status: 1 });
qaFlowSchema.index({ automationId: 1 });
qaFlowSchema.index({ tenantId: 1, 'stats.totalStarts': -1 });

// Virtual para calcular tasa de finalización
qaFlowSchema.virtual('completionRate').get(function() {
  if (this.stats.totalStarts === 0) return 0;
  return (this.stats.totalCompletions / this.stats.totalStarts) * 100;
});

// Virtual para calcular tasa de abandono
qaFlowSchema.virtual('dropoffRate').get(function() {
  if (this.stats.totalStarts === 0) return 0;
  return (this.stats.totalDropoffs / this.stats.totalStarts) * 100;
});

// Método para obtener el siguiente paso
qaFlowSchema.methods.getNextStep = function(currentStepId, userResponse = null) {
  const currentStep = this.flow.steps.find(step => step.id === currentStepId);
  if (!currentStep) return null;
  
  // Si es una condición, evaluar
  if (currentStep.type === 'condition' && currentStep.condition) {
    const condition = currentStep.condition;
    let result = false;
    
    switch (condition.operator) {
      case 'equals':
        result = userResponse === condition.value;
        break;
      case 'contains':
        result = userResponse && userResponse.includes(condition.value);
        break;
      case 'greater':
        result = parseFloat(userResponse) > parseFloat(condition.value);
        break;
      case 'less':
        result = parseFloat(userResponse) < parseFloat(condition.value);
        break;
      case 'regex':
        result = new RegExp(condition.value).test(userResponse);
        break;
    }
    
    const nextStepId = result ? condition.trueStep : condition.falseStep;
    return this.flow.steps.find(step => step.id === nextStepId);
  }
  
  // Para otros tipos, seguir el flujo normal
  if (currentStep.nextStep) {
    return this.flow.steps.find(step => step.id === currentStep.nextStep);
  }
  
  return null;
};

// Método para actualizar estadísticas
qaFlowSchema.methods.updateStats = function(event, stepId = null, timeSpent = null) {
  switch (event) {
    case 'start':
      this.stats.totalStarts += 1;
      break;
    case 'complete':
      this.stats.totalCompletions += 1;
      break;
    case 'dropout':
      this.stats.totalDropoffs += 1;
      break;
  }
  
  // Actualizar estadísticas del paso si se proporciona
  if (stepId) {
    let stepStat = this.stats.stepAnalytics.find(s => s.stepId === stepId);
    if (!stepStat) {
      stepStat = { stepId, visits: 0, dropoffs: 0, avgTimeSpent: 0 };
      this.stats.stepAnalytics.push(stepStat);
    }
    
    stepStat.visits += 1;
    
    if (event === 'dropout') {
      stepStat.dropoffs += 1;
    }
    
    if (timeSpent !== null) {
      stepStat.avgTimeSpent = (stepStat.avgTimeSpent + timeSpent) / 2;
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('QAFlow', qaFlowSchema); 