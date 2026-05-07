const { validationResult } = require('express-validator');
const Template = require('../models/Template');
const Automation = require('../models/Automation');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();
const logger = require('../../../shared/logger');

class TemplateController {

  /**
   * Obtener todos los templates disponibles
   */
  async getTemplates(req, res) {
    try {
      logger.info('🚀 getTemplates - Iniciando consulta de templates');
      logger.info('👤 Usuario autenticado:', {
        userId: req.user?.userId,
        tenantId: req.user?.tenantId,
        roles: req.user?.roles?.map(r => r.name)
      });

      const {
        category,
        difficulty,
        aiEnabled,
        platform,
        search,
        page = 1,
        limit = 20
      } = req.query;

      logger.info('📋 Parámetros de consulta:', {
        category, difficulty, aiEnabled, platform, search, page, limit
      });

      // Construir filtros
      let filters = { isActive: true, isPublic: true };

      if (category) filters.category = category;
      if (difficulty) filters.difficulty = difficulty;
      if (aiEnabled !== undefined) filters['aiConfig.enabled'] = aiEnabled === 'true';
      if (platform) filters.platforms = { $in: [platform] };

      let query = Template.find(filters);

      // Aplicar búsqueda de texto si se proporciona
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query = query.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } },
            { features: { $in: [searchRegex] } }
          ]
        });
      }

      // Paginación
      const skip = (page - 1) * limit;
      const total = await Template.countDocuments(filters);

      logger.info('🔍 Ejecutando consulta a MongoDB...');
      
      const templates = await query
        .select('-n8nWorkflowId') // No exponer ID interno de n8n
        .sort({ 'usage.rating': -1, 'usage.totalClones': -1 })
        .skip(skip)
        .limit(parseInt(limit));
        // Removemos temporalmente el populate para debug
        // .populate('createdBy', 'name email');
      
      logger.info('✅ Consulta MongoDB exitosa. Resultados:', templates.length);

      res.json({
        success: true,
        data: templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      logger.error('❌ Error en getTemplates:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      res.status(500).json({
        success: false,
        message: 'Error obteniendo templates',
        error: error.message
      });
    }
  }

  /**
   * Obtener un template específico
   */
  async getTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await Template.findOne({ _id: id, isActive: true, isPublic: true })
        .populate('createdBy', 'name email');

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template no encontrado'
        });
      }

      res.json({
        success: true,
        data: template
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo template',
        error: error.message
      });
    }
  }

  /**
   * Clonar template para crear nueva automatización
   */
  async cloneTemplate(req, res) {
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
      const { tenantId, userId } = req.user;
      const {
        name,
        clientConfig = {},
        aiConfig,
        variables,
        platforms
      } = req.body;

      // Obtener template
      const template = await Template.findOne({ _id: id, isActive: true, isPublic: true });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template no encontrado'
        });
      }

      // Obtener información del tenant
      const Tenant = require('../../../core/tenant/models/tenant.model');
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      // Determinar el nombre del tenant para mostrar
      const tenantDisplayName = tenant.publicProfile?.displayName || tenant.name;

      // Mezclar valores personalizados con los defaults del template
      const defaultVars = {};
      if (Array.isArray(template.variables)) {
        template.variables.forEach(v => {
          defaultVars[v.name] = v.defaultValue;
        });
      }
      const mergedVars = { ...defaultVars, ...clientConfig };

      // Preparar configuración del cliente
      const cloneConfig = {
        tenantId,
        tenantName: tenantDisplayName,
        clientId: userId,
        name,
        clientName: name,
        apiUrl: process.env.API_BASE_URL || 'https://api.smartops.com',
        businessHours: clientConfig?.businessHours || {},
        companyInfo: clientConfig?.companyInfo || {},
        aiConfig: aiConfig || template.aiConfig,
        platforms: platforms || template.platforms,
        variables: {
          ...mergedVars,
          // Agregar variables del tenant
          TENANT_ID: tenantId,
          TENANT_NAME: tenantDisplayName,
          TENANT_SLUG: tenant.slug,
          BUSINESS_TYPE: tenant.businessType,
          PRIMARY_COLOR: tenant.theme?.primaryColor || '#4f46e5',
          SECONDARY_COLOR: tenant.theme?.secondaryColor || '#f43f5e'
        }
      };

      // Clonar workflow en n8n
      logger.info(`Clonando template ${template.name} para tenant ${tenantDisplayName}`, {
        templateId: template._id,
        tenantId,
        tenantName: tenantDisplayName,
        automationName: name
      });
      
      const clonedWorkflow = await N8nService.cloneTemplate(template.n8nWorkflowId, cloneConfig);

      // Crear automatización en SmartOps
      // Mapeo de categoría de template a tipo de automatización
      const categoryToAutomationType = {
        'ai-agent': 'chatbot',
        'basic': 'chatbot',
        'ecommerce': 'workflow',
        'appointment': 'workflow',
        'support': 'chatbot',
        'lead-generation': 'chatbot',
        'healthcare': 'chatbot',
        'finance': 'workflow'
      };
      const automationType = categoryToAutomationType[template.category] || 'chatbot';

      const automation = new Automation({
        name: `${name} (${template.name})`,
        description: `Automatización basada en template: ${template.description}`,
        type: automationType,
        platforms: cloneConfig.platforms,
        tenantId,
        createdBy: userId,
        isActive: false, // Inicia desactivado
        config: {
          n8nWorkflowId: clonedWorkflow.id,
          templateId: template._id,
          originalTemplate: template.name,
          aiConfig: cloneConfig.aiConfig,
          variables: cloneConfig.variables,
          webhookUrl: N8nService.createWebhookUrl(clonedWorkflow.id, `${tenant.slug}-chatbot`)
        },
        stats: {
          totalMessages: 0,
          successfulResponses: 0,
          failedResponses: 0,
          averageResponseTime: 0,
          leadsGenerated: 0,
          appointmentsBooked: 0
        }
      });

      // Configurar plataformas específicas
      if (cloneConfig.platforms.includes('whatsapp') && clientConfig?.whatsapp) {
        automation.platformConfigs.whatsapp = clientConfig.whatsapp;
      }
      if (cloneConfig.platforms.includes('telegram') && clientConfig?.telegram) {
        automation.platformConfigs.telegram = clientConfig.telegram;
      }
      if (cloneConfig.platforms.includes('instagram') && clientConfig?.instagram) {
        automation.platformConfigs.instagram = clientConfig.instagram;
      }

      await automation.save();

      // Incrementar contador de clones en template
      await template.incrementClones();

      logger.info(`Template clonado exitosamente para tenant ${tenantDisplayName}`, {
        automationId: automation._id,
        workflowId: clonedWorkflow.id,
        tenantId,
        tenantName: tenantDisplayName,
        webhookUrl: automation.config.webhookUrl
      });

      res.status(201).json({
        success: true,
        message: 'Template clonado exitosamente',
        data: {
          automation,
          workflowId: clonedWorkflow.id,
          workflowName: clonedWorkflow.name,
          tenantName: tenantDisplayName,
          webhookUrl: automation.config.webhookUrl
        }
      });

    } catch (error) {
      logger.error('Error clonando template:', error);
      res.status(500).json({
        success: false,
        message: 'Error clonando template',
        error: error.message
      });
    }
  }

  /**
   * Obtener preview de template antes de clonar
   */
  async getTemplatePreview(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      // Obtener template
      const template = await Template.findOne({ _id: id, isActive: true, isPublic: true });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template no encontrado'
        });
      }

      // Obtener información del tenant
      const Tenant = require('../../../core/tenant/models/tenant.model');
      const tenant = await Tenant.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      // Obtener el workflow de N8N para analizar nodos
      let workflowPreview = null;
      try {
        const workflow = await N8nService.getWorkflow(template.n8nWorkflowId);
        workflowPreview = await this.analyzeWorkflowForPreview(workflow, template, tenant);
      } catch (error) {
        logger.warn(`Error obteniendo workflow para preview: ${error.message}`);
      }

      // Preparar preview completo
      const preview = {
        template: {
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          difficulty: template.difficulty,
          features: template.features,
          platforms: template.platforms,
          tags: template.tags,
          rating: template.usage.rating,
          totalClones: template.usage.totalClones,
          estimatedSetupTime: this.calculateSetupTime(template),
          previewImage: template.preview?.thumbnail,
          screenshots: template.preview?.screenshots || []
        },
        
        tenant: {
          name: tenant.name,
          displayName: tenant.publicProfile?.displayName || tenant.name,
          businessType: tenant.businessType,
          theme: tenant.theme
        },

        requirements: {
          variables: this.processVariableRequirements(template.variables, tenant),
          platforms: template.platforms,
          aiConfig: template.aiConfig.enabled ? {
            required: true,
            model: template.aiConfig.model,
            estimatedCost: this.estimateAICost(template.aiConfig),
            features: template.aiConfig.features
          } : null,
          integrations: this.detectRequiredIntegrations(template),
          permissions: this.getRequiredPermissions(template)
        },

        preview: {
          workflowName: `[${tenant.publicProfile?.displayName || tenant.name}] ${template.name}`,
          webhookUrl: this.generatePreviewWebhookUrl(template, tenant),
          estimatedNodes: workflowPreview?.nodeCount || 0,
          nodeTypes: workflowPreview?.nodeTypes || [],
          complexity: workflowPreview?.complexity || 'medium'
        },

        recommendations: {
          bestPractices: this.getTemplateBestPractices(template),
          tips: this.getSetupTips(template, tenant),
          warnings: this.getTemplateWarnings(template, tenant)
        }
      };

      res.json({
        success: true,
        data: preview
      });

    } catch (error) {
      logger.error('Error obteniendo preview de template:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Analizar workflow para preview
   */
  async analyzeWorkflowForPreview(workflow, template, tenant) {
    const nodeTypes = new Set();
    let complexity = 'simple';
    let hasAI = false;
    let hasTools = false;
    let hasIntegrations = false;

    if (workflow.nodes) {
      workflow.nodes.forEach(node => {
        nodeTypes.add(node.type);
        
        // Detectar AI Agent o nodos de IA
        if (node.type.includes('aiAgent') || node.type.includes('openAi') || node.name.includes('AI')) {
          hasAI = true;
        }
        
        // Detectar herramientas
        if (node.type.includes('function') || node.type.includes('code')) {
          hasTools = true;
        }
        
        // Detectar integraciones
        if (node.type.includes('httpRequest') || node.type.includes('webhook')) {
          hasIntegrations = true;
        }
      });

      // Determinar complejidad
      const nodeCount = workflow.nodes.length;
      if (nodeCount > 15 || (hasAI && hasTools && hasIntegrations)) {
        complexity = 'advanced';
      } else if (nodeCount > 8 || hasAI || hasTools) {
        complexity = 'intermediate';
      }
    }

    return {
      nodeCount: workflow.nodes?.length || 0,
      nodeTypes: Array.from(nodeTypes),
      complexity,
      features: {
        hasAI,
        hasTools,
        hasIntegrations,
        hasMemory: nodeTypes.has('memory') || workflow.nodes?.some(n => n.name.includes('Memory')),
        hasConditionals: nodeTypes.has('n8n-nodes-base.if') || nodeTypes.has('n8n-nodes-base.switch')
      }
    };
  }

  /**
   * Procesar requerimientos de variables
   */
  processVariableRequirements(templateVariables, tenant) {
    return templateVariables.map(variable => {
      const requirement = {
        name: variable.name,
        label: variable.label,
        type: variable.type,
        required: variable.required,
        description: variable.description,
        currentValue: null,
        suggestion: null,
        status: 'pending'
      };

      // Intentar sugerir valores basados en el tenant
      switch (variable.name) {
        case 'CLIENT_NAME':
          requirement.suggestion = tenant.publicProfile?.displayName || tenant.name;
          requirement.currentValue = requirement.suggestion;
          requirement.status = 'auto-filled';
          break;
        case 'COMPANY_INFO':
          requirement.suggestion = tenant.publicProfile?.description || 'Empresa líder en su sector';
          requirement.currentValue = requirement.suggestion;
          requirement.status = 'suggested';
          break;
        case 'CONTACT_INFO':
          requirement.suggestion = tenant.publicProfile?.contactEmail || 'info@empresa.com';
          requirement.currentValue = requirement.suggestion;
          requirement.status = 'suggested';
          break;
        case 'BUSINESS_TYPE':
          requirement.currentValue = tenant.businessType;
          requirement.status = 'auto-filled';
          break;
        default:
          requirement.currentValue = variable.defaultValue;
          requirement.status = variable.defaultValue ? 'default' : 'pending';
      }

      return requirement;
    });
  }

  /**
   * Calcular tiempo estimado de configuración
   */
  calculateSetupTime(template) {
    let minutes = 5; // Base
    
    if (template.aiConfig.enabled) minutes += 10;
    if (template.variables.length > 5) minutes += 5;
    if (template.difficulty === 'advanced') minutes += 15;
    if (template.difficulty === 'intermediate') minutes += 10;
    if (template.platforms.length > 2) minutes += 5;
    
    return `${minutes}-${minutes + 10} minutos`;
  }

  /**
   * Estimar costo de IA
   */
  estimateAICost(aiConfig) {
    const model = aiConfig.model || 'gpt-3.5-turbo';
    const estimates = {
      'gpt-4': '$0.03-0.06 por 1K tokens',
      'gpt-3.5-turbo': '$0.001-0.002 por 1K tokens',
      'claude': '$0.008-0.024 por 1K tokens'
    };
    
    return estimates[model] || 'Variable según modelo';
  }

  /**
   * Detectar integraciones requeridas
   */
  detectRequiredIntegrations(template) {
    const integrations = [];
    
    if (template.aiConfig.enabled) {
      integrations.push({
        name: 'OpenAI API',
        type: 'ai',
        required: true,
        description: 'Clave API para funcionalidad de IA'
      });
    }
    
    template.platforms.forEach(platform => {
      if (platform === 'whatsapp') {
        integrations.push({
          name: 'WhatsApp Business API',
          type: 'messaging',
          required: true,
          description: 'Token de acceso de WhatsApp'
        });
      }
    });
    
    return integrations;
  }

  /**
   * Obtener permisos requeridos
   */
  getRequiredPermissions(template) {
    return [
      'Crear workflows en N8N',
      'Configurar webhooks',
      'Acceder a APIs externas',
      'Gestionar automatizaciones'
    ];
  }

  /**
   * Generar URL de webhook de preview
   */
  generatePreviewWebhookUrl(template, tenant) {
    const baseUrl = process.env.N8N_BASE_URL || 'https://n8n.empresa.com';
    return `${baseUrl}/webhook/${tenant.slug}-${template.name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Obtener mejores prácticas
   */
  getTemplateBestPractices(template) {
    const practices = [
      'Prueba el template en modo borrador antes de activarlo',
      'Configura todas las variables requeridas',
      'Verifica las integraciones necesarias'
    ];
    
    if (template.aiConfig.enabled) {
      practices.push('Configura límites de tokens para controlar costos');
      practices.push('Prueba diferentes temperaturas para obtener mejores respuestas');
    }
    
    return practices;
  }

  /**
   * Obtener consejos de configuración
   */
  getSetupTips(template, tenant) {
    const tips = [
      `El workflow se llamará: [${tenant.name}] ${template.name}`,
      'Puedes personalizar todas las variables después de clonar'
    ];
    
    if (template.difficulty === 'advanced') {
      tips.push('Este template requiere conocimientos técnicos avanzados');
    }
    
    return tips;
  }

  /**
   * Obtener advertencias
   */
  getTemplateWarnings(template, tenant) {
    const warnings = [];
    
    if (template.aiConfig.enabled) {
      warnings.push('⚠️ Este template generará costos por uso de IA');
    }
    
    if (template.platforms.includes('whatsapp') && !tenant.features.whatsapp) {
      warnings.push('⚠️ WhatsApp no está habilitado en tu plan');
    }
    
    return warnings;
  }

  /**
   * Obtener templates por categoría
   */
  async getTemplatesByCategory(req, res) {
    try {
      const { category } = req.params;

      const templates = await Template.getByCategory(category);

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Error obteniendo templates de categoría ${category}`,
        error: error.message
      });
    }
  }

  /**
   * Obtener templates con IA habilitada
   */
  async getAITemplates(req, res) {
    try {
      const templates = await Template.getAITemplates();

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo templates con IA',
        error: error.message
      });
    }
  }

  /**
   * Buscar templates
   */
  async searchTemplates(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Query de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const templates = await Template.search(q.trim());

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en búsqueda de templates',
        error: error.message
      });
    }
  }

  /**
   * Obtener categorías disponibles
   */
  async getCategories(req, res) {
    try {
      const categories = await Template.distinct('category', { isActive: true, isPublic: true });
      
      // Agregar metadata de categorías
      const categoriesWithInfo = categories.map(category => ({
        id: category,
        name: this.getCategoryDisplayName(category),
        description: this.getCategoryDescription(category)
      }));

      res.json({
        success: true,
        data: categoriesWithInfo
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo categorías',
        error: error.message
      });
    }
  }

  /**
   * Agregar review a template
   */
  async addTemplateReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const { userId } = req.user;

      const template = await Template.findById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template no encontrado'
        });
      }

      await template.addReview({
        user: userId,
        rating,
        comment
      });

      res.json({
        success: true,
        message: 'Review agregada exitosamente',
        data: {
          newRating: template.usage.rating,
          totalReviews: template.usage.reviews.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error agregando review',
        error: error.message
      });
    }
  }

  // Métodos auxiliares
  getCategoryDisplayName(category) {
    const names = {
      'basic': 'Básico',
      'ai-agent': 'Agente IA',
      'ecommerce': 'E-commerce',
      'appointment': 'Citas',
      'support': 'Soporte',
      'lead-generation': 'Generación de Leads'
    };
    return names[category] || category;
  }

  getCategoryDescription(category) {
    const descriptions = {
      'basic': 'Templates simples para automatización básica',
      'ai-agent': 'Agentes inteligentes con IA avanzada',
      'ecommerce': 'Automatización para tiendas online',
      'appointment': 'Gestión automática de citas',
      'support': 'Atención al cliente automatizada',
      'lead-generation': 'Captura y calificación de leads'
    };
    return descriptions[category] || '';
  }
}

module.exports = new TemplateController(); 