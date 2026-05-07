const { validationResult } = require('express-validator');
const ConversationMemory = require('../models/ConversationMemory');
const logger = require('../../../shared/logger');

class MemoryController {

  /**
   * Obtener memoria conversacional de un usuario
   */
  async getMemory(req, res) {
    try {
      const { userId } = req.params;
      const { tenantId } = req.user;
      const { platform, limit = 10 } = req.query;

      logger.info(`📚 Obteniendo memoria conversacional para usuario: ${userId}, platform: ${platform}`);

      // Construir filtros
      const filters = {
        userId,
        tenantId
      };

      if (platform) {
        filters.platform = platform;
      }

      // Obtener conversaciones recientes
      const conversations = await ConversationMemory.find(filters)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .select('userMessage botResponse context toolsUsed timestamp platform');

      logger.info(`✅ Se encontraron ${conversations.length} conversaciones`);

      res.json({
        success: true,
        data: conversations.reverse(), // Orden cronológico
        total: conversations.length,
        userId,
        platform: platform || 'all'
      });

    } catch (error) {
      logger.error('❌ Error obteniendo memoria conversacional:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo memoria conversacional',
        error: error.message
      });
    }
  }

  /**
   * Guardar nueva entrada en memoria conversacional
   */
  async saveMemory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { userId } = req.params;
      const { tenantId } = req.user;
      const {
        platform,
        userMessage,
        botResponse,
        context,
        toolsUsed,
        conversationId,
        metadata
      } = req.body;

      logger.info(`💾 Guardando memoria conversacional para usuario: ${userId}`);

      // Crear nueva entrada de memoria
      const memoryEntry = new ConversationMemory({
        userId,
        tenantId,
        conversationId: conversationId || `${userId}_${Date.now()}`,
        platform: platform || 'whatsapp',
        userMessage,
        botResponse,
        context: context || {},
        toolsUsed: toolsUsed || [],
        metadata: {
          messageLength: userMessage?.length || 0,
          responseTime: metadata?.responseTime || 0,
          language: metadata?.language || 'es',
          aiModel: metadata?.aiModel || 'gpt-4',
          processingTime: metadata?.processingTime || 0,
          ...metadata
        }
      });

      const savedMemory = await memoryEntry.save();

      logger.info(`✅ Memoria guardada exitosamente con ID: ${savedMemory._id}`);

      res.status(201).json({
        success: true,
        message: 'Memoria conversacional guardada exitosamente',
        data: {
          id: savedMemory._id,
          userId,
          conversationId: savedMemory.conversationId,
          timestamp: savedMemory.timestamp
        }
      });

    } catch (error) {
      logger.error('❌ Error guardando memoria conversacional:', error);
      res.status(500).json({
        success: false,
        message: 'Error guardando memoria conversacional',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de conversaciones
   */
  async getMemoryStats(req, res) {
    try {
      const { tenantId } = req.user;
      const { days = 30 } = req.query;

      logger.info(`📊 Obteniendo estadísticas de memoria para tenant: ${tenantId}, días: ${days}`);

      const stats = await ConversationMemory.getConversationStats(tenantId, parseInt(days));

      const result = stats[0] || {
        totalMessages: 0,
        uniqueUsers: 0,
        averageResponseTime: 0,
        platformStats: [],
        intentStats: []
      };

      // Procesar estadísticas por plataforma
      const platformCounts = {};
      result.platformStats?.forEach(item => {
        platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
      });

      // Procesar estadísticas por intención
      const intentCounts = {};
      result.intentStats?.forEach(item => {
        if (item.intent) {
          intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
        }
      });

      const formattedStats = {
        totalMessages: result.totalMessages,
        uniqueUsers: result.uniqueUsers,
        averageResponseTime: Math.round(result.averageResponseTime || 0),
        platformBreakdown: platformCounts,
        intentBreakdown: intentCounts,
        period: `${days} días`
      };

      logger.info(`✅ Estadísticas calculadas:`, formattedStats);

      res.json({
        success: true,
        data: formattedStats
      });

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas de memoria:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de memoria',
        error: error.message
      });
    }
  }

  /**
   * Eliminar memoria conversacional de un usuario
   */
  async clearMemory(req, res) {
    try {
      const { userId } = req.params;
      const { tenantId } = req.user;
      const { platform, olderThan } = req.query;

      logger.info(`🗑️ Eliminando memoria para usuario: ${userId}`);

      // Construir filtros para eliminar
      const deleteFilters = {
        userId,
        tenantId
      };

      if (platform) {
        deleteFilters.platform = platform;
      }

      if (olderThan) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
        deleteFilters.timestamp = { $lt: cutoffDate };
      }

      const deleteResult = await ConversationMemory.deleteMany(deleteFilters);

      logger.info(`✅ Se eliminaron ${deleteResult.deletedCount} entradas de memoria`);

      res.json({
        success: true,
        message: 'Memoria conversacional eliminada exitosamente',
        data: {
          deletedCount: deleteResult.deletedCount,
          userId,
          platform: platform || 'all',
          olderThan: olderThan || 'all'
        }
      });

    } catch (error) {
      logger.error('❌ Error eliminando memoria conversacional:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando memoria conversacional',
        error: error.message
      });
    }
  }

  /**
   * Obtener conversación completa por ID
   */
  async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const { tenantId } = req.user;

      logger.info(`🔍 Obteniendo conversación: ${conversationId}`);

      const conversation = await ConversationMemory.find({
        conversationId,
        tenantId
      })
      .sort({ timestamp: 1 })
      .select('userMessage botResponse context toolsUsed timestamp platform');

      if (conversation.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      }

      // Calcular estadísticas de la conversación
      const conversationStats = {
        totalMessages: conversation.length,
        duration: conversation.length > 1 ? 
          new Date(conversation[conversation.length - 1].timestamp) - new Date(conversation[0].timestamp) : 0,
        toolsUsed: [...new Set(conversation.flatMap(c => c.toolsUsed || []))],
        intents: [...new Set(conversation.map(c => c.context?.intent).filter(Boolean))],
        platform: conversation[0].platform
      };

      res.json({
        success: true,
        data: {
          conversationId,
          messages: conversation,
          stats: conversationStats
        }
      });

    } catch (error) {
      logger.error('❌ Error obteniendo conversación:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo conversación',
        error: error.message
      });
    }
  }

  /**
   * Exportar memoria conversacional para análisis
   */
  async exportMemory(req, res) {
    try {
      const { tenantId } = req.user;
      const { startDate, endDate, platform, format = 'json' } = req.query;

      logger.info(`📤 Exportando memoria conversacional para tenant: ${tenantId}`);

      // Construir filtros de fecha
      const dateFilters = { tenantId };
      
      if (startDate || endDate) {
        dateFilters.timestamp = {};
        if (startDate) dateFilters.timestamp.$gte = new Date(startDate);
        if (endDate) dateFilters.timestamp.$lte = new Date(endDate);
      }

      if (platform) {
        dateFilters.platform = platform;
      }

      const conversations = await ConversationMemory.find(dateFilters)
        .sort({ timestamp: -1 })
        .limit(10000) // Límite de seguridad
        .select('userId conversationId userMessage botResponse context toolsUsed timestamp platform');

      if (format === 'csv') {
        // Formato CSV para análisis
        const csvHeader = 'userId,conversationId,timestamp,platform,userMessage,botResponse,intent,toolsUsed\n';
        const csvData = conversations.map(conv => {
          const userMessage = (conv.userMessage || '').replace(/"/g, '""');
          const botResponse = (conv.botResponse || '').replace(/"/g, '""');
          const intent = conv.context?.intent || '';
          const tools = (conv.toolsUsed || []).join(';');
          
          return `"${conv.userId}","${conv.conversationId}","${conv.timestamp}","${conv.platform}","${userMessage}","${botResponse}","${intent}","${tools}"`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="conversation_memory_${Date.now()}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        // Formato JSON
        res.json({
          success: true,
          data: conversations,
          total: conversations.length,
          exportDate: new Date().toISOString(),
          filters: { startDate, endDate, platform }
        });
      }

    } catch (error) {
      logger.error('❌ Error exportando memoria conversacional:', error);
      res.status(500).json({
        success: false,
        message: 'Error exportando memoria conversacional',
        error: error.message
      });
    }
  }

}

module.exports = new MemoryController(); 