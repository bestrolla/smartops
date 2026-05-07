const express = require('express');
const router = express.Router();
const subscriptionController = require('./controllers/subscription.controller');
const { authenticate, authorize } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
const validate = require('./validations/subscription.validation');
const fileUploadService = require('../file-uploads/services/fileUpload.service');

// Middleware para subir comprobantes de pago (usar temp para manejo dinámico)
const paymentUploadMiddleware = fileUploadService.createUploadMiddleware({
  fieldName: 'proof',
  category: 'payments',
  prefix: 'subscription_payment_',
  useTemp: true, // Usar carpeta temporal para manejo dinámico
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  maxFileSize: 5 * 1024 * 1024 // 5MB
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       required:
 *         - tenant_id
 *         - plan
 *         - startDate
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la suscripción
 *           example: "60d21b4667d0d8992e610c85"
 *         tenant_id:
 *           type: string
 *           description: ID del tenant al que pertenece la suscripción
 *           example: "60d21b4667d0d8992e610c85"
 *         plan:
 *           type: object
 *           description: Plan de suscripción
 *           properties:
 *             id:
 *               type: string
 *               example: "60d21b4667d0d8992e610c85"
 *             name:
 *               type: string
 *               example: "Plan Básico"
 *             price:
 *               type: number
 *               example: 29.99
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de inicio de la suscripción
 *           example: "2024-03-17T20:05:24.451Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de finalización de la suscripción
 *           example: "2024-04-17T20:05:24.451Z"
 *         status:
 *           type: string
 *           enum: [pending, active, expired, cancelled]
 *           description: Estado de la suscripción
 *           example: "active"
 *         payment_id:
 *           type: string
 *           description: ID del pago asociado
 *           example: "60d21b4667d0d8992e610c85"
 */

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Crear una nueva suscripción
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID del plan de suscripción
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       201:
 *         description: Suscripción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/', 
  authenticate, 
  identifyTenant, 
  validate.create, 
  subscriptionController.create
);

/**
 * @swagger
 * /api/subscriptions/tenant:
 *   get:
 *     summary: Obtener la suscripción del tenant actual
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suscripción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: No se encontró una suscripción para este tenant
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/tenant', 
  authenticate, 
  identifyTenant, 
  subscriptionController.getByTenant
);

/**
 * @swagger
 * /api/subscriptions/change-plan:
 *   put:
 *     summary: Cambiar el plan de suscripción del tenant actual
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID del nuevo plan de suscripción
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Plan cambiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: No se encontró una suscripción para este tenant
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.put('/change-plan', 
  authenticate, 
  identifyTenant, 
  validate.create, // Reutilizamos la misma validación que create
  subscriptionController.changePlan
);

/**
 * @swagger
 * /api/subscriptions/with-payment:
 *   post:
 *     summary: Crear suscripción con pago y comprobante
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - amount
 *               - method
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID del plan de suscripción
 *                 example: "60d21b4667d0d8992e610c85"
 *               amount:
 *                 type: number
 *                 description: Monto del pago
 *                 example: 29.99
 *               method:
 *                 type: string
 *                 enum: [credit_card, debit_card, cash, transfer]
 *                 description: Método de pago
 *                 example: "transfer"
 *               currency:
 *                 type: string
 *                 default: "USD"
 *                 example: "USD"
 *               type:
 *                 type: string
 *                 default: "subscription"
 *                 example: "subscription"
 *               transactionId:
 *                 type: string
 *                 description: ID de transacción (opcional)
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *               proof:
 *                 type: string
 *                 format: binary
 *                 description: Comprobante de pago (imagen o PDF)
 *     responses:
 *       201:
 *         description: Suscripción y pago creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *                 payment:
 *                   type: object
 *                   description: Información del pago creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/with-payment',
  authenticate,
  identifyTenant,
  paymentUploadMiddleware.single('proof'),
  subscriptionController.createWithPayment
);

module.exports = router; 