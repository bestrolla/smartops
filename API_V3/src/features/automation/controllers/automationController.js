const Automation = require('../models/Automation');
const QAFlow = require('../models/QAFlow');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();
const { validationResult } = require('express-validator');

class AutomationController {
  
  // =================== AUTOMATIZACIONES ===================

  /**
   * Obtener todas las automatizaciones del tenant
   */
  async getAutomations(req, res) {
    try {
      const { tenantId } = req.user;
      const { type, status, page = 1, limit = 10 } = req.query;

      // Verificar que el usuario tenga un tenantId válido
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no tiene un tenant asignado'
        });
      }

      const filter = { tenantId };
      if (type) filter.type = type;
      if (status) filter.status = status;

      const automations = await Automation.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Automation.countDocuments(filter);

      res.json({
        success: true,
        data: automations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo automatizaciones',
        error: error.message
      });
    }
  }

  /**
   * Obtener una automatización específica
   */
  async getAutomation(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const automation = await Automation.findOne({ _id: id, tenantId })
        .populate('createdBy', 'name email');

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      // Obtener información del workflow de n8n si existe
      let n8nWorkflow = null;
      if (automation.config.n8nWorkflowId) {
        try {
          n8nWorkflow = await N8nService.getWorkflow(automation.config.n8nWorkflowId);
        } catch (error) {
          console.warn(`No se pudo obtener workflow n8n: ${error.message}`);
        }
      }

      res.json({
        success: true,
        data: {
          ...automation.toObject(),
          n8nWorkflow
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo automatización',
        error: error.message
      });
    }
  }

  /**
   * Crear nueva automatización
   */
  async createAutomation(req, res) {
    try {
      const { tenantId, userId } = req.user;
      const automationData = {
        ...req.body,
        tenantId,
        createdBy: userId
      };

      const automation = new Automation(automationData);
      await automation.save();

      res.status(201).json({
        success: true,
        message: 'Automatización creada exitosamente',
        data: automation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creando automatización',
        error: error.message
      });
    }
  }

  /**
   * Actualizar automatización
   */
  async updateAutomation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { tenantId } = req.user;

      const automation = await Automation.findOneAndUpdate(
        { _id: id, tenantId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Automatización actualizada exitosamente',
        data: automation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando automatización',
        error: error.message
      });
    }
  }

  /**
   * Eliminar automatización
   */
  async deleteAutomation(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const automation = await Automation.findOne({ _id: id, tenantId });

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      // Eliminar workflow de n8n si existe
      if (automation.config.n8nWorkflowId) {
        try {
          await N8nService.deleteWorkflow(automation.config.n8nWorkflowId);
        } catch (error) {
          console.warn(`No se pudo eliminar workflow n8n: ${error.message}`);
        }
      }

      // Eliminar flujos Q&A relacionados
      await QAFlow.deleteMany({ automationId: id });

      // Eliminar automatización
      await automation.deleteOne();

      res.json({
        success: true,
        message: 'Automatización eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando automatización',
        error: error.message
      });
    }
  }

  /**
   * Activar/Desactivar automatización
   */
  async toggleAutomation(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;
      const { active } = req.body;

      const automation = await Automation.findOne({ _id: id, tenantId });

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      // Actualizar estado en n8n si existe workflow
      if (automation.config.n8nWorkflowId) {
        try {
          await N8nService.toggleWorkflow(automation.config.n8nWorkflowId, active);
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: `Error ${active ? 'activando' : 'desactivando'} workflow en n8n`,
            error: error.message
          });
        }
      }

      // Actualizar estado local
      automation.status = active ? 'active' : 'inactive';
      await automation.save();

      res.json({
        success: true,
        message: `Automatización ${active ? 'activada' : 'desactivada'} exitosamente`,
        data: automation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado de automatización',
        error: error.message
      });
    }
  }

  // =================== ESTADÍSTICAS ===================

  /**
   * Obtener estadísticas de automatizaciones
   */
  async getAutomationStats(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;

      const automation = await Automation.findOne({ _id: id, tenantId });

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      // Obtener estadísticas de n8n si existe workflow
      let n8nStats = null;
      if (automation.config.n8nWorkflowId) {
        try {
          n8nStats = await N8nService.getWorkflowStats(automation.config.n8nWorkflowId);
        } catch (error) {
          console.warn(`No se pudieron obtener estadísticas n8n: ${error.message}`);
        }
      }

      // Combinar estadísticas locales con n8n
      const stats = {
        local: {
          totalInteractions: automation.metrics.totalInteractions,
          successfulResponses: automation.metrics.successfulResponses,
          failedResponses: automation.metrics.failedResponses,
          avgResponseTime: automation.metrics.avgResponseTime,
          successRate: automation.successRate,
          lastExecution: automation.metrics.lastExecution
        },
        n8n: n8nStats
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de todas las automatizaciones
   */
  async getDashboardStats(req, res) {
    try {
      const { tenantId } = req.user;

      const totalAutomations = await Automation.countDocuments({ tenantId });
      const activeAutomations = await Automation.countDocuments({ 
        tenantId, 
        status: 'active' 
      });

      res.json({
        success: true,
        data: {
          summary: {
            totalAutomations,
            activeAutomations,
            inactiveAutomations: totalAutomations - activeAutomations
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas del dashboard',
        error: error.message
      });
    }
  }

  // =================== N8N INTEGRATION ===================

  /**
   * Sincronizar con n8n
   */
  async syncWithN8n(req, res) {
    try {
      const { tenantId } = req.user;

      // Verificar conexión con n8n
      const healthCheck = await N8nService.healthCheck();
      
      if (healthCheck.status !== 'healthy') {
        return res.status(503).json({
          success: false,
          message: 'n8n no está disponible',
          error: healthCheck.error
        });
      }

      // Obtener workflows de n8n
      const n8nWorkflows = await N8nService.getWorkflows();

      // Obtener automatizaciones locales con workflow n8n
      const automations = await Automation.find({
        tenantId,
        'config.n8nWorkflowId': { $exists: true, $ne: null }
      });

      const syncResults = {
        synchronized: 0,
        errors: []
      };

      // Sincronizar cada automatización
      for (const automation of automations) {
        try {
          const n8nWorkflow = n8nWorkflows.data?.find(
            w => w.id === automation.config.n8nWorkflowId
          );

          if (n8nWorkflow) {
            // Actualizar estado basado en n8n
            const newStatus = n8nWorkflow.active ? 'active' : 'inactive';
            
            if (automation.status !== newStatus) {
              automation.status = newStatus;
              await automation.save();
              syncResults.synchronized++;
            }

            // Obtener estadísticas recientes
            const stats = await N8nService.getWorkflowStats(automation.config.n8nWorkflowId, 1);
            if (stats.totalExecutions > 0) {
              await automation.updateMetrics(
                stats.successfulExecutions > 0,
                stats.avgExecutionTime,
                stats.failedExecutions > 0 ? { message: 'Sync from n8n' } : null
              );
            }
          }
        } catch (error) {
          syncResults.errors.push({
            automationId: automation._id,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: 'Sincronización completada',
        data: {
          n8nStatus: healthCheck,
          syncResults
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sincronizando con n8n',
        error: error.message
      });
    }
  }

  /**
   * Procesar webhook desde n8n
   */
  async processWebhook(req, res) {
    try {
      const { automationId } = req.params;
      const webhookData = req.body;

      const automation = await Automation.findById(automationId);

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      // Actualizar métricas
      const startTime = Date.now();
      const success = webhookData.success !== false;
      const responseTime = Date.now() - startTime;

      await automation.updateMetrics(success, responseTime, 
        success ? null : { message: webhookData.error || 'Webhook error' }
      );

      // Log de la interacción
      console.log(`Webhook procesado - Automation: ${automation.name}, Success: ${success}`);

      res.json({
        success: true,
        message: 'Webhook procesado correctamente',
        data: {
          automationId: automation._id,
          processed: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error procesando webhook',
        error: error.message
      });
    }
  }
}

module.exports = new AutomationController(); 