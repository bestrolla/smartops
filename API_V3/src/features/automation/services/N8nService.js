require('dotenv').config();
const axios = require('axios');
const logger = require('../../../shared/logger');

class N8nService {
  constructor() {
    // Configuración de n8n desde variables de entorno
    this.baseURL = process.env.N8N_BASE_URL || 'http://localhost:5678';
    console.log('[N8nService] N8N_API_KEY justo antes de asignar:', process.env.N8N_API_KEY);
    this.apiKey = process.env.N8N_API_KEY;
    this.webhookBaseURL = process.env.N8N_WEBHOOK_BASE_URL || this.baseURL;

    // LOGS DE DEPURACIÓN
    console.log('[N8nService] N8N_BASE_URL:', this.baseURL);
    if (this.apiKey) {
      console.log('[N8nService] N8N_API_KEY: (definida)');
    } else {
      console.warn('[N8nService] N8N_API_KEY: NO DEFINIDA');
    }
    
    // Cliente HTTP configurado
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        'X-N8N-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`N8N API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('N8N API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info(`N8N API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('N8N API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  // =================== WORKFLOWS ===================

  /**
   * Obtener todos los workflows
   */
  async getWorkflows() {
    try {
      const response = await this.client.get('/workflows');
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo workflows: ${error.message}`);
    }
  }

  /**
   * Obtener un workflow específico
   */
  async getWorkflow(workflowId) {
    try {
      const response = await this.client.get(`/workflows/${workflowId}`);
      console.log(`[N8nService] getWorkflow status: ${response.status} id: ${workflowId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`[N8nService] getWorkflow ERROR status: ${error.response.status} id: ${workflowId}`);
        console.error('[N8nService] getWorkflow ERROR data:', error.response.data);
      } else {
        console.error('[N8nService] getWorkflow ERROR:', error.message);
      }
      throw new Error(`Error obteniendo workflow ${workflowId}: ${error.message}`);
    }
  }

  /**
   * Crear un nuevo workflow
   */
  async createWorkflow(workflowData) {
    try {
      const response = await this.client.post('/workflows', workflowData);
      return response.data;
    } catch (error) {
      logger.error('Error detallado creando workflow:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw new Error(`Error creando workflow: ${error.message} - Status: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
  }

  /**
   * Actualizar un workflow
   */
  async updateWorkflow(workflowId, workflowData) {
    try {
      const response = await this.client.put(`/workflows/${workflowId}`, workflowData);
      return response.data;
    } catch (error) {
      throw new Error(`Error actualizando workflow ${workflowId}: ${error.message}`);
    }
  }

  /**
   * Eliminar un workflow
   */
  async deleteWorkflow(workflowId) {
    try {
      await this.client.delete(`/workflows/${workflowId}`);
      return true;
    } catch (error) {
      throw new Error(`Error eliminando workflow ${workflowId}: ${error.message}`);
    }
  }

  /**
   * Activar/Desactivar un workflow
   */
  async toggleWorkflow(workflowId, active = true) {
    try {
      const response = await this.client.patch(`/workflows/${workflowId}/activate`, {
        active
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error ${active ? 'activando' : 'desactivando'} workflow ${workflowId}: ${error.message}`);
    }
  }

  // =================== EXECUTIONS ===================

  /**
   * Ejecutar un workflow manualmente
   */
  async executeWorkflow(workflowId, inputData = {}) {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, {
        data: inputData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error ejecutando workflow ${workflowId}: ${error.message}`);
    }
  }

  /**
   * Obtener ejecuciones de un workflow
   */
  async getExecutions(workflowId, options = {}) {
    try {
      const params = new URLSearchParams({
        workflowId,
        limit: options.limit || 20,
        includeData: options.includeData || false,
        ...options
      });

      const response = await this.client.get(`/executions?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo ejecuciones: ${error.message}`);
    }
  }

  /**
   * Obtener una ejecución específica
   */
  async getExecution(executionId) {
    try {
      const response = await this.client.get(`/executions/${executionId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error obteniendo ejecución ${executionId}: ${error.message}`);
    }
  }

  // =================== WEBHOOKS ===================

  /**
   * Crear URL del webhook para el workflow
   */
  createWebhookUrl(workflowId, webhookPath) {
    const baseUrl = process.env.N8N_BASE_URL || this.baseURL || 'http://localhost:5678';
    const cleanPath = webhookPath.replace(/^\/+/, ''); // Remover barras iniciales
    return `${baseUrl}/webhook/${cleanPath}`;
  }

  /**
   * Enviar datos a un webhook
   */
  async triggerWebhook(webhookUrl, data = {}) {
    try {
      const response = await axios.post(webhookUrl, data, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error triggering webhook: ${error.message}`);
    }
  }

  // =================== CHATBOT SPECIFIC ===================

  /**
   * Crear un workflow básico para chatbot
   */
  async createChatbotWorkflow(config) {
    const workflowData = {
      name: config.name || 'SmartOps Chatbot',
      settings: {},
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: config.webhookPath || 'chatbot',
            responseMode: 'responseNode',
            options: {}
          }
        },
        {
          id: 'function',
          name: 'Process Message',
          type: 'n8n-nodes-base.function',
          position: [450, 300],
          parameters: {
            functionCode: this.generateChatbotLogic(config)
          }
        },
        {
          id: 'response',
          name: 'Response',
          type: 'n8n-nodes-base.respondToWebhook',
          position: [650, 300],
          parameters: {
            options: {}
          }
        }
      ],
      connections: {
        'Webhook': {
          main: [
            [
              {
                node: 'Process Message',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Process Message': {
          main: [
            [
              {
                node: 'Response',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };

    return await this.createWorkflow(workflowData);
  }

  /**
   * Generar lógica básica para chatbot
   */
  generateChatbotLogic(config) {
    return `
// SmartOps Chatbot Logic
const message = $json.message || $json.text || '';
const userId = $json.userId || $json.from || 'anonymous';
const platform = $json.platform || 'unknown';

// Configuración del chatbot
const responses = ${JSON.stringify(config.responses || {})};
const fallbackMessage = "${config.fallbackMessage || 'Lo siento, no entendí tu mensaje.'}";

// Función para encontrar respuesta
function findResponse(message) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Buscar en respuestas configuradas
  for (const [key, response] of Object.entries(responses)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return Array.isArray(response) ? response[Math.floor(Math.random() * response.length)] : response;
    }
  }
  
  return fallbackMessage;
}

// Procesar mensaje
const response = findResponse(message);

// Log de la interacción
console.log(\`Chatbot interaction - User: \${userId}, Platform: \${platform}, Message: \${message}, Response: \${response}\`);

// Retornar respuesta
return {
  message: response,
  userId: userId,
  platform: platform,
  timestamp: new Date().toISOString(),
  processed: true
};
    `;
  }

  // =================== TEMPLATES ===================

  /**
   * Obtener todos los templates disponibles
   */
  async getTemplates() {
    try {
      // Buscar workflows que tengan un patrón específico en el nombre
      const workflows = await this.getWorkflows();
      const templates = workflows.data.filter(workflow => 
        workflow.name && (
          workflow.name.includes('AI Agent') || 
          workflow.name.includes('SmartOps') ||
          workflow.name.includes('Template') ||
          workflow.name.includes('FAQ')
        )
      );

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: `Template automático: ${template.name}`,
        category: template.name.includes('AI Agent') ? 'ai-agent' : 
                  template.name.includes('FAQ') ? 'basic' : 'general',
        difficulty: template.name.includes('AI Agent') ? 'advanced' : 'basic',
        features: template.name.includes('AI Agent') ? 
                  ['ai-powered', 'conversation-memory', 'tool-calling'] : 
                  ['basic-automation'],
        thumbnail: null,
        aiEnabled: template.name.includes('AI Agent'),
        platforms: ['whatsapp', 'telegram'],
        clientName: 'Default',
        tenantId: 'default'
      }));
    } catch (error) {
      throw new Error(`Error obteniendo templates: ${error.message}`);
    }
  }

  /**
   * Validar configuración del cliente antes de clonar
   */
  validateCloneConfig(config) {
    const errors = [];

    // Validaciones requeridas
    if (!config.tenantId) {
      errors.push('tenantId es requerido');
    }

    if (!config.name) {
      errors.push('name es requerido');
    }

    if (!config.clientName && !config.tenantName) {
      errors.push('clientName o tenantName es requerido');
    }

    // Validaciones de plataformas
    if (config.platforms && Array.isArray(config.platforms)) {
      const validPlatforms = ['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat'];
      const invalidPlatforms = config.platforms.filter(p => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        errors.push(`Plataformas inválidas: ${invalidPlatforms.join(', ')}`);
      }
    }

    // Validaciones de configuración de IA
    if (config.aiConfig) {
      if (
        config.aiConfig.enabled !== false &&
        config.aiConfig.model &&
        !['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet', 'claude-3-haiku'].includes(config.aiConfig.model)
      ) {
        errors.push('Modelo de IA inválido');
      }

      if (config.aiConfig.temperature && (config.aiConfig.temperature < 0 || config.aiConfig.temperature > 2)) {
        errors.push('Temperature debe estar entre 0 y 2');
      }

      if (config.aiConfig.maxTokens && (config.aiConfig.maxTokens < 1 || config.aiConfig.maxTokens > 4000)) {
        errors.push('maxTokens debe estar entre 1 y 4000');
      }
    }

    return errors;
  }

  /**
   * Clonar un template para un cliente específico
   */
  async cloneTemplate(templateId, clientConfig) {
    try {
      // Validar configuración del cliente
      const validationErrors = this.validateCloneConfig(clientConfig);
      if (validationErrors.length > 0) {
        throw new Error(`Configuración inválida: ${validationErrors.join(', ')}`);
      }

      // Obtener el template original
      const template = await this.getWorkflow(templateId);
      
      if (!template) {
        throw new Error(`Template con ID ${templateId} no encontrado`);
      }

      // Verificar que el template tenga nodos
      if (!template.nodes || template.nodes.length === 0) {
        throw new Error('Template no tiene nodos válidos');
      }

      // Obtener información del tenant para el nombre del workflow
      const tenantName = clientConfig.tenantName || clientConfig.clientName || 'Cliente';
      const tenantId = clientConfig.tenantId || 'unknown';
      
      // Preparar nuevo workflow basado en template con nombre personalizado
      const newWorkflow = {
        name: `[${tenantName}] ${template.name}`,
        nodes: [], // Se llenará después
        connections: template.connections || {}
      };

      // Actualizar configuraciones específicas del cliente
      logger.info(`Actualizando nodos para tenant ${tenantName}...`);
      newWorkflow.nodes = await this.updateNodesWithClientConfig(template.nodes, clientConfig);

      // Validar que los nodos actualizados sean válidos
      if (!newWorkflow.nodes || newWorkflow.nodes.length === 0) {
        throw new Error('Error procesando nodos del workflow');
      }

      // Crear el nuevo workflow (solo con campos básicos que N8N acepta)
      logger.info(`Creando nuevo workflow en n8n...`);
      const workflowForN8n = {
        name: newWorkflow.name,
        nodes: newWorkflow.nodes,
        connections: newWorkflow.connections,
        settings: template.settings || {}
      };
      
      const createdWorkflow = await this.createWorkflow(workflowForN8n);
      
      if (!createdWorkflow || !createdWorkflow.id) {
        throw new Error('Error creando workflow en n8n');
      }

      logger.info(`Template clonado exitosamente para tenant ${tenantName}`, {
        templateId,
        newWorkflowId: createdWorkflow.id,
        tenantId,
        tenantName,
        nodesCount: createdWorkflow.nodes?.length || 0
      });
      
      return createdWorkflow;
      
    } catch (error) {
      logger.error('Error clonando template:', {
        templateId,
        tenantId: clientConfig.tenantId,
        tenantName: clientConfig.tenantName,
        error: error.message,
        stack: error.stack
      });
      
      // Re-throw con mensaje más específico
      if (error.message.includes('Configuración inválida')) {
        throw error;
      } else if (error.message.includes('Template')) {
        throw new Error(`Error con el template: ${error.message}`);
      } else if (error.message.includes('workflow')) {
        throw new Error(`Error creando workflow: ${error.message}`);
      } else {
      throw new Error(`Error clonando template: ${error.message}`);
      }
    }
  }

  /**
   * Actualizar nodos con configuración del cliente
   */
  async updateNodesWithClientConfig(nodes, config) {
    try {
      // Obtener información del tenant si no está disponible
      let tenantInfo = null;
      if (config.tenantId) {
        tenantInfo = await this.getTenantInfo(config.tenantId);
      }

      // Crear mapa de variables para reemplazo
      const variableMap = this.createVariableMap(config, tenantInfo);

    return nodes.map(node => {
        try {
      const updatedNode = { ...node };

          // Validar que el nodo tenga parámetros
          if (!node.parameters || typeof node.parameters !== 'object') {
            logger.warn(`Nodo ${node.name || node.type} no tiene parámetros válidos`);
            return updatedNode;
          }

          // Actualizar webhooks con información del tenant
      if (node.type === 'n8n-nodes-base.webhook') {
            const tenantSlug = tenantInfo?.slug || config.tenantSlug || 'cliente';
            const webhookPath = `${tenantSlug}-${node.parameters.path || 'webhook'}`;
            
        updatedNode.parameters = {
          ...node.parameters,
              path: webhookPath
            };
            
            logger.info(`Webhook actualizado: ${webhookPath}`, {
              tenantId: config.tenantId,
              tenantSlug,
              originalPath: node.parameters.path
            });
      }

      // Actualizar configuración de IA
          if (node.type === 'n8n-nodes-base.openAi' || 
              node.type === 'n8n-nodes-base.openAiChat' || 
              node.type === 'n8n-nodes-base.aiAgent' ||
              node.name.includes('AI') || 
              node.name.includes('OpenAI')) {
            
            // Manejar nodo AI Agent específicamente
            if (node.type === 'n8n-nodes-base.aiAgent') {
        updatedNode.parameters = {
          ...node.parameters,
                
                // Actualizar system message con variables del tenant
                systemMessage: node.parameters.systemMessage 
                  ? this.replaceVariables(node.parameters.systemMessage, variableMap)
                  : `Eres un asistente virtual para ${tenantInfo?.displayName || config.tenantName || 'la empresa'}. Ayuda a los usuarios de manera amigable y profesional.`,
                
                // Actualizar configuración del chat model si está disponible
                chatModel: {
                  ...node.parameters.chatModel,
                  ...(config.aiConfig && {
                    model: config.aiConfig.model || node.parameters.chatModel?.model || 'gpt-3.5-turbo',
                    temperature: config.aiConfig.temperature || node.parameters.chatModel?.temperature || 0.7,
                    maxTokens: config.aiConfig.maxTokens || node.parameters.chatModel?.maxTokens || 500
                  })
                },
                
                // Configuración de memoria mejorada
                memory: {
                  ...node.parameters.memory,
                  enabled: true,
                  type: node.parameters.memory?.type || 'buffer',
                  maxMessages: node.parameters.memory?.maxMessages || 10,
                  // Agregar contexto del tenant a la memoria
                  context: {
                    tenantId: config.tenantId,
                    tenantName: tenantInfo?.displayName || config.tenantName,
                    businessType: tenantInfo?.businessType || 'general'
                  }
                },
                
                // Configurar herramientas con contexto del tenant
                tools: node.parameters.tools ? node.parameters.tools.map(tool => ({
                  ...tool,
                  // Reemplazar variables en la descripción de la herramienta
                  description: typeof tool.description === 'string' 
                    ? this.replaceVariables(tool.description, variableMap)
                    : tool.description,
                  // Agregar contexto del tenant a las herramientas
                  context: {
                    ...tool.context,
                    tenantId: config.tenantId,
                    tenantSlug: tenantInfo?.slug || config.tenantSlug,
                    apiBaseUrl: process.env.API_BASE_URL || 'https://api.smartops.com'
                  }
                })) : []
              };
              
              logger.info(`Nodo AI Agent actualizado para tenant ${tenantInfo?.displayName || config.tenantName}`, {
                systemMessageLength: updatedNode.parameters.systemMessage?.length || 0,
                toolsCount: updatedNode.parameters.tools?.length || 0,
                chatModel: updatedNode.parameters.chatModel?.model || 'default'
              });
              
            } else {
              // Manejar nodos OpenAI tradicionales
        updatedNode.parameters = {
          ...node.parameters,
                // Usar las credenciales del cliente si están disponibles
                ...(config.aiConfig && { 
                  model: config.aiConfig.model || node.parameters.model,
                  temperature: config.aiConfig.temperature || node.parameters.temperature,
                  maxTokens: config.aiConfig.maxTokens || node.parameters.maxTokens
                })
              };

              // Manejar mensajes de OpenAI - la estructura real es messages.chatInput
              if (node.parameters.messages && typeof node.parameters.messages === 'object') {
                const messages = { ...node.parameters.messages };
                
                // Procesar chatInput si existe (estructura típica de OpenAI)
                if (messages.chatInput && Array.isArray(messages.chatInput)) {
                  messages.chatInput = messages.chatInput.map(message => {
                    if (typeof message === 'object' && message.content) {
                      return {
                        ...message,
                        content: typeof message.content === 'string' 
                          ? this.replaceVariables(message.content, variableMap) 
                          : message.content
                      };
                    }
                    return message;
                  });
                }
                
                // Procesar otras propiedades que puedan contener arrays de mensajes
                Object.keys(messages).forEach(key => {
                  if (Array.isArray(messages[key])) {
                    messages[key] = messages[key].map(message => {
                      if (typeof message === 'object' && message.content) {
                        return {
                          ...message,
                          content: typeof message.content === 'string' 
                            ? this.replaceVariables(message.content, variableMap) 
                            : message.content
                        };
                      }
                      return message;
                    });
                  }
                });
                
                updatedNode.parameters.messages = messages;
              }

              // Reemplazar variables en otros campos de texto de IA
              ['prompt', 'text', 'message', 'systemMessage', 'question', 'input'].forEach(field => {
                if (node.parameters[field] && typeof node.parameters[field] === 'string') {
                  updatedNode.parameters[field] = this.replaceVariables(node.parameters[field], variableMap);
                }
              });
            }
          }

          // Actualizar nodos HTTP Request para usar endpoints del tenant
          if (node.type === 'n8n-nodes-base.httpRequest') {
            const url = node.parameters.url || '';
            
            updatedNode.parameters = {
              ...node.parameters,
              url: this.replaceVariables(url, variableMap),
              headers: {
                ...node.parameters.headers,
                'X-Tenant-ID': config.tenantId || 'unknown',
                'X-Tenant-Slug': tenantInfo?.slug || 'cliente'
              }
            };
          }

          // Actualizar variables del cliente en nodos de función
          if (node.type === 'n8n-nodes-base.function' || node.type === 'n8n-nodes-base.code') {
            let functionCode = node.parameters.functionCode || node.parameters.jsCode || '';
            
            if (functionCode) {
              // Reemplazar todas las variables usando el mapa
              functionCode = this.replaceVariables(functionCode, variableMap);

              // Agregar contexto del tenant al código de función
              const tenantContext = `
// Contexto del tenant generado automáticamente
const TENANT_CONTEXT = {
  id: '${config.tenantId || 'unknown'}',
  name: '${tenantInfo?.displayName || config.tenantName || 'Cliente'}',
  slug: '${tenantInfo?.slug || 'cliente'}',
  businessType: '${tenantInfo?.businessType || 'general'}',
  theme: ${JSON.stringify(tenantInfo?.theme || {})},
  features: ${JSON.stringify(tenantInfo?.features || {})},
  clonedAt: '${new Date().toISOString()}'
};

// Variables de configuración disponibles
const CONFIG_VARS = ${JSON.stringify(variableMap, null, 2)};
`;

              // Insertar contexto al inicio del código de función
              functionCode = tenantContext + functionCode;

              updatedNode.parameters = {
                ...node.parameters,
                [node.parameters.functionCode ? 'functionCode' : 'jsCode']: functionCode
              };
            }
          }

          // Actualizar otros tipos de nodos que puedan contener variables
          if (node.parameters) {
            const updatedParameters = { ...node.parameters };
            
            // Procesar recursivamente parámetros que puedan contener variables
            Object.keys(updatedParameters).forEach(key => {
              if (typeof updatedParameters[key] === 'string') {
                updatedParameters[key] = this.replaceVariables(updatedParameters[key], variableMap);
              } else if (typeof updatedParameters[key] === 'object' && updatedParameters[key] !== null) {
                // Procesar objetos anidados de forma segura
                try {
                  const stringified = JSON.stringify(updatedParameters[key]);
                  const replaced = this.replaceVariables(stringified, variableMap);
                  updatedParameters[key] = JSON.parse(replaced);
                } catch (e) {
                  // Si falla el parsing, mantener el valor original
                  logger.warn(`No se pudo procesar parámetro ${key} del nodo ${node.name || node.type}`);
                }
              }
            });

            updatedNode.parameters = updatedParameters;
          }

          return updatedNode;
          
        } catch (nodeError) {
          logger.error(`Error procesando nodo ${node.name || node.type}:`, {
            nodeType: node.type,
            nodeName: node.name,
            error: nodeError.message
          });
          // Retornar el nodo original si hay error
          return node;
        }
      });
      
    } catch (error) {
      logger.error('Error actualizando nodos con configuración del cliente:', error);
      throw error;
    }
  }

/**
 * Crear template de AI Agent (actualizado para n8n v1.99.0)
 */
async createAIAgentTemplate(config) {
  try {
    logger.info('Creando template con nodo AI Agent (nuevo formato)...');

    // Validar configuración mínima
    if (!config.name || !config.systemPrompt) {
      throw new Error('Se requieren name y systemPrompt en la configuración');
    }

    const workflowName = `AI Agent: ${config.name}`;
    const webhookPath = config.webhookPath || `${config.name.toLowerCase().replace(/\s+/g, '-')}-ai-agent`;

    // Configuración base del nodo AI Agent
    const aiAgentConfig = {
      systemMessage: config.systemPrompt,
      chatModel: {
        model: config.aiModel || 'gpt-3.5-turbo',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1024
      },
      memory: {
        enabled: config.memory !== false,
        type: 'buffer',
        maxMessages: config.memoryWindowSize || 10
      },
      tools: Array.isArray(config.tools) ? config.tools : []
    };

    // Crear workflow completo
    const workflow = {
      name: workflowName,
      nodes: [
        // 1. Webhook Receiver
        {
          id: 'webhook',
          name: 'Webhook Receiver',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [200, 300],
          parameters: {
            httpMethod: 'POST',
            path: webhookPath,
            responseMode: 'responseNode',
            options: {
              rawBody: false
            }
          }
        },
        // 2. AI Agent (nuevo formato)
        {
          id: 'aiAgent',
          name: 'AI Agent - ' + config.name,
          type: 'aiAgent',
          typeVersion: 1,
          position: [500, 300],
          parameters: aiAgentConfig
        },
        // 3. Response Formatter
        {
          id: 'responseFormatter',
          name: 'Format Response',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [800, 300],
          parameters: {
            functionCode: `
const response = {
  success: true,
  output: $input.first().json.output || $input.first().json.text,
  sessionId: $input.first().json.sessionId,
  timestamp: new Date().toISOString(),
  metadata: {
    model: "${aiAgentConfig.chatModel.model}",
    tokensUsed: $input.first().json.tokensUsed || 0,
    memoryEnabled: ${aiAgentConfig.memory.enabled}
  }
};
return [{ json: response }];`
          }
        },
        // 4. Send Response
        {
          id: 'sendResponse',
          name: 'Send Response',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [1000, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{$json}}'
          }
        }
      ],
      connections: {
        'Webhook Receiver': { 
          main: [[{ node: 'AI Agent - ' + config.name, type: 'main', index: 0 }]]
        },
        ['AI Agent - ' + config.name]: {
          main: [[{ node: 'Format Response', type: 'main', index: 0 }]]
        },
        'Format Response': {
          main: [[{ node: 'Send Response', type: 'main', index: 0 }]]
        }
      },
      settings: {
        executionOrder: 'v1'
      }
    };

    // Crear workflow en N8N
    const createdWorkflow = await this.createWorkflow(workflow);

    logger.info('Template AI Agent creado exitosamente:', {
      workflowId: createdWorkflow.id,
      name: createdWorkflow.name,
      webhookPath: webhookPath,
      aiModel: aiAgentConfig.chatModel.model
    });

    return {
      ...createdWorkflow,
      webhookUrl: this.createWebhookUrl(createdWorkflow.id, webhookPath)
    };

  } catch (error) {
    logger.error('Error creando template AI Agent:', {
      error: error.message,
      stack: error.stack,
      config: config
    });
    throw new Error(`Error creando AI Agent: ${error.message}`);
  }
  }

  /**
   * Generar función de validación y preprocesamiento
   */
  generateValidationFunction(config) {
    return `
// Validación y preprocesamiento de entrada
const startTime = Date.now();

// Extraer datos del webhook
const message = $json.message || $json.text || $json.body?.message || '';
const userId = $json.userId || $json.from || $json.user_id || 'anonymous';
const platform = $json.platform || $json.source || 'whatsapp';
const conversationId = $json.conversationId || $json.conversation_id || userId + '_' + Date.now();

// Configuración del cliente
const clientConfig = ${JSON.stringify(config.clientConfig || {})};
const businessHours = ${JSON.stringify(config.businessHours || {})};

// Validaciones básicas
if (!message || message.trim().length === 0) {
  throw new Error('Mensaje vacío recibido');
}

if (message.length > 4000) {
  throw new Error('Mensaje demasiado largo');
}

// Verificar horarios de atención
function isWithinBusinessHours() {
  if (!businessHours.enabled) return true;
  
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const time = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
  
  const todayHours = businessHours[day];
  if (!todayHours || !todayHours.start || !todayHours.end) return false;
  
  return time >= todayHours.start && time <= todayHours.end;
}

// Preparar datos procesados
const processedData = {
  startTime,
  userId,
  userMessage: message.trim(),
  platform,
  conversationId,
  timestamp: new Date().toISOString(),
  
  // Información del cliente y API
  clientInfo: {
    name: clientConfig.companyInfo?.name || config.clientName || 'Cliente',
    id: config.tenantId || 'unknown'
  },
  
  // Estado de horario de negocio
  businessHours: {
    enabled: businessHours.enabled || false,
    status: isWithinBusinessHours() ? 'open' : 'closed'
  },
  
  // URLs y tokens de API
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.smartops.com',
  apiToken: clientConfig.apiToken || process.env.SMARTOPS_API_TOKEN,
  
  // Metadatos
  metadata: {
    messageLength: message.length,
    hasUrgentKeywords: /urgente|emergencia|problema|ayuda/i.test(message),
    language: 'es' // TODO: Detección automática de idioma
  }
};

// Si está fuera de horario y configurado, responder directamente
if (!processedData.businessHours.status === 'closed' && businessHours.enabled && businessHours.afterHoursMessage) {
  processedData.directResponse = businessHours.afterHoursMessage;
  processedData.skipAI = true;
}

return processedData;
    `;
  }

  /**
   * Generar función de análisis de contexto e intención
   */
  generateContextAnalysisFunction(config) {
    return `
// Análisis de contexto e intención
const userMessage = $json.userMessage;
const conversationMemory = $json.data || []; // Memoria de conversaciones anteriores
const clientInfo = $json.clientInfo;

// Análisis de intención básico
function analyzeIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  // Intenciones predefinidas
  const intents = {
    greeting: /hola|buenos días|buenas tardes|hey|saludos/i,
    question: /\\?|cómo|qué|cuándo|dónde|por qué|pregunta/i,
    complaint: /problema|queja|molesto|mal servicio|reclamo/i,
    request: /necesito|quiero|podría|me gustaría|solicito/i,
    booking: /reserva|cita|agend|turno/i,
    info: /información|precio|costo|horario|ubicación/i,
    goodbye: /adiós|gracias|chao|hasta luego|despedida/i
  };
  
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(lowerMessage)) {
      return intent;
    }
  }
  
  return 'general';
}

// Extraer entidades básicas
function extractEntities(message) {
  const entities = {};
  
  // Números de teléfono
  const phoneMatch = message.match(/\\b\\d{10,}\\b/);
  if (phoneMatch) entities.phone = phoneMatch[0];
  
  // Emails
  const emailMatch = message.match(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/);
  if (emailMatch) entities.email = emailMatch[0];
  
  // Fechas simples
  const dateMatch = message.match(/\\b\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}\\b/);
  if (dateMatch) entities.date = dateMatch[0];
  
  return entities;
}

// Determinar si necesita herramientas
function requiresTools(intent, message, memory) {
  const toolKeywords = [
    'precio', 'costo', 'agenda', 'cita', 'reserva', 'horario',
    'producto', 'servicio', 'inventario', 'disponibilidad',
    'orden', 'pedido', 'factura', 'ticket'
  ];
  
  // Si hay palabras clave que requieren datos específicos
  const hasToolKeywords = toolKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  // Si es una consulta específica y no hay información en memoria
  const isSpecificQuery = intent === 'info' || intent === 'request' || intent === 'booking';
  const hasRelevantMemory = memory.some(entry => 
    entry.botResponse && entry.botResponse.includes('precio') ||
    entry.botResponse.includes('disponible')
  );
  
  return (hasToolKeywords || isSpecificQuery) && !hasRelevantMemory;
}

// Construir contexto conversacional
const conversationContext = conversationMemory.slice(-5).map(entry => 
  \`Usuario: \${entry.userMessage}\\nBot: \${entry.botResponse}\`
).join('\\n\\n');

// Análisis principal
const intent = analyzeIntent(userMessage);
const entities = extractEntities(userMessage);
const needsTools = requiresTools(intent, userMessage, conversationMemory);

// Resultado del análisis
const analysisResult = {
  ...($json), // Mantener datos anteriores
  
  // Análisis de intención
  intent,
  entities,
  requiresTools: needsTools,
  
  // Contexto conversacional
  conversationMemory: conversationContext,
  memoryEntries: conversationMemory.length,
  
  // Contexto enriquecido
  context: {
    intent,
    entities,
    previousMessages: conversationMemory.length,
    clientName: clientInfo.name,
    isFirstMessage: conversationMemory.length === 0,
    urgency: $json.metadata?.hasUrgentKeywords || false
  }
};

return analysisResult;
    `;
  }

  /**
   * Generar función de ejecución de herramientas
   */
  generateToolExecutionFunction(config) {
    return `
// Ejecución de herramientas de IA
const userMessage = $json.userMessage;
const intent = $json.intent;
const entities = $json.entities;
const clientInfo = $json.clientInfo;
const apiBaseUrl = $json.apiBaseUrl;
const apiToken = $json.apiToken;

// Herramientas disponibles
const availableTools = ${JSON.stringify(config.tools || [
  { name: 'get_products', description: 'Obtener información de productos' },
  { name: 'check_availability', description: 'Verificar disponibilidad' },
  { name: 'get_prices', description: 'Consultar precios' },
  { name: 'book_appointment', description: 'Agendar cita' },
  { name: 'get_business_hours', description: 'Obtener horarios de atención' }
])};

// Función para ejecutar herramienta específica
async function executeTool(toolName, params) {
  const toolEndpoints = {
    get_products: '/api/products',
    check_availability: '/api/inventory/check',
    get_prices: '/api/products/prices',
    book_appointment: '/api/appointments',
    get_business_hours: '/api/tenant/business-hours'
  };
  
  const endpoint = toolEndpoints[toolName];
  if (!endpoint) {
    return { error: \`Herramienta \${toolName} no disponible\` };
  }
  
  try {
    const response = await fetch(\`\${apiBaseUrl}\${endpoint}\`, {
      method: params ? 'POST' : 'GET',
      headers: {
        'Authorization': \`Bearer \${apiToken}\`,
        'Content-Type': 'application/json'
      },
      body: params ? JSON.stringify(params) : undefined
    });
    
    if (!response.ok) {
      return { error: \`Error en API: \${response.status}\` };
    }
    
    return await response.json();
  } catch (error) {
    return { error: \`Error ejecutando herramienta: \${error.message}\` };
  }
}

// Determinar qué herramientas ejecutar según la intención
let toolsToExecute = [];

if (intent === 'info') {
  if (userMessage.toLowerCase().includes('precio')) {
    toolsToExecute.push('get_prices');
  }
  if (userMessage.toLowerCase().includes('producto') || userMessage.toLowerCase().includes('servicio')) {
    toolsToExecute.push('get_products');
  }
  if (userMessage.toLowerCase().includes('horario')) {
    toolsToExecute.push('get_business_hours');
  }
}

if (intent === 'booking') {
  toolsToExecute.push('check_availability');
}

if (intent === 'request') {
  toolsToExecute.push('get_products', 'check_availability');
}

// Si no se determinaron herramientas específicas, usar herramientas generales
if (toolsToExecute.length === 0) {
  toolsToExecute = ['get_products', 'get_business_hours'];
}

// Ejecutar herramientas en paralelo
const toolPromises = toolsToExecute.map(async toolName => {
  const result = await executeTool(toolName);
  return { tool: toolName, result };
});

const toolResults = await Promise.all(toolPromises);

// Preparar resultados para el chat con IA
const formattedResults = toolResults.map(({ tool, result }) => 
  \`\${tool}: \${JSON.stringify(result, null, 2)}\`
).join('\\n\\n');

// Resultado final
const executionResult = {
  ...($json), // Mantener datos anteriores
  toolsUsed: toolsToExecute,
  toolResults: formattedResults,
  rawToolResults: toolResults,
  toolExecutionTime: Date.now() - $json.startTime
};

return executionResult;
    `;
  }

  /**
   * Obtener prompt del sistema por defecto
   */
  getDefaultSystemPrompt(config) {
    return `Eres un asistente virtual inteligente para ${config.clientName || 'nuestro negocio'}.

INFORMACIÓN DEL NEGOCIO:
${config.clientConfig?.companyInfo?.description || 'Empresa dedicada a brindar excelente servicio al cliente.'}

TUS CAPACIDADES:
- Responder preguntas sobre productos y servicios
- Ayudar con reservas y citas
- Proporcionar información de contacto y horarios
- Escalar a agentes humanos cuando sea necesario
- Mantener conversaciones naturales y amigables

INSTRUCCIONES:
1. Sé siempre cortés, profesional y útil
2. Usa la información de herramientas cuando esté disponible
3. Si no sabes algo, di que consultas con el equipo
4. Mantén respuestas concisas pero completas
5. Usa emojis ocasionalmente para ser más amigable
6. Haz preguntas de seguimiento cuando sea apropiado

ESCALAMIENTO:
Si el usuario necesita ayuda que no puedes proporcionar, ofrece contactar a un agente humano y proporciona los datos de contacto del negocio.`;
  }

  /**
   * Obtener información completa del tenant para usar en workflows
   */
  async getTenantInfo(tenantId) {
    try {
      const Tenant = require('../../../core/tenant/models/tenant.model');
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant no encontrado');
      }

      return {
        id: tenant._id.toString(),
        name: tenant.name,
        displayName: tenant.publicProfile?.displayName || tenant.name,
        slug: tenant.slug,
        businessType: tenant.businessType,
        theme: {
          primaryColor: tenant.theme?.primaryColor || '#4f46e5',
          secondaryColor: tenant.theme?.secondaryColor || '#f43f5e',
          darkMode: tenant.theme?.darkMode || false
        },
        features: tenant.features || {},
        contactEmail: tenant.publicProfile?.contactEmail || '',
        description: tenant.publicProfile?.description || '',
        logoUrl: tenant.publicProfile?.logoUrl || ''
      };
    } catch (error) {
      logger.error('Error obteniendo información del tenant:', error);
      throw error;
    }
  }

  /**
   * Crear mapa de variables para reemplazo en workflows
   */
  createVariableMap(config, tenantInfo = null) {
    const baseVariables = {
      // Variables del cliente
      'CLIENT_NAME': config.clientName || config.tenantName || 'Cliente',
      'CLIENT_ID': config.clientId || 'unknown',
      'AUTOMATION_NAME': config.name || 'Automatización',
      
      // Variables del tenant
      'TENANT_ID': config.tenantId || 'unknown',
      'TENANT_NAME': config.tenantName || (tenantInfo?.displayName) || 'Cliente',
      'TENANT_SLUG': config.tenantSlug || (tenantInfo?.slug) || 'cliente',
      'BUSINESS_TYPE': config.businessType || (tenantInfo?.businessType) || 'general',
      
      // Variables de tema
      'PRIMARY_COLOR': config.primaryColor || (tenantInfo?.theme?.primaryColor) || '#4f46e5',
      'SECONDARY_COLOR': config.secondaryColor || (tenantInfo?.theme?.secondaryColor) || '#f43f5e',
      'DARK_MODE': config.darkMode || (tenantInfo?.theme?.darkMode) || false,
      
      // Variables de sistema
      'SMARTOPS_API_URL': config.apiUrl || process.env.API_BASE_URL || 'https://api.smartops.com',
      'WEBHOOK_BASE_URL': this.webhookBaseURL,
      'CREATED_AT': new Date().toISOString(),
      
      // Variables de configuración
      'BUSINESS_HOURS': JSON.stringify(config.businessHours || {}),
      'COMPANY_INFO': JSON.stringify(config.companyInfo || {}),
      'AI_MODEL': config.aiConfig?.model || 'gpt-3.5-turbo',
      'AI_TEMPERATURE': config.aiConfig?.temperature || 0.7,
      'AI_MAX_TOKENS': config.aiConfig?.maxTokens || 500,
      
      // Variables de contacto
      'CONTACT_EMAIL': config.contactEmail || (tenantInfo?.contactEmail) || '',
      'CONTACT_INFO': config.contactInfo || '',
      
      // Variables personalizadas del cliente
      ...config.variables
    };

    // Agregar variables específicas del tenant si están disponibles
    if (tenantInfo) {
      baseVariables['TENANT_DESCRIPTION'] = tenantInfo.description || '';
      baseVariables['TENANT_LOGO'] = tenantInfo.logoUrl || '';
      baseVariables['TENANT_FEATURES'] = JSON.stringify(tenantInfo.features || {});
    }

    return baseVariables;
  }

  /**
   * Reemplazar variables en texto usando el mapa de variables
   */
  replaceVariables(text, variableMap) {
    let result = text;
    
    Object.entries(variableMap).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  // =================== ANALYTICS ===================

  /**
   * Obtener estadísticas de un workflow
   */
  async getWorkflowStats(workflowId, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const executions = await this.getExecutions(workflowId, {
        limit: 100,
        startedAfter: startDate.toISOString(),
        startedBefore: endDate.toISOString()
      });

      // Calcular estadísticas
      const stats = {
        totalExecutions: executions.data?.length || 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        avgExecutionTime: 0,
        executionsByDay: {},
        lastExecution: null
      };

      if (executions.data && executions.data.length > 0) {
        let totalTime = 0;
        
        executions.data.forEach(execution => {
          const date = new Date(execution.startedAt).toDateString();
          stats.executionsByDay[date] = (stats.executionsByDay[date] || 0) + 1;
          
          if (execution.finished && execution.stoppedAt) {
            stats.successfulExecutions++;
            const executionTime = new Date(execution.stoppedAt) - new Date(execution.startedAt);
            totalTime += executionTime;
          } else {
            stats.failedExecutions++;
          }
        });

        if (stats.successfulExecutions > 0) {
          stats.avgExecutionTime = totalTime / stats.successfulExecutions;
        }

        stats.lastExecution = executions.data[0].startedAt;
      }

      return stats;
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  // =================== HEALTH CHECK ===================

  /**
   * Verificar conexión con n8n
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/workflows', { timeout: 5000 });
      return {
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'unknown',
        workflowsCount: response.data?.data?.length || 0
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = N8nService; 