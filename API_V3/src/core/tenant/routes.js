const express = require('express');
const router = express.Router();
const { create, getCurrentTenant, getPublicTenantProfile, update, updateTheme, deactivate, getAll, getById } = require('./controllers/tenant.controller');
const { validateCreateTenant, validateUpdateTenant, validateUpdateTheme } = require('./validations/tenant.validations');
const { isAdmin, isSuperAdmin, canAccessTenant } = require('./policies/tenant.policy');
const { identifyTenant } = require('./middlewares/tenant.middleware');
const { authenticate, authorize } = require('../auth/middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           example: cliente-ejemplo
 *         displayName:
 *           type: string
 *           example: Cliente Ejemplo S.A.
 *         isActive:
 *           type: boolean
 *           example: true
 *         publicProfile:
 *           type: object
 *           properties:
 *             description:
 *               type: string
 *               example: Tienda oficial de Cliente Ejemplo
 *             logoUrl:
 *               type: string
 *               example: https://example.com/logo.png
 *             contactEmail:
 *               type: string
 *               example: contacto@ejemplo.com
 *         theme:
 *           type: object
 *           properties:
 *             primaryColor:
 *               type: string
 *               example: "#4f46e5"
 *             secondaryColor:
 *               type: string
 *               example: "#f43f5e"
 *             darkMode:
 *               type: boolean
 *               example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TenantPublic:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         displayName:
 *           type: string
 *         description:
 *           type: string
 *         logoUrl:
 *           type: string
 *         contactEmail:
 *           type: string
 *         theme:
 *           type: object
 *           properties:
 *             primaryColor:
 *               type: string
 *             secondaryColor:
 *               type: string
 *             darkMode:
 *               type: boolean
 */

// Rutas Públicas (no requieren autenticación, se basan en la identificación global del tenant por subdominio/ruta)
// El middleware identifyTenant ya se aplica globalmente en server.js

/**
 * @swagger
 * /api/public/tenant/profile:
 *   get:
 *     summary: Get public profile information of the identified tenant
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: Public tenant profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicTenantProfile'
 *       400:
 *         description: Tenant not identified
 *       404:
 *         description: Tenant not found or inactive
 */
router.get('/public/profile', getPublicTenantProfile);

// Rutas Administrativas (requieren autenticación)
// Middleware de autenticación
router.use(authenticate);

/**
 * @swagger
 * /api/tenants/current:
 *   get:
 *     summary: Get current user's tenant information
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current tenant data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Tenant not found
 */
router.get('/current', getCurrentTenant);

/**
 * @swagger
 * /api/tenants/features:
 *   get:
 *     summary: Get current user's tenant features
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant features data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Tenant not found
 */
router.get('/features', authorize(['admin', 'superadmin']), async (req, res, next) => {
  try {
    // Obtener el tenant del usuario autenticado
    const TenantService = require('./services/tenant.service');
    let tenant = req.tenant;
    if (!tenant && req.user && req.user.tenantId) {
      tenant = await TenantService.findById(req.user.tenantId);
    }
    if (!tenant) {
      const { createError } = require('../../shared/errors.utils');
      throw createError(404, 'Tenant no encontrado');
    }

    // NUEVO: verificar estado de suscripción
    const SubscriptionService = require('../subscriptions/services/subscription.service');
    const subscription = await SubscriptionService.getSubscriptionByTenant(req.user.tenantId);
    const subscriptionStatus = subscription?.status || 'none';
    const planPrice = subscription?.plan?.price ?? 0;
    const planId = subscription?.plan?._id?.toString?.() || null;

    // Permitir módulos también cuando la suscripción está pendiente (upgrade en verificación)
    const isSubscriptionActive = (
      subscriptionStatus === 'active' ||
      subscriptionStatus === 'trial' ||
      subscriptionStatus === 'pending' ||
      planPrice === 0
    );

    const allFeatures = tenant.features || {};
    const enabledFeatures = {};

    if (isSubscriptionActive) {
      Object.keys(allFeatures).forEach(key => {
        if (allFeatures[key] === true) {
          enabledFeatures[key] = true;
        }
      });
    }
    // Si NO está activa, enabledFeatures queda vacío para gating de frontend

    res.json({
      status: 'success',
      data: {
        features: enabledFeatures,
        availableFeatures: allFeatures, // Todas para referencia
        tenantId: tenant._id,
        tenantName: tenant.name,
        // NUEVO: metadatos de suscripción para UI
        subscriptionStatus,
        planId,
        requiresPayment: subscriptionStatus === 'pending' && planPrice > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Rutas de administración de tenant
/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Crear un nuevo tenant (Solo SuperAdmin)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Nombre único del tenant para la URL y la identificación (ej. 'miempresa')
 *                 example: miempresa
 *               displayName:
 *                 type: string
 *                 description: Nombre para mostrar del tenant (ej. 'Mi Empresa S.A.')
 *                 example: Mi Empresa S.A.
 *               publicProfile:
 *                 type: object
 *                 properties:
 *                   description:
 *                     type: string
 *                   logoUrl:
 *                     type: string
 *                   contactEmail:
 *                     type: string
 *               theme:
 *                 type: object
 *                 properties:
 *                   primaryColor:
 *                     type: string
 *                   secondaryColor:
 *                     type: string
 *                   darkMode:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Tenant creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Error de validación o nombre ya existe
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol SuperAdmin
 */
router.post('/',
  authorize(['superadmin']),
  validateCreateTenant,
  create
);

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Obtener todos los tenants (Admin/SuperAdmin)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol Admin o SuperAdmin
 */
router.get('/',
  authorize(['superadmin', 'manage:tenants']),
  getAll
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Obtener tenant por ID (SuperAdmin o Admin del Tenant)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del Tenant
 *     responses:
 *       200:
 *         description: Datos del tenant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: ID de tenant inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado (requiere SuperAdmin o ser Admin del tenant)
 *       404:
 *         description: Tenant no encontrado
 */
router.get('/:id',
  authorize(['superadmin', 'read:tenants']),
  getById
);

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Actualizar información del tenant (Admin/SuperAdmin)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del Tenant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TenantUpdate'
 *     responses:
 *       200:
 *         description: Tenant actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol Admin/SuperAdmin
 *       404:
 *         description: Tenant no encontrado
 */
router.put('/:id',
  authorize(['admin', 'superadmin']),
  validateUpdateTenant,
  update
);

/**
 * @swagger
 * /api/tenants/{id}/theme:
 *   put:
 *     summary: Actualizar tema del tenant (Admin/SuperAdmin)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del Tenant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TenantThemeUpdate'
 *     responses:
 *       200:
 *         description: Tema del tenant actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol Admin/SuperAdmin
 *       404:
 *         description: Tenant no encontrado
 */
router.put('/:id/theme',
  authorize(['admin', 'superadmin']),
  validateUpdateTheme,
  updateTheme
);

/**
 * @swagger
 * /api/tenants/{id}/deactivate:
 *   patch:
 *     summary: Desactivar un tenant (Solo SuperAdmin)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del Tenant a desactivar
 *     responses:
 *       200:
 *         description: Tenant desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol SuperAdmin
 *       404:
 *         description: Tenant no encontrado
 */
router.patch('/:id/deactivate',
  authorize(['superadmin']),
  deactivate
);

module.exports = router;