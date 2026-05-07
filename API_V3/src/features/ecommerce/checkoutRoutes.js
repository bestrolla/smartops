const express = require('express');
const router = express.Router();
const { checkoutUpload } = require('./config/upload.config');
const CheckoutController = require('./controllers/CheckoutController');
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Endpoints para el proceso de checkout
 */

// Middlewares aplicados a todas las rutas
router.use(authenticate);
router.use(identifyTenant);

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Iniciar checkout con pago manual
 *     tags: [Checkout]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [binance, zinli, pago_movil, transferencia, efectivo]
 *               transactionId:
 *                 type: string
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Checkout iniciado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 */
router.post('/', checkoutUpload.single('receipt'), CheckoutController.initiateCheckout);

/**
 * @swagger
 * /api/checkout/payments:
 *   get:
 *     summary: Listar pagos manuales del usuario actual
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: Lista de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get('/payments', CheckoutController.listPayments);

/**
 * @swagger
 * /api/checkout/payments/{paymentId}/approve:
 *   patch:
 *     summary: Aprobar pago manual (Admin)
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *     responses:
 *       200:
 *         description: Pago aprobado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
router.patch('/payments/:paymentId/approve', CheckoutController.approvePayment);

module.exports = router;