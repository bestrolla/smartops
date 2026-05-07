const express = require('express');
const router = express.Router();
const ServiceController = require('./controllers/ServiceController');
const ServiceCategoryController = require('./controllers/ServiceCategoryController');
const serviceMiddleware = require('./middlewares/service.middleware');
const {
  createServiceSchema,
  updateServiceSchema,
  createPackageSchema,
  updatePackageSchema,
  listServicesSchema,
  serviceProfessionalSchema,
  createServiceCategorySchema,
  updateServiceCategorySchema
} = require('./validations/service.validations');
const validate = require('../../shared/middlewares/validate');
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');

// Middleware de autenticación y tenant
// router.use(authenticate);
router.use(identifyTenant);

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Gestión de servicios y paquetes de servicios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Service:
 *       type: object
 *       required:
 *         - name
 *         - duration
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: ID auto-generado del servicio
 *         name:
 *           type: string
 *           description: Nombre del servicio
 *         description:
 *           type: string
 *           description: Descripción detallada
 *         categoryId:
 *           type: string
 *           description: ID de la categoría
 *         duration:
 *           type: number
 *           description: Duración en minutos
 *         price:
 *           type: number
 *           description: Precio del servicio
 *         currency:
 *           type: string
 *           description: Moneda (3 letras)
 *         professionals:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de profesionales que ofrecen este servicio
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: Requisitos para el servicio
 *         isActive:
 *           type: boolean
 *           description: Si el servicio está activo
 *         isPackage:
 *           type: boolean
 *           description: Si es un paquete de servicios
 *         packageServices:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: string
 *               order:
 *                 type: number
 *           description: Servicios incluidos (solo para paquetes)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 507f1f77bcf86cd799439011
 *         name: "Consulta Médica General"
 *         description: "Consulta médica general con especialista"
 *         duration: 30
 *         price: 50
 *         currency: "USD"
 *         isActive: true
 *         isPackage: false
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 * 
 *     ServicePackage:
 *       allOf:
 *         - $ref: '#/components/schemas/Service'
 *         - type: object
 *           properties:
 *             isPackage:
 *               type: boolean
 *               example: true
 *             packageServices:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   serviceId:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439012"
 *                   order:
 *                     type: number
 *                     example: 1
 *                   serviceDetails:
 *                     $ref: '#/components/schemas/Service'
 */

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Crear un nuevo servicio o paquete de servicios
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/Service'
 *               - $ref: '#/components/schemas/ServicePackage'
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Service'
 *                 - $ref: '#/components/schemas/ServicePackage'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  '/',
  validate(createServiceSchema),
  ServiceController.create
);

/**
 * @swagger
 * /api/services/packages:
 *   post:
 *     summary: Crear un nuevo paquete de servicios
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicePackage'
 *     responses:
 *       201:
 *         description: Paquete creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePackage'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  '/packages',
  validate(createPackageSchema),
  ServiceController.create
);

// ==================== RUTAS DE CATEGORÍAS ====================
// IMPORTANTE: Las rutas de categorías DEBEN ir antes de las rutas con parámetros /:id

/**
 * @swagger
 * /api/services/categories:
 *   post:
 *     summary: Crear una nueva categoría de servicios
 *     tags: [Services]
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
 *                 description: Nombre de la categoría
 *               description:
 *                 type: string
 *                 description: Descripción de la categoría
 *               parentCategory:
 *                 type: string
 *                 description: ID de la categoría padre (opcional)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  '/categories',
  validate(createServiceCategorySchema),
  ServiceCategoryController.create
);

/**
 * @swagger
 * /api/services/categories:
 *   get:
 *     summary: Listar categorías de servicios
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: parentCategory
 *         schema:
 *           type: string
 *         description: Filtrar por categoría padre
 *     responses:
 *       200:
 *         description: Lista de categorías
 *       401:
 *         description: No autorizado
 */
router.get(
  '/categories',
  ServiceCategoryController.getCategories
);

/**
 * @swagger
 * /api/services/categories/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Datos de la categoría
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Categoría no encontrada
 */
router.get(
  '/categories/:id',
  ServiceCategoryController.getCategory
);

/**
 * @swagger
 * /api/services/categories/{id}:
 *   patch:
 *     summary: Actualizar una categoría
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentCategory:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Categoría no encontrada
 */
router.patch(
  '/categories/:id',
  validate(updateServiceCategorySchema),
  ServiceCategoryController.updateCategory
);

/**
 * @swagger
 * /api/services/categories/{id}:
 *   delete:
 *     summary: Eliminar una categoría
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       400:
 *         description: No se puede eliminar (categoría en uso)
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Categoría no encontrada
 */
router.delete(
  '/categories/:id',
  ServiceCategoryController.deleteCategory
);

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Listar servicios
 *     tags: [Services]
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
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: isPackage
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filtrar por servicios normales o paquetes
 *     responses:
 *       200:
 *         description: Lista de servicios paginada
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
 *                     services:
 *                       type: array
 *                       items:
 *                         oneOf:
 *                           - $ref: '#/components/schemas/Service'
 *                           - $ref: '#/components/schemas/ServicePackage'
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
  validate(listServicesSchema),
  ServiceController.list
);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Obtener un servicio por ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Datos del servicio
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Service'
 *                 - $ref: '#/components/schemas/ServicePackage'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Servicio no encontrado
 */
router.get(
  '/:id',
  serviceMiddleware.validateServiceTenant,
  ServiceController.getById
);

/**
 * @swagger
 * /api/services/packages/{id}:
 *   get:
 *     summary: Obtener detalles de un paquete de servicios
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del paquete
 *     responses:
 *       200:
 *         description: Detalles del paquete con servicios incluidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePackage'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Paquete no encontrado
 */
router.get(
  '/packages/:id',
  serviceMiddleware.validateIsPackage,
  ServiceController.getPackageDetails
);

/**
 * @swagger
 * /api/services/{id}:
 *   patch:
 *     summary: Actualizar un servicio
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Service'
 *     responses:
 *       200:
 *         description: Servicio actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Servicio no encontrado
 */
router.patch(
  '/:id',
  serviceMiddleware.validateServiceTenant,
  validate(updateServiceSchema),
  ServiceController.update
);

// Agregar ruta PUT para consistencia con frontend
router.put(
  '/:id',
  serviceMiddleware.validateServiceTenant,
  validate(updateServiceSchema),
  ServiceController.update
);

/**
 * @swagger
 * /api/services/packages/{id}:
 *   patch:
 *     summary: Actualizar un paquete de servicios
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del paquete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ServicePackage'
 *     responses:
 *       200:
 *         description: Paquete actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicePackage'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Paquete no encontrado
 */
router.patch(
  '/packages/:id',
  serviceMiddleware.validateIsPackage,
  validate(updatePackageSchema),
  ServiceController.update
);

/**
 * @swagger
 * /api/services/{id}/professionals:
 *   post:
 *     summary: Agregar profesional a un servicio
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - professionalId
 *             properties:
 *               professionalId:
 *                 type: string
 *                 description: ID del profesional a agregar
 *     responses:
 *       200:
 *         description: Profesional agregado al servicio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Servicio no encontrado
 */
router.post(
  '/:id/professionals',
  serviceMiddleware.validateServiceTenant,
  validate(serviceProfessionalSchema),
  ServiceController.addProfessional
);

/**
 * @swagger
 * /api/services/{id}/professionals:
 *   delete:
 *     summary: Remover profesional de un servicio
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - professionalId
 *             properties:
 *               professionalId:
 *                 type: string
 *                 description: ID del profesional a remover
 *     responses:
 *       200:
 *         description: Profesional removido del servicio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Servicio no encontrado o profesional no asociado
 */
router.delete(
  '/:id/professionals',
  serviceMiddleware.validateServiceTenant,
  validate(serviceProfessionalSchema),
  ServiceController.removeProfessional
);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Desactivar un servicio
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio desactivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Service'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Servicio no encontrado
 */
router.delete(
  '/:id',
  serviceMiddleware.validateServiceTenant,
  ServiceController.deactivate
);

module.exports = router;