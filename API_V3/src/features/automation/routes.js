const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, authorize } = require('../../core/auth/middlewares/auth.middleware');
const automationController = require('./controllers/automationController');
const qaFlowController = require('./controllers/qaFlowController');
const templateController = require('./controllers/templateController');
const memoryController = require('./controllers/memoryController');

const router = express.Router();

// ============ AUTOMATION ROUTES ============

/**
 * @swagger
 * /api/automation:
 *   get:
 *     summary: Obtener todas las automatizaciones
 *     description: Retorna una lista paginada de todas las automatizaciones del tenant
 *     tags: [Automatización]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [chatbot, ai-agent, qa-flow, trigger]
 *         description: Filtrar por tipo de automatización
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *         description: Filtrar por estado
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de automatizaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Automation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 47
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authenticate, automationController.getAutomations);

/**
 * @swagger
 * /api/automation/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     description: Retorna un resumen de todas las automatizaciones y sus métricas
 *     tags: [Automatización]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AutomationStats'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/dashboard', authenticate, automationController.getDashboardStats);

// ============ TEMPLATE ROUTES (must be before /:id route) ============

/**
 * @swagger
 * /api/automation/templates:
 *   get:
 *     summary: Obtener todos los templates disponibles
 *     description: Retorna una lista paginada de templates de automatización disponibles
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [basic, ai-agent, ecommerce, appointment, support, lead-generation]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por texto en nombre o descripción
 *       - in: query
 *         name: aiEnabled
 *         schema:
 *           type: boolean
 *         description: Filtrar templates con IA habilitada
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [basic, intermediate, advanced]
 *         description: Filtrar por dificultad
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de templates obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Template'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     pages:
 *                       type: integer
 *                       example: 1
 *       500:
 *         description: Error interno del servidor
 */
router.get('/templates', authenticate, templateController.getTemplates);

router.get('/templates/categories', templateController.getCategories);
router.get('/templates/category/:category', templateController.getTemplatesByCategory);
router.get('/templates/ai', templateController.getAITemplates);
router.get('/templates/search', 
  [
    query('q').isLength({ min: 2 }).withMessage('Query debe tener al menos 2 caracteres')
  ],
  templateController.searchTemplates
);

// Preview route must be before /:id route
router.get('/templates/:id/preview',
  authenticate,
  [
    param('id').isMongoId().withMessage('ID inválido')
  ],
  templateController.getTemplatePreview
);

router.get('/templates/:id', 
  [
    param('id').isMongoId().withMessage('ID inválido')
  ],
  templateController.getTemplate
);

router.post('/templates/:id/clone',
  authenticate,
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('name').notEmpty().withMessage('Nombre es requerido'),
    body('clientConfig').optional().isObject().withMessage('Configuración del cliente debe ser un objeto'),
    body('aiConfig').optional().isObject().withMessage('Configuración de IA debe ser un objeto'),
    body('platforms').optional().isArray().withMessage('Plataformas debe ser un array'),
    body('platforms.*').optional().isIn(['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat']).withMessage('Plataforma no válida')
  ],
  templateController.cloneTemplate
);

router.post('/templates/:id/review',
  authenticate,
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating debe ser entre 1 y 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comentario muy largo')
  ],
  templateController.addTemplateReview
);

/**
 * @swagger
 * /api/automation/{id}:
 *   get:
 *     summary: Obtener una automatización específica
 *     description: Retorna los detalles completos de una automatización
 *     tags: [Automatización]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la automatización
 *     responses:
 *       200:
 *         description: Automatización obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Automation'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Automatización no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authenticate, automationController.getAutomation);

/**
 * @swagger
 * /api/automation:
 *   post:
 *     summary: Crear nueva automatización
 *     description: Crea una nueva automatización y opcionalmente un workflow en n8n
 *     tags: [Automatización]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutomationInput'
 *           examples:
 *             chatbot_whatsapp:
 *               summary: Chatbot para WhatsApp
 *               value:
 *                 name: "Chatbot WhatsApp Ventas"
 *                 description: "Bot automático para atender consultas de ventas"
 *                 type: "chatbot"
 *                 platforms: ["whatsapp"]
 *                 config:
 *                   defaultResponse: "¡Hola! ¿En qué puedo ayudarte?"
 *                   fallbackResponse: "Lo siento, no entendí tu mensaje"
 *             ai_agent:
 *               summary: Agente IA
 *               value:
 *                 name: "Agente IA Soporte"
 *                 description: "Agente inteligente para soporte técnico"
 *                 type: "ai-agent"
 *                 platforms: ["whatsapp", "webchat"]
 *     responses:
 *       201:
 *         description: Automatización creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Automatización creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Automation'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', 
  authenticate,
  [
    body('name').notEmpty().withMessage('Nombre es requerido'),
    body('platforms').isArray().withMessage('Plataformas debe ser un array'),
    body('platforms.*').isIn(['whatsapp', 'telegram', 'instagram', 'facebook']).withMessage('Plataforma no válida')
  ],
  automationController.createAutomation
);

router.put('/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('name').optional().notEmpty().withMessage('Nombre no puede estar vacío')
  ],
  automationController.updateAutomation
);

router.delete('/:id', authenticate, automationController.deleteAutomation);

router.patch('/:id/toggle',
  authenticate,
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('active').isBoolean().withMessage('Active debe ser boolean')
  ],
  automationController.toggleAutomation
);

router.get('/:id/stats', authenticate, automationController.getAutomationStats);
router.post('/:id/sync-n8n', authenticate, automationController.syncWithN8n);

// ============ QA FLOW ROUTES ============

/**
 * @swagger
 * /api/automation/qa-flows:
 *   get:
 *     summary: Obtener todos los flujos Q&A
 *     description: Retorna una lista paginada de flujos de preguntas y respuestas
 *     tags: [Flujos Q&A]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: automationId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de automatización
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, archived]
 *         description: Filtrar por estado del flujo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de flujos Q&A obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QAFlow'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/qa-flows', authenticate, qaFlowController.getQAFlows);

/**
 * @swagger
 * /api/automation/qa-flows/{id}:
 *   get:
 *     summary: Obtener un flujo Q&A específico
 *     description: Retorna los detalles completos de un flujo de preguntas y respuestas
 *     tags: [Flujos Q&A]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del flujo Q&A
 *     responses:
 *       200:
 *         description: Flujo Q&A obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QAFlow'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Flujo Q&A no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/qa-flows/:id', authenticate, qaFlowController.getQAFlow);

/**
 * @swagger
 * /api/automation/qa-flows:
 *   post:
 *     summary: Crear nuevo flujo Q&A
 *     description: Crea un nuevo flujo de preguntas y respuestas para una automatización
 *     tags: [Flujos Q&A]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QAFlowInput'
 *           examples:
 *             basic_flow:
 *               summary: Flujo básico de consulta
 *               value:
 *                 name: "Consulta de Servicios"
 *                 automationId: "672abc123def456789012345"
 *                 welcomeMessage: "¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar?"
 *                 steps:
 *                   - id: 1
 *                     question: "¿Qué información necesitas?"
 *                     options: ["Servicios", "Precios", "Contacto"]
 *                     nextStep:
 *                       "Servicios": 2
 *                       "Precios": 3
 *                       "Contacto": 4
 *                   - id: 2
 *                     response: "Ofrecemos desarrollo web, marketing digital y automatización."
 *                     type: "end"
 *     responses:
 *       201:
 *         description: Flujo Q&A creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Flujo Q&A creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/QAFlow'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Automatización no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.post('/qa-flows',
  authenticate,
  [
    body('name').notEmpty().withMessage('Nombre es requerido'),
    body('automationId').isMongoId().withMessage('ID de automatización inválido'),
    body('welcomeMessage').notEmpty().withMessage('Mensaje de bienvenida es requerido')
  ],
  qaFlowController.createQAFlow
);

router.put('/qa-flows/:id',
  authenticate,
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('name').optional().notEmpty().withMessage('Nombre no puede estar vacío')
  ],
  qaFlowController.updateQAFlow
);

router.delete('/qa-flows/:id', authenticate, qaFlowController.deleteQAFlow);
router.get('/qa-flows/:id/stats', authenticate, qaFlowController.getFlowStats);

/**
 * @swagger
 * /api/automation/qa-flows/{id}/conversation:
 *   post:
 *     summary: Procesar conversación (Endpoint público)
 *     description: Procesa una interacción del usuario en un flujo Q&A. Este endpoint es público para webhooks.
 *     tags: [Flujos Q&A]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del flujo Q&A
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message, userId]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Mensaje del usuario
 *                 example: "Hola, quiero información sobre sus servicios"
 *               userId:
 *                 type: string
 *                 description: ID único del usuario
 *                 example: "user123_whatsapp"
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, telegram, instagram, facebook, webchat]
 *                 description: Plataforma desde donde viene el mensaje
 *                 example: "whatsapp"
 *               currentStep:
 *                 type: string
 *                 description: Paso actual en el flujo (opcional)
 *                 example: "welcome"
 *           examples:
 *             start_conversation:
 *               summary: Iniciar nueva conversación
 *               value:
 *                 message: "Hola"
 *                 userId: "user123_whatsapp"
 *                 platform: "whatsapp"
 *             continue_conversation:
 *               summary: Continuar conversación existente
 *               value:
 *                 message: "Información de servicios"
 *                 userId: "user123_whatsapp"
 *                 platform: "whatsapp"
 *                 currentStep: "welcome"
 *     responses:
 *       200:
 *         description: Conversación procesada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "¡Hola! ¿En qué puedo ayudarte hoy?"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             example: "Ver servicios"
 *                           value:
 *                             type: string
 *                             example: "services"
 *                           nextStep:
 *                             type: string
 *                             example: "step1"
 *                     stepId:
 *                       type: string
 *                       example: "welcome"
 *                     type:
 *                       type: string
 *                       enum: [welcome, question, response, end, fallback]
 *                       example: "welcome"
 *                     completed:
 *                       type: boolean
 *                       description: True si la conversación ha terminado
 *                       example: false
 *       404:
 *         description: Flujo Q&A no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/qa-flows/:id/conversation',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('message').notEmpty().withMessage('Mensaje es requerido'),
    body('userId').notEmpty().withMessage('User ID es requerido')
  ],
  qaFlowController.processConversation
);

// ============ MEMORY ROUTES ============

/**
 * @swagger
 * /api/automation/memory/{userId}:
 *   get:
 *     summary: Obtener memoria conversacional de un usuario
 *     description: Retorna el historial de conversaciones de un usuario específico
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [whatsapp, telegram, instagram, facebook, webchat]
 *         description: Filtrar por plataforma
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de conversaciones
 *     responses:
 *       200:
 *         description: Memoria conversacional obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/memory/:userId', 
  authenticate,
  [
    param('userId').notEmpty().withMessage('User ID es requerido'),
    query('platform').optional().isIn(['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat']).withMessage('Plataforma no válida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100')
  ],
  memoryController.getMemory
);

/**
 * @swagger
 * /api/automation/memory/{userId}:
 *   post:
 *     summary: Guardar entrada en memoria conversacional
 *     description: Guarda una nueva entrada de conversación en la memoria del usuario
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userMessage
 *               - botResponse
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [whatsapp, telegram, instagram, facebook, webchat]
 *                 default: whatsapp
 *               userMessage:
 *                 type: string
 *                 description: Mensaje del usuario
 *               botResponse:
 *                 type: string
 *                 description: Respuesta del bot
 *               context:
 *                 type: object
 *                 description: Contexto de la conversación
 *               toolsUsed:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Herramientas utilizadas
 *               conversationId:
 *                 type: string
 *                 description: ID de la conversación
 *               metadata:
 *                 type: object
 *                 description: Metadatos adicionales
 *     responses:
 *       201:
 *         description: Memoria guardada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/memory/:userId',
  authenticate,
  [
    param('userId').notEmpty().withMessage('User ID es requerido'),
    body('userMessage').notEmpty().withMessage('Mensaje del usuario es requerido'),
    body('botResponse').notEmpty().withMessage('Respuesta del bot es requerida'),
    body('platform').optional().isIn(['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat']).withMessage('Plataforma no válida')
  ],
  memoryController.saveMemory
);

/**
 * @swagger
 * /api/automation/memory/stats:
 *   get:
 *     summary: Obtener estadísticas de memoria conversacional
 *     description: Retorna estadísticas agregadas de las conversaciones
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Número de días para calcular estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/memory/stats', 
  authenticate,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Días debe ser entre 1 y 365')
  ],
  memoryController.getMemoryStats
);

/**
 * @swagger
 * /api/automation/memory/{userId}/clear:
 *   delete:
 *     summary: Eliminar memoria conversacional
 *     description: Elimina la memoria conversacional de un usuario
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [whatsapp, telegram, instagram, facebook, webchat]
 *         description: Filtrar por plataforma
 *       - in: query
 *         name: olderThan
 *         schema:
 *           type: integer
 *         description: Eliminar conversaciones más antiguas que X días
 *     responses:
 *       200:
 *         description: Memoria eliminada exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/memory/:userId/clear',
  authenticate,
  [
    param('userId').notEmpty().withMessage('User ID es requerido'),
    query('platform').optional().isIn(['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat']).withMessage('Plataforma no válida'),
    query('olderThan').optional().isInt({ min: 1 }).withMessage('olderThan debe ser un número positivo')
  ],
  memoryController.clearMemory
);

/**
 * @swagger
 * /api/automation/memory/conversation/{conversationId}:
 *   get:
 *     summary: Obtener conversación completa
 *     description: Retorna una conversación completa por su ID
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Conversación obtenida exitosamente
 *       404:
 *         description: Conversación no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/memory/conversation/:conversationId',
  authenticate,
  [
    param('conversationId').notEmpty().withMessage('Conversation ID es requerido')
  ],
  memoryController.getConversation
);

/**
 * @swagger
 * /api/automation/memory/export:
 *   get:
 *     summary: Exportar memoria conversacional
 *     description: Exporta la memoria conversacional en formato JSON o CSV
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [whatsapp, telegram, instagram, facebook, webchat]
 *         description: Filtrar por plataforma
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Formato de exportación
 *     responses:
 *       200:
 *         description: Memoria exportada exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/memory/export',
  authenticate,
  [
    query('startDate').optional().isDate().withMessage('Fecha de inicio inválida'),
    query('endDate').optional().isDate().withMessage('Fecha de fin inválida'),
    query('platform').optional().isIn(['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat']).withMessage('Plataforma no válida'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Formato debe ser json o csv')
  ],
  memoryController.exportMemory
);

// ============ WEBHOOK ROUTES ============
router.post('/webhook/:id', automationController.processWebhook);

module.exports = router; 
