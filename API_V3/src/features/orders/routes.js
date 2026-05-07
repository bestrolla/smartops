// features/orders/routes.js
const express = require('express');
const router = express.Router();
const orderController = require('./controllers/orderController');
const validateObjectId = require('../products/middlewares/validateObjectId');
const OrderPolicy = require('./policies/orderPolicy');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de pedidos multi-tenant
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - quantity
 *         - price
 *       properties:
 *         product:
 *           type: string
 *           format: mongo-id
 *           description: ID del producto
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Cantidad del producto
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Precio unitario al momento de la compra
 *         discount:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 0
 *           description: Descuento porcentual aplicado
 * 
 *     Address:
 *       type: object
 *       required:
 *         - street
 *         - city
 *         - state
 *         - zipCode
 *         - country
 *       properties:
 *         street:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zipCode:
 *           type: string
 *         country:
 *           type: string
 * 
 *     Order:
 *       type: object
 *       required:
 *         - items
 *         - shippingAddress
 *         - billingAddress
 *         - paymentMethod
 *       properties:
 *         customer:
 *           type: string
 *           format: mongo-id
 *           description: ID del cliente (opcional, puede ser el usuario actual)
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         shippingAddress:
 *           $ref: '#/components/schemas/Address'
 *         billingAddress:
 *           $ref: '#/components/schemas/Address'
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, paypal, bank_transfer, cash]
 *         notes:
 *           type: string
 *           description: Notas adicionales para la orden
 * 
 *     OrderStatusUpdate:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           description: Nuevo estado de la orden
 */

// Middleware común para todas las rutas
router.use(authenticate);
router.use(identifyTenant);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear una nueva orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Error de validación o stock insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No autorizado para crear órdenes
 */
router.post(
  '/',
  OrderPolicy.checkPermission('order:create'),
  orderController.createOrder
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Obtener todas las órdenes (paginado)
 *     tags: [Orders]
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
 *         description: Límite por página
 *     responses:
 *       200:
 *         description: Lista paginada de órdenes
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 */
router.get(
  '/',
  OrderPolicy.checkPermission('order:view'),
  orderController.getOrders
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener detalles de una orden específica
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Detalles completos de la orden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       403:
 *         description: No autorizado para ver esta orden
 *       404:
 *         description: Orden no encontrada
 */
router.get(
  '/:id',
  validateObjectId(),
  OrderPolicy.checkPermission('order:view'),
  orderController.getOrderDetails
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Actualizar estado de una orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Estado no válido o datos incorrectos
 *       404:
 *         description: Orden no encontrada
 */
router.patch(
  '/:id/status',
  validateObjectId(),
  OrderPolicy.checkPermission('order:update'),
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancelar una orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Orden cancelada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: No se puede cancelar la orden en su estado actual
 *       403:
 *         description: No autorizado para cancelar órdenes
 *       404:
 *         description: Orden no encontrada
 */
router.post(
  '/:id/cancel',
  validateObjectId(),
  OrderPolicy.checkPermission('order:cancel'),
  orderController.cancelOrder
);

module.exports = router;