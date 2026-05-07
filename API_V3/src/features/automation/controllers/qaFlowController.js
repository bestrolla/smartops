const QAFlow = require('../models/QAFlow');
const Automation = require('../models/Automation');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();

class QAFlowController {

  // Obtener todos los flujos Q&A
  async getQAFlows(req, res) {
    try {
      const { tenantId } = req.user;
      const { automationId, status, page = 1, limit = 10 } = req.query;

      const filter = { tenantId };
      if (automationId) filter.automationId = automationId;
      if (status) filter.status = status;

      const flows = await QAFlow.find(filter)
        .populate('automationId', 'name type')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await QAFlow.countDocuments(filter);

      res.json({
        success: true,
        data: flows,
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
        message: 'Error obteniendo flujos Q&A',
        error: error.message
      });
    }
  }

  // Crear nuevo flujo Q&A
  async createQAFlow(req, res) {
    try {
      const { tenantId, userId } = req.user;
      
      // Verificar que la automatización existe
      const automation = await Automation.findOne({
        _id: req.body.automationId,
        tenantId
      });

      if (!automation) {
        return res.status(404).json({
          success: false,
          message: 'Automatización no encontrada'
        });
      }

      const flowData = {
        ...req.body,
        tenantId,
        createdBy: userId
      };

      const flow = new QAFlow(flowData);
      await flow.save();

      res.status(201).json({
        success: true,
        message: 'Flujo Q&A creado exitosamente',
        data: flow
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creando flujo Q&A',
        error: error.message
      });
    }
  }

  // Obtener un flujo específico
  async getQAFlow(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const flow = await QAFlow.findOne({ _id: id, tenantId })
        .populate('automationId', 'name type config')
        .populate('createdBy', 'name email');

      if (!flow) {
        return res.status(404).json({
          success: false,
          message: 'Flujo Q&A no encontrado'
        });
      }

      res.json({
        success: true,
        data: flow
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo flujo Q&A',
        error: error.message
      });
    }
  }

  // Procesar conversación con usuario
  async processConversation(req, res) {
    try {
      const { id } = req.params;
      const { userResponse, currentStep, sessionId } = req.body;

      const flow = await QAFlow.findById(id);

      if (!flow) {
        return res.status(404).json({
          success: false,
          message: 'Flujo Q&A no encontrado'
        });
      }

      let nextStep;
      let response = {};

      // Si no hay paso actual, comenzar con el welcome
      if (!currentStep) {
        response = {
          message: flow.flow.welcome.message,
          options: flow.flow.welcome.options,
          stepId: 'welcome',
          type: 'welcome'
        };

        // Actualizar estadísticas
        await flow.updateStats('start');
      } else {
        // Buscar el siguiente paso
        nextStep = flow.getNextStep(currentStep, userResponse);

        if (nextStep) {
          switch (nextStep.type) {
            case 'question':
              response = {
                message: nextStep.question.text,
                inputType: nextStep.question.inputType,
                options: nextStep.question.options,
                validation: nextStep.question.validation,
                stepId: nextStep.id,
                type: 'question'
              };
              break;

            case 'response':
              response = {
                message: nextStep.response.text,
                media: nextStep.response.media,
                stepId: nextStep.id,
                type: 'response'
              };
              break;

            case 'end':
              response = {
                message: flow.settings.endMessage,
                stepId: nextStep.id,
                type: 'end',
                completed: true
              };

              // Actualizar estadísticas de finalización
              await flow.updateStats('complete');
              break;

            default:
              response = {
                message: flow.settings.fallbackMessage,
                stepId: currentStep,
                type: 'fallback'
              };
          }
        } else {
          // No hay siguiente paso, finalizar o usar fallback
          response = {
            message: flow.settings.fallbackMessage,
            stepId: currentStep,
            type: 'fallback'
          };
        }
      }

      // Triggear n8n si está configurado
      if (flow.integrations.n8n.enabled && flow.integrations.n8n.webhookUrl) {
        try {
          await N8nService.triggerWebhook(flow.integrations.n8n.webhookUrl, {
            flowId: flow._id,
            sessionId,
            userResponse,
            currentStep,
            nextStep: response.stepId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Error triggering n8n webhook:', error.message);
        }
      }

      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error procesando conversación',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de un flujo
  async getFlowStats(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const flow = await QAFlow.findOne({ _id: id, tenantId });

      if (!flow) {
        return res.status(404).json({
          success: false,
          message: 'Flujo Q&A no encontrado'
        });
      }

      const stats = {
        overview: {
          totalStarts: flow.stats.totalStarts,
          totalCompletions: flow.stats.totalCompletions,
          totalDropoffs: flow.stats.totalDropoffs,
          completionRate: flow.completionRate,
          dropoffRate: flow.dropoffRate,
          avgCompletionTime: flow.stats.avgCompletionTime
        },
        stepAnalytics: flow.stats.stepAnalytics
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

  // Actualizar flujo Q&A
  async updateQAFlow(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const flow = await QAFlow.findOneAndUpdate(
        { _id: id, tenantId },
        req.body,
        { new: true, runValidators: true }
      );

      if (!flow) {
        return res.status(404).json({
          success: false,
          message: 'Flujo Q&A no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Flujo Q&A actualizado exitosamente',
        data: flow
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error actualizando flujo Q&A',
        error: error.message
      });
    }
  }

  // Eliminar flujo Q&A
  async deleteQAFlow(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const flow = await QAFlow.findOneAndDelete({ _id: id, tenantId });

      if (!flow) {
        return res.status(404).json({
          success: false,
          message: 'Flujo Q&A no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Flujo Q&A eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error eliminando flujo Q&A',
        error: error.message
      });
    }
  }
}

module.exports = new QAFlowController(); 