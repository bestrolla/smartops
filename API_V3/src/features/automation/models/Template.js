const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true,
    enum: ['basic', 'ai-agent', 'ecommerce', 'appointment', 'support', 'lead-generation', 'healthcare', 'finance'],
    default: 'basic'
  },

  difficulty: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    default: 'basic'
  },

  // Referencia al workflow en n8n
  n8nWorkflowId: {
    type: String,
    required: true,
    unique: true
  },

  // Configuración de IA si aplica
  aiConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    model: {
      type: String,
      enum: ['none', 'gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'claude-3-haiku'],
      default: 'gpt-3.5-turbo'
    },
    systemPrompt: {
      type: String,
      default: 'Eres un asistente virtual útil y amigable.'
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 500
    },
    features: [{
      type: String,
      enum: [
        'conversation-memory', 
        'sentiment-analysis', 
        'intent-recognition', 
        'entity-extraction',
        'emergency-detection',
        'financial-calculations'
      ]
    }]
  },

  // Plataformas soportadas
  platforms: [{
    type: String,
    enum: ['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat'],
    default: ['whatsapp']
  }],

  // Variables configurables del template
  variables: [{
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'textarea'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: mongoose.Schema.Types.Mixed,
    options: [String], // Para tipo 'select'
    description: String
  }],

  // Características del template
  features: [{
    type: String,
    enum: [
      'ai-powered',
      'multi-platform',
      'appointment-booking',
      'lead-capture',
      'order-processing',
      'customer-support',
      'faq-automation',
      'context-aware',
      'multilingual',
      'conversation-memory',
      'sentiment-analysis',
      'medical-triage',
      'emergency-detection',
      'financial-analysis',
      'risk-assessment'
    ]
  }],

  // Métricas de uso
  usage: {
    totalClones: {
      type: Number,
      default: 0
    },
    activeInstances: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    reviews: [{
      user: String,
      rating: Number,
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Configuración de preview
  preview: {
    thumbnail: String,
    screenshots: [String],
    demoUrl: String,
    videoUrl: String
  },

  // Metadata
  tags: [String],
  
  isPublic: {
    type: Boolean,
    default: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Información del creador
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  version: {
    type: String,
    default: '1.0.0'
  },

  changelog: [{
    version: String,
    changes: [String],
    date: {
      type: Date,
      default: Date.now
    }
  }]

}, {
  timestamps: true
});

// Índices
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ 'aiConfig.enabled': 1 });
templateSchema.index({ platforms: 1 });
templateSchema.index({ features: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ 'usage.rating': -1 });

// Métodos del schema
templateSchema.methods.incrementClones = function() {
  this.usage.totalClones += 1;
  this.usage.activeInstances += 1;
  return this.save();
};

templateSchema.methods.decrementActiveInstances = function() {
  if (this.usage.activeInstances > 0) {
    this.usage.activeInstances -= 1;
  }
  return this.save();
};

templateSchema.methods.addReview = function(review) {
  this.usage.reviews.push(review);
  
  // Recalcular rating promedio
  const totalRating = this.usage.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.usage.rating = totalRating / this.usage.reviews.length;
  
  return this.save();
};

// Statics
templateSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true, isPublic: true })
    .select('-n8nWorkflowId') // No exponer el ID interno de n8n
    .sort({ 'usage.rating': -1, 'usage.totalClones': -1 });
};

templateSchema.statics.getAITemplates = function() {
  return this.find({ 'aiConfig.enabled': true, isActive: true, isPublic: true })
    .select('-n8nWorkflowId')
    .sort({ 'usage.rating': -1 });
};

templateSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { isActive: true, isPublic: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { features: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).select('-n8nWorkflowId');
};

module.exports = mongoose.model('Template', templateSchema); 