const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['chatbot', 'social_media', 'email', 'workflow', 'trigger'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  // Configuración específica del tipo de automatización
  config: {
    // Para chatbots
    platforms: [{
      type: String,
      enum: ['whatsapp', 'telegram', 'instagram', 'facebook', 'website']
    }],
    
    // Configuración de n8n
    n8nWorkflowId: String,
    n8nWebhookUrl: String,
    
    // Configuración de respuestas
    defaultResponse: String,
    fallbackResponse: String,
    
    // Horarios de funcionamiento
    workingHours: {
      enabled: { type: Boolean, default: true },
      timezone: { type: String, default: 'America/Mexico_City' },
      schedule: [{
        day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
        startTime: String,
        endTime: String,
        enabled: { type: Boolean, default: true }
      }]
    },
    
    // Configuración de redes sociales
    socialMediaConfig: {
      autoResponse: { type: Boolean, default: true },
      responseDelay: { type: Number, default: 2 }, // segundos
      maxResponsesPerUser: { type: Number, default: 10 },
      blacklistedWords: [String],
      whitelistedUsers: [String]
    }
  },
  
  // Métricas y estadísticas
  metrics: {
    totalInteractions: { type: Number, default: 0 },
    successfulResponses: { type: Number, default: 0 },
    failedResponses: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }, // milliseconds
    lastExecution: Date,
    lastError: {
      message: String,
      timestamp: Date,
      details: mongoose.Schema.Types.Mixed
    }
  },
  
  // Configuración avanzada
  advanced: {
    retryAttempts: { type: Number, default: 3 },
    timeout: { type: Number, default: 30000 }, // 30 seconds
    rateLimiting: {
      enabled: { type: Boolean, default: true },
      maxRequests: { type: Number, default: 100 },
      windowMs: { type: Number, default: 60000 } // 1 minute
    },
    logging: {
      enabled: { type: Boolean, default: true },
      level: { type: String, enum: ['error', 'warn', 'info', 'debug'], default: 'info' }
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar rendimiento
automationSchema.index({ tenantId: 1, type: 1 });
automationSchema.index({ tenantId: 1, status: 1 });
automationSchema.index({ 'config.n8nWorkflowId': 1 });

// Middleware para actualizar métricas
automationSchema.methods.updateMetrics = function(success, responseTime, error = null) {
  this.metrics.totalInteractions += 1;
  
  if (success) {
    this.metrics.successfulResponses += 1;
  } else {
    this.metrics.failedResponses += 1;
    if (error) {
      this.metrics.lastError = {
        message: error.message,
        timestamp: new Date(),
        details: error
      };
    }
  }
  
  // Calcular tiempo promedio de respuesta
  const totalSuccessful = this.metrics.successfulResponses;
  if (totalSuccessful > 0) {
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (totalSuccessful - 1) + responseTime) / totalSuccessful
    );
  }
  
  this.metrics.lastExecution = new Date();
  return this.save();
};

// Virtual para calcular tasa de éxito
automationSchema.virtual('successRate').get(function() {
  if (this.metrics.totalInteractions === 0) return 0;
  return (this.metrics.successfulResponses / this.metrics.totalInteractions) * 100;
});

module.exports = mongoose.model('Automation', automationSchema); 