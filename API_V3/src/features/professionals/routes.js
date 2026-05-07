const express = require('express');
const router = express.Router();
const ProfessionalController = require('./controllers/ProfessionalController');
const professionalMiddleware = require('./middlewares/professional.middleware');
const {
  createProfessionalSchema,
  updateProfessionalSchema,
  listProfessionalsSchema
} = require('./validations/professional.validations');
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
const validate = require('../../shared/middlewares/validate');
const Joi = require('joi');

// Schema para crear tipos de profesionales
const createProfessionalTypeSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder los 50 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  description: Joi.string().max(200).optional().messages({
    'string.max': 'La descripción no puede exceder los 200 caracteres'
  }),
  requiresLicense: Joi.boolean().default(false)
});

// Middleware de autenticación y tenant
// router.use(authenticate);
router.use(identifyTenant);

/**
 * @swagger
 * /api/professionals/types:
 *   get:
 *     summary: Obtener tipos de profesionales disponibles
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: Lista de tipos de profesionales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       requiresLicense:
 *                         type: boolean
 *       401:
 *         description: No autorizado
 */
router.get('/types', ProfessionalController.getProfessionalTypes);

/**
 * @swagger
 * /api/professionals/types:
 *   post:
 *     summary: Crear un nuevo tipo de profesional
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               requiresLicense:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tipo de profesional creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     requiresLicense:
 *                       type: boolean
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/types', validate(createProfessionalTypeSchema, 'body'), ProfessionalController.createProfessionalType);

/**
 * @swagger
 * tags:
 *   name: Professionals
 *   description: Gestión de profesionales (doctores, mecánicos, terapeutas, etc.)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Professional:
 *       type: object
 *       required:
 *         - userId
 *         - professionalType
 *       properties:
 *         id:
 *           type: string
 *           description: ID auto-generado del profesional
 *         userId:
 *           type: string
 *           description: ID del usuario asociado
 *         professionalType:
 *           type: string
 *           enum: [doctor, mechanic, therapist, trainer, other]
 *           description: Tipo de profesional
 *         specialties:
 *           type: array
 *           items:
 *             type: string
 *           description: Especialidades del profesional
 *         licenseNumber:
 *           type: string
 *           description: Número de licencia (requerido para algunos tipos)
 *         experienceYears:
 *           type: number
 *           description: Años de experiencia
 *         rating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Calificación promedio
 *         isActive:
 *           type: boolean
 *           description: Indica si el profesional está activo
 *         customFields:
 *           type: object
 *           additionalProperties: true
 *           description: Campos personalizados según el tipo de profesional
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 507f1f77bcf86cd799439011
 *         userId: 507f191e810c19729de860ea
 *         professionalType: doctor
 *         specialties: ["Cardiología", "Medicina Interna"]
 *         licenseNumber: "MD123456"
 *         experienceYears: 10
 *         rating: 4.5
 *         isActive: true
 *         customFields: { hospitalAffiliation: "General Hospital" }
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 */

/**
 * @swagger
 * /api/professionals:
 *   post:
 *     summary: Crear un nuevo profesional
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Professional'
 *             required:
 *               - userId
 *               - professionalType
 *     responses:
 *       201:
 *         description: Profesional creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  '/', 
  validate(createProfessionalSchema, 'body'), 
  ProfessionalController.create
);

/**
 * @swagger
 * /api/professionals:
 *   get:
 *     summary: Listar profesionales
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
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
 *         description: Límite de resultados por página
 *       - in: query
 *         name: professionalType
 *         schema:
 *           type: string
 *           enum: [doctor, mechanic, therapist, trainer, other]
 *         description: Filtrar por tipo de profesional
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de profesionales paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     professionals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Professional'
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: No autorizado
 */
router.get(
  '/', 
  validate(listProfessionalsSchema, 'query'), 
  ProfessionalController.list
);

/**
 * @swagger
 * /api/professionals/{id}:
 *   get:
 *     summary: Obtener un profesional por ID
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del profesional
 *     responses:
 *       200:
 *         description: Datos del profesional
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Profesional no encontrado
 */
router.get(
  '/:id', 
  professionalMiddleware.validateProfessionalTenant, 
  ProfessionalController.getById
);

/**
 * @swagger
 * /api/professionals/{id}:
 *   patch:
 *     summary: Actualizar un profesional (actualización parcial)
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del profesional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Professional'
 *     responses:
 *       200:
 *         description: Profesional actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Profesional no encontrado
 */
router.patch(
  '/:id', 
  professionalMiddleware.validateProfessionalTenant,
  validate(updateProfessionalSchema, 'body'),
  ProfessionalController.update
);

// Ruta PUT para actualización completa (usa la misma lógica que PATCH)
router.put(
  '/:id', 
  professionalMiddleware.validateProfessionalTenant,
  validate(updateProfessionalSchema, 'body'),
  ProfessionalController.update
);

/**
 * @swagger
 * /api/professionals/{id}:
 *   delete:
 *     summary: Desactivar un profesional
 *     tags: [Professionals]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del profesional
 *     responses:
 *       200:
 *         description: Profesional desactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Professional'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Profesional no encontrado
 */
router.delete(
  '/:id', 
  professionalMiddleware.validateProfessionalTenant,
  ProfessionalController.deactivate
);

module.exports = router;