const express = require('express');
const router = express.Router();
const customerController = require('./controllers/customerController');
const { validateCreateCustomer, validateUpdateCustomer } = require('./middlewares/validateCustomer');
const opportunityController = require('./controllers/opportunityController');
const { validateCreateOpportunity, validateUpdateOpportunity } = require('./middlewares/validateOpportunity');
const activityController = require('./controllers/activityController');
const { validateCreateActivity, validateUpdateActivity } = require('./middlewares/validateActivity');
const noteController = require('./controllers/noteController');
const { validateCreateNote, validateUpdateNote } = require('./middlewares/validateNote');
const pipelineController = require('./controllers/pipelineController');
const { validateCreatePipeline, validateUpdatePipeline } = require('./middlewares/validatePipeline');
const tagController = require('./controllers/tagController');
const { validateCreateTag, validateUpdateTag, validateTagAssign } = require('./middlewares/validateTag');
const attachmentController = require('./controllers/attachmentController');
const uploadMiddleware = require('../../core/file-uploads/middlewares/uploadMiddleware');
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
// const { isAuthenticated } = require('../../shared/middlewares/auth'); // Descomentar si existe

/**
 * @swagger
 * tags:
 *   name: CRM
 *   description: Gestión de clientes y funcionalidades CRM
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del cliente
 *         firstName:
 *           type: string
 *           description: Nombre del cliente
 *         lastName:
 *           type: string
 *           description: Apellido del cliente
 *         email:
 *           type: string
 *           description: Email del cliente
 *         phone:
 *           type: string
 *           description: Teléfono
 *         company:
 *           type: string
 *           description: Empresa
 *         notes:
 *           type: string
 *           description: Notas adicionales
 *         status:
 *           type: string
 *           enum: [lead, prospect, customer, inactive]
 *           description: Estado del cliente
 *         tenantId:
 *           type: string
 *           description: ID del tenant
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Opportunity:
 *       type: object
 *       required:
 *         - customerId
 *         - name
 *         - value
 *       properties:
 *         _id:
 *           type: string
 *         customerId:
 *           type: string
 *           description: ID del cliente relacionado
 *         name:
 *           type: string
 *           description: Nombre de la oportunidad
 *         description:
 *           type: string
 *         stage:
 *           type: string
 *           enum: [new, qualified, proposition, won, lost]
 *         value:
 *           type: number
 *         currency:
 *           type: string
 *         probability:
 *           type: number
 *         expectedCloseDate:
 *           type: string
 *           format: date
 *         assignedTo:
 *           type: string
 *           description: ID del usuario asignado
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [open, closed, cancelled]
 *         tenantId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Activity:
 *       type: object
 *       required:
 *         - type
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *         tenantId:
 *           type: string
 *         type:
 *           type: string
 *           enum: [call, meeting, task, email, other]
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         dueDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         relatedTo:
 *           type: object
 *           properties:
 *             customerId:
 *               type: string
 *             opportunityId:
 *               type: string
 *         assignedTo:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *         completedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Note:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         _id:
 *           type: string
 *         tenantId:
 *           type: string
 *         text:
 *           type: string
 *         relatedTo:
 *           type: object
 *           properties:
 *             customerId:
 *               type: string
 *             opportunityId:
 *               type: string
 *             activityId:
 *               type: string
 *         userId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Pipeline:
 *       type: object
 *       required:
 *         - name
 *         - stages
 *       properties:
 *         _id:
 *           type: string
 *         tenantId:
 *           type: string
 *         name:
 *           type: string
 *         stages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               order:
 *                 type: number
 *               color:
 *                 type: string
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Tag:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *         tenantId:
 *           type: string
 *         name:
 *           type: string
 *         color:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Attachment:
 *       type: object
 *       required:
 *         - fileUrl
 *         - originalName
 *       properties:
 *         _id:
 *           type: string
 *         tenantId:
 *           type: string
 *         fileUrl:
 *           type: string
 *         originalName:
 *           type: string
 *         uploadedBy:
 *           type: string
 *         relatedTo:
 *           type: object
 *           properties:
 *             customerId:
 *               type: string
 *             opportunityId:
 *               type: string
 *             activityId:
 *               type: string
 *         type:
 *           type: string
 *         size:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Aplicar middlewares globales
router.use(authenticate);
router.use(identifyTenant);

/**
 * @swagger
 * /api/crm/customers:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [CRM]
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 */

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Cliente no encontrado
 */

/**
 * @swagger
 * /api/crm/customers:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   put:
 *     summary: Actualizar un cliente existente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Cliente no encontrado
 */

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   delete:
 *     summary: Eliminar un cliente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente eliminado
 *       404:
 *         description: Cliente no encontrado
 */

/**
 * @swagger
 * /api/crm/opportunities:
 *   get:
 *     summary: Obtener todas las oportunidades
 *     tags: [CRM]
 *     responses:
 *       200:
 *         description: Lista de oportunidades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Opportunity'
 */

/**
 * @swagger
 * /api/crm/opportunities/{id}:
 *   get:
 *     summary: Obtener oportunidad por ID
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la oportunidad
 *     responses:
 *       200:
 *         description: Oportunidad encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       404:
 *         description: Oportunidad no encontrada
 */

/**
 * @swagger
 * /api/crm/opportunities:
 *   post:
 *     summary: Crear una nueva oportunidad
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Opportunity'
 *     responses:
 *       201:
 *         description: Oportunidad creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/opportunities/{id}:
 *   put:
 *     summary: Actualizar una oportunidad existente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la oportunidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Opportunity'
 *     responses:
 *       200:
 *         description: Oportunidad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Opportunity'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Oportunidad no encontrada
 */

/**
 * @swagger
 * /api/crm/opportunities/{id}:
 *   delete:
 *     summary: Eliminar una oportunidad
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la oportunidad
 *     responses:
 *       200:
 *         description: Oportunidad eliminada
 *       404:
 *         description: Oportunidad no encontrada
 */

/**
 * @swagger
 * /api/crm/activities:
 *   get:
 *     summary: Obtener todas las actividades
 *     tags: [CRM]
 *     responses:
 *       200:
 *         description: Lista de actividades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 */

/**
 * @swagger
 * /api/crm/activities/{id}:
 *   get:
 *     summary: Obtener actividad por ID
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: Actividad encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Actividad no encontrada
 */

/**
 * @swagger
 * /api/crm/activities:
 *   post:
 *     summary: Crear una nueva actividad
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       201:
 *         description: Actividad creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/activities/{id}:
 *   put:
 *     summary: Actualizar una actividad existente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       200:
 *         description: Actividad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Actividad no encontrada
 */

/**
 * @swagger
 * /api/crm/activities/{id}:
 *   delete:
 *     summary: Eliminar una actividad
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: Actividad eliminada
 *       404:
 *         description: Actividad no encontrada
 */

/**
 * @swagger
 * /api/crm/notes:
 *   get:
 *     summary: Obtener todas las notas (filtrable por customerId, opportunityId, activityId)
 *     tags: [CRM]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: ID del cliente relacionado
 *       - in: query
 *         name: opportunityId
 *         schema:
 *           type: string
 *         description: ID de la oportunidad relacionada
 *       - in: query
 *         name: activityId
 *         schema:
 *           type: string
 *         description: ID de la actividad relacionada
 *     responses:
 *       200:
 *         description: Lista de notas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 */

/**
 * @swagger
 * /api/crm/notes/{id}:
 *   get:
 *     summary: Obtener nota por ID
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la nota
 *     responses:
 *       200:
 *         description: Nota encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Nota no encontrada
 */

/**
 * @swagger
 * /api/crm/notes:
 *   post:
 *     summary: Crear una nueva nota
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       201:
 *         description: Nota creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/notes/{id}:
 *   put:
 *     summary: Actualizar una nota existente (solo el autor puede actualizar)
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la nota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       200:
 *         description: Nota actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Nota no encontrada o no permitida
 */

/**
 * @swagger
 * /api/crm/notes/{id}:
 *   delete:
 *     summary: Eliminar una nota (solo el autor puede eliminar)
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la nota
 *     responses:
 *       200:
 *         description: Nota eliminada
 *       404:
 *         description: Nota no encontrada o no permitida
 */

/**
 * @swagger
 * /api/crm/pipelines:
 *   get:
 *     summary: Obtener todos los pipelines
 *     tags: [CRM]
 *     responses:
 *       200:
 *         description: Lista de pipelines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pipeline'
 */

/**
 * @swagger
 * /api/crm/pipelines/{id}:
 *   get:
 *     summary: Obtener pipeline por ID
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pipeline
 *     responses:
 *       200:
 *         description: Pipeline encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pipeline'
 *       404:
 *         description: Pipeline no encontrado
 */

/**
 * @swagger
 * /api/crm/pipelines:
 *   post:
 *     summary: Crear un nuevo pipeline
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pipeline'
 *     responses:
 *       201:
 *         description: Pipeline creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pipeline'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/pipelines/{id}:
 *   put:
 *     summary: Actualizar un pipeline existente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pipeline
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pipeline'
 *     responses:
 *       200:
 *         description: Pipeline actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pipeline'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Pipeline no encontrado
 */

/**
 * @swagger
 * /api/crm/pipelines/{id}:
 *   delete:
 *     summary: Eliminar un pipeline
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pipeline
 *     responses:
 *       200:
 *         description: Pipeline eliminado
 *       404:
 *         description: Pipeline no encontrado
 */

/**
 * @swagger
 * /api/crm/pipelines/move-opportunity:
 *   post:
 *     summary: Mover una oportunidad a otra etapa
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               opportunityId:
 *                 type: string
 *               stageName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Oportunidad actualizada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Oportunidad no encontrada
 */

/**
 * @swagger
 * /api/crm/tags:
 *   get:
 *     summary: Obtener todas las etiquetas
 *     tags: [CRM]
 *     responses:
 *       200:
 *         description: Lista de etiquetas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 */

/**
 * @swagger
 * /api/crm/tags:
 *   post:
 *     summary: Crear una nueva etiqueta
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       201:
 *         description: Etiqueta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/tags/{id}:
 *   put:
 *     summary: Actualizar una etiqueta
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la etiqueta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       200:
 *         description: Etiqueta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Etiqueta no encontrada
 */

/**
 * @swagger
 * /api/crm/tags/{id}:
 *   delete:
 *     summary: Eliminar una etiqueta
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la etiqueta
 *     responses:
 *       200:
 *         description: Etiqueta eliminada
 *       404:
 *         description: Etiqueta no encontrada
 */

/**
 * @swagger
 * /api/crm/customers/{customerId}/add-tag:
 *   post:
 *     summary: Asignar etiqueta a cliente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Etiqueta asignada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Cliente no encontrado
 */

/**
 * @swagger
 * /api/crm/customers/{customerId}/remove-tag:
 *   post:
 *     summary: Quitar etiqueta de cliente
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Etiqueta quitada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Cliente no encontrado
 */

/**
 * @swagger
 * /api/crm/opportunities/{opportunityId}/add-tag:
 *   post:
 *     summary: Asignar etiqueta a oportunidad
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la oportunidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Etiqueta asignada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Oportunidad no encontrada
 */

/**
 * @swagger
 * /api/crm/opportunities/{opportunityId}/remove-tag:
 *   post:
 *     summary: Quitar etiqueta de oportunidad
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: opportunityId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la oportunidad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Etiqueta quitada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Oportunidad no encontrada
 */

/**
 * @swagger
 * /api/crm/attachments:
 *   get:
 *     summary: Listar adjuntos (filtrable por customerId, opportunityId, activityId)
 *     tags: [CRM]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: ID del cliente relacionado
 *       - in: query
 *         name: opportunityId
 *         schema:
 *           type: string
 *         description: ID de la oportunidad relacionada
 *       - in: query
 *         name: activityId
 *         schema:
 *           type: string
 *         description: ID de la actividad relacionada
 *     responses:
 *       200:
 *         description: Lista de adjuntos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attachment'
 */

/**
 * @swagger
 * /api/crm/attachments:
 *   post:
 *     summary: Subir un adjunto
 *     tags: [CRM]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               customerId:
 *                 type: string
 *               opportunityId:
 *                 type: string
 *               activityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adjunto subido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attachment'
 *       400:
 *         description: Error de validación
 */

/**
 * @swagger
 * /api/crm/attachments/{id}:
 *   delete:
 *     summary: Eliminar un adjunto
 *     tags: [CRM]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del adjunto
 *     responses:
 *       200:
 *         description: Adjunto eliminado
 *       404:
 *         description: Adjunto no encontrado
 */

// Listar todos los clientes
router.get('/customers', customerController.getCustomers);
// Obtener un cliente por ID
router.get('/customers/:id', customerController.getCustomerById);
// Crear cliente
router.post('/customers', validateCreateCustomer, customerController.createCustomer);
// Actualizar cliente
router.put('/customers/:id', validateUpdateCustomer, customerController.updateCustomer);
// Eliminar cliente
router.delete('/customers/:id', customerController.deleteCustomer);

// Rutas CRUD para Opportunity
router.get('/opportunities', opportunityController.getOpportunities);
router.get('/opportunities/:id', opportunityController.getOpportunityById);
router.post('/opportunities', validateCreateOpportunity, opportunityController.createOpportunity);
router.put('/opportunities/:id', validateUpdateOpportunity, opportunityController.updateOpportunity);
router.delete('/opportunities/:id', opportunityController.deleteOpportunity);

// Rutas CRUD para Activity
router.get('/activities', activityController.getActivities);
router.get('/activities/:id', activityController.getActivityById);
router.post('/activities', validateCreateActivity, activityController.createActivity);
router.put('/activities/:id', validateUpdateActivity, activityController.updateActivity);
router.delete('/activities/:id', activityController.deleteActivity);

// Rutas CRUD para Note
router.get('/notes', noteController.getNotes);
router.get('/notes/:id', noteController.getNoteById);
router.post('/notes', validateCreateNote, noteController.createNote);
router.put('/notes/:id', validateUpdateNote, noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

// Rutas CRUD para Pipeline
router.get('/pipelines', pipelineController.getPipelines);
router.get('/pipelines/:id', pipelineController.getPipelineById);
router.post('/pipelines', validateCreatePipeline, pipelineController.createPipeline);
router.put('/pipelines/:id', validateUpdatePipeline, pipelineController.updatePipeline);
router.delete('/pipelines/:id', pipelineController.deletePipeline);
router.post('/pipelines/move-opportunity', pipelineController.moveOpportunityStage);

// Rutas CRUD para Tag
router.get('/tags', tagController.getTags);
router.post('/tags', validateCreateTag, tagController.createTag);
router.put('/tags/:id', validateUpdateTag, tagController.updateTag);
router.delete('/tags/:id', tagController.deleteTag);
router.post('/customers/:customerId/add-tag', validateTagAssign, tagController.addTagToCustomer);
router.post('/customers/:customerId/remove-tag', validateTagAssign, tagController.removeTagFromCustomer);
router.post('/opportunities/:opportunityId/add-tag', validateTagAssign, tagController.addTagToOpportunity);
router.post('/opportunities/:opportunityId/remove-tag', validateTagAssign, tagController.removeTagFromOpportunity);

// Rutas CRUD para Attachment
router.get('/attachments', attachmentController.getAttachments);
router.post('/attachments', uploadMiddleware.tempUpload.single('file'), attachmentController.uploadAttachment);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router; 