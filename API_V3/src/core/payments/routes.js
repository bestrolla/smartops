const { Router } = require('express');
const { authenticate, authorize } = require('../auth/middlewares/auth.middleware');
const { identifyTenant } = require('../tenant/middlewares/tenant.middleware');
const FileUploadService = require('../file-uploads/services/fileUpload.service');
const PaymentController = require('./controllers/payment.controller');
const validate = require('./validations/payment.validation');
const { createError } = require('../../shared/errors.utils');

const router = Router();

// Tipos MIME permitidos para comprobantes de pago
const allowedPaymentMimeTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/gif'];
const maxPaymentFileSize = 5 * 1024 * 1024; // 5MB

// Middleware de Multer para la carga de comprobantes de pago
const paymentUploadMiddleware = FileUploadService.createUploadMiddleware(
  'payments', // Subcarpeta de destino
  allowedPaymentMimeTypes,
  maxPaymentFileSize
);

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestión de pagos manuales del sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - type
 *         - method
 *       properties:
 *         id:
 *           type: string
 *           description: ID auto-generado del pago
 *           example: "6851c8524f7ad22091485807"
 *         tenant:
 *           type: string
 *           description: ID del tenant asociado
 *           example: "684b2e3644a1006c95d1c93d"
 *         user:
 *           type: string
 *           description: ID del usuario que creó el pago
 *           example: "684b2e3744a1006c95d1c99e"
 *         amount:
 *           type: number
 *           format: float
 *           description: Monto del pago
 *           example: 30.00
 *         currency:
 *           type: string
 *           default: "USD"
 *           example: "USD"
 *         type:
 *           type: string
 *           enum: ['order_payment', 'subscription', 'refund']
 *           description: Tipo de pago
 *           example: "subscription"
 *         method:
 *           type: string
 *           enum: ['credit_card', 'debit_card', 'cash', 'transfer']
 *           description: Método de pago
 *           example: "transfer"
 *         status:
 *           type: string
 *           enum: [pending, verified, completed, rejected, refunded]
 *           default: "pending"
 *           example: "pending"
 *         proofImage:
 *           type: object
 *           description: Información del comprobante de pago
 *           properties:
 *             url:
 *               type: string
 *               example: "/uploads/payments/tenant123_1684584000000.jpg"
 *         verifiedBy:
 *           type: string
 *           description: ID del usuario que verificó el pago
 *           example: "684b2e3744a1006c95d1c99e"
 *         verificationDate:
 *           type: string
 *           format: date-time
 *           example: "2025-06-17T19:56:18.021Z"
 */

// Middleware para verificar tenant en pagos
const validatePaymentTenant = (req, res, next) => {
  if (req.body.tenantId && req.user.tenantId !== req.body.tenantId) {
    return next(createError(403, 'No puedes realizar pagos para otro tenant'));
  }
  next();
};

// Middleware de autenticación aplicado a todas las rutas
router.use(authenticate);

// Middleware de identificación de tenant (excepto para algunas rutas si es necesario)
router.use(identifyTenant);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Crear un nuevo pago
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *               - method
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 30.00
 *               type:
 *                 type: string
 *                 enum: ['order_payment', 'subscription', 'refund']
 *                 example: "subscription"
 *               method:
 *                 type: string
 *                 enum: ['credit_card', 'debit_card', 'cash', 'transfer']
 *                 example: "transfer"
 *               currency:
 *                 type: string
 *                 default: "USD"
 *                 example: "USD"
 *               proof:
 *                 type: string
 *                 format: binary
 *                 description: Comprobante de pago (imagen o PDF)
 *               order:
 *                 type: string
 *                 description: >-
 *                   ID de la orden asociada (requerido solo si type = 'order_payment').
 *                   Debe ser un ObjectId válido de 24 caracteres.
 *                 example: "6651c8524f7ad22091485807"
 *     responses:
 *       201:
 *         description: Pago creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post(
  '/',
  paymentUploadMiddleware.single('proof'),
  validatePaymentTenant,
  validate.create,
  PaymentController.create
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Listar pagos del tenant actual
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected, completed]
 *         description: Filtrar por estado de pago
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ['order_payment', 'subscription', 'refund']
 *         description: Filtrar por tipo de pago
 *     responses:
 *       200:
 *         description: Lista de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get(
  '/',
  validate.list,
  PaymentController.list
);

/**
 * @swagger
 * /api/payments/{id}/verify-subscription:
 *   patch:
 *     summary: Verificar un pago de suscripción
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago a verificar
 *     responses:
 *       200:
 *         description: Pago verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: El pago no es de tipo suscripción
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permisos para verificar este pago
 *       404:
 *         description: Pago no encontrado
 */
router.patch(
  '/:id/verify-subscription',
  authorize(['admin', 'superadmin']),
  PaymentController.verifySubscription
);

/**
 * @swagger
 * /api/payments/{id}/reject:
 *   patch:
 *     summary: Rechazar un pago
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago a rechazar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón del rechazo
 *                 example: "Comprobante de pago no válido"
 *     responses:
 *       200:
 *         description: Pago rechazado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permisos para rechazar este pago
 *       404:
 *         description: Pago no encontrado
 */
router.patch(
  '/:id/reject',
  authorize(['admin', 'superadmin']),
  validate.reject,
  PaymentController.reject
);

/**
 * @swagger
 * /api/payments/automatic:
 *   post:
 *     summary: Crear un pago automático (PayPal/Binance)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 30.00
 *               currency:
 *                 type: string
 *                 enum: [USD, USDT]
 *                 example: "USD"
 *               paymentMethod:
 *                 type: string
 *                 enum: [paypal, binance]
 *                 example: "paypal"
 *     responses:
 *       201:
 *         description: Pago automático creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Payment'
 *                 - type: object
 *                   properties:
 *                     approvalUrl:
 *                       type: string
 *                       description: URL para aprobar el pago
 *                     qrCode:
 *                       type: string
 *                       description: Código QR para pagos con Binance
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post(
  '/automatic',
  validate.validateAutomaticPayment,
  PaymentController.createAutomaticPayment
);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook para pagos automáticos
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_type:
 *                 type: string
 *                 example: "PAYMENT.CAPTURE.COMPLETED"
 *               resource:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "5O190127TN364715T"
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 */
router.post(
  '/webhook',
  PaymentController.handleWebhook
);

/**
 * @swagger
 * /api/payments/{id}/manual:
 *   patch:
 *     summary: Actualizar un pago manual (no suscripción)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Nuevo monto del pago
 *                 example: 50.00
 *               method:
 *                 type: string
 *                 enum: [credit_card, debit_card, cash, transfer]
 *                 description: Nuevo método de pago
 *                 example: "cash"
 *               currency:
 *                 type: string
 *                 description: Nueva moneda
 *                 example: "USD"
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *                 example: "Pago editado por el usuario"
 *     responses:
 *       200:
 *         description: Pago actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Pago no encontrado
 */
router.patch(
  '/:id/manual',
  validate.updateManual,
  PaymentController.updateManual
);

/**
 * @swagger
 * /api/payments/{id}/approve-manual:
 *   patch:
 *     summary: Aprobar un pago manual (no suscripción)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago a aprobar
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notas adicionales de la aprobación
 *                 example: "Pago verificado manualmente por admin"
 *     responses:
 *       200:
 *         description: Pago aprobado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Pago no encontrado
 */
router.patch(
  '/:id/approve-manual',
  validate.approveManual,
  PaymentController.approveManual
);

module.exports = router;