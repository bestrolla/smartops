const mongoose = require('mongoose');

const conversationMemorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  platform: {
    type: String,
    enum: ['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat'],
    default: 'whatsapp'
  },
  
  // Mensaje del usuario
  userMessage: {
    type: String,
    required: true
  },
  
  // Respuesta del bot
  botResponse: {
    type: String,
    required: true
  },
  
  // Contexto e intención
  context: {
    intent: String,
    entities: mongoose.Schema.Types.Mixed,
    confidence: Number,
    urgency: Boolean,
    isFirstMessage: Boolean
  },
  
  // Herramientas utilizadas
  toolsUsed: [String],
  
  // Metadatos adicionales
  metadata: {
    messageLength: Number,
    responseTime: Number,
    language: String,
    aiModel: String,
    processingTime: Number
  },
  
  // Marcas de tiempo
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
  
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
conversationMemorySchema.index({ userId: 1, platform: 1, timestamp: -1 });
conversationMemorySchema.index({ tenantId: 1, timestamp: -1 });
conversationMemorySchema.index({ conversationId: 1, timestamp: -1 });

// TTL - Eliminar conversaciones después de 90 días
conversationMemorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 días

// Método para obtener conversaciones recientes
conversationMemorySchema.statics.getRecentConversations = function(userId, platform, limit = 10) {
  return this.find({
    userId,
    platform
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('userMessage botResponse context toolsUsed timestamp');
};

// Método para obtener estadísticas de conversación
conversationMemorySchema.statics.getConversationStats = function(tenantId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        averageResponseTime: { $avg: '$metadata.responseTime' },
        platformStats: {
          $push: {
            platform: '$platform',
            count: 1
          }
        },
        intentStats: {
          $push: {
            intent: '$context.intent',
            count: 1
          }
        }
      }
    },
    {
      $project: {
        totalMessages: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        averageResponseTime: 1,
        platformStats: 1,
        intentStats: 1
      }
    }
  ]);
};

module.exports = mongoose.model('ConversationMemory', conversationMemorySchema); 