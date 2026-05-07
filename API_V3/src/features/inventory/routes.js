const express = require('express');
const router = express.Router({ mergeParams: true });
const InventoryController = require('./controllers/inventoryController');
const validateObjectId = require('../products/middlewares/validateObjectId');
const InventoryPolicy = require('./policies/inventoryPolicy');
const { validateMovementQuery, validateReleaseItems } = require('./validations/invetoryValidations');
const { authenticate } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Gestión completa de inventario multi-tenant
 */

// Middlewares comunes para todas las rutas
router.use(authenticate);
router.use(identifyTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryAdjustment:
 *       type: object
 *       required:
 *         - delta
 *         - reason
 *       properties:
 *         delta:
 *           type: integer
 *           description: Cambio en el stock (positivo para aumentar, negativo para disminuir)
 *           example: -5
 *         reason:
 *           type: string
 *           description: Razón del ajuste
 *           example: "Ajuste por inventario físico"
 *           maxLength: 200
 *
 *     InventoryItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: mongo-id
 *         product_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               format: mongo-id
 *             name:
 *               type: string
 *             sku:
 *               type: string
 *             price:
 *               type: number
 *         current_stock:
 *           type: integer
 *           example: 15
 *         reserved_stock:
 *           type: integer
 *           example: 3
 *         low_stock_threshold:
 *           type: integer
 *           example: 5
 *         last_updated:
 *           type: string
 *           format: date-time
 *
 *     StockMovement:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: mongo-id
 *         type:
 *           type: string
 *           enum: [purchase, sale, adjustment, return, transfer]
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         metadata:
 *           type: object
 *           properties:
 *             reason:
 *               type: string
 *             adjustedBy:
 *               type: string
 *               format: email
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ReservationRequest:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         orderId:
 *           type: string
 *           format: mongo-id
 *           description: ID de la orden asociada
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: mongo-id
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *
 *     ReservationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         reservedItems:
 *           type: integer
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 format: mongo-id
 *               quantity:
 *                 type: integer
 *               newStock:
 *                 type: integer
 *               newReservedStock:
 *                 type: integer
 */
/**
 * @swagger
 * /api/inventory/products/{productId}/initialize:
 *   post:
 *     summary: Inicializar inventario de un producto
 *     description: |
 *       Crea o inicializa el inventario para un producto específico.
 *       Si se especifica stock inicial, también actualiza el stock del producto.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               initialStock:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Stock inicial para el producto
 *     responses:
 *       200:
 *         description: Inventario inicializado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos o el inventario ya existe
 *       404:
 *         description: Producto no encontrado
 */
router.post(
  '/products/:productId/initialize',
  validateObjectId('productId'),
  InventoryPolicy.canManage,
  InventoryController.initializeInventory
);

/**
 * @swagger
 * /api/inventory/products/{productId}/stock:
 *   patch:
 *     summary: Actualizar stock de un producto
 *     description: Actualiza directamente el stock de un producto en el inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Nueva cantidad de stock
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *                 message:
 *                   type: string
 */
router.patch(
  '/products/:productId/stock',
  validateObjectId('productId'),
  InventoryPolicy.canManage,
  InventoryController.updateStock
);

/**
 * @swagger
 * /api/inventory/products/{productId}:
 *   get:
 *     summary: Obtener inventario de un producto
 *     description: Retorna el estado actual del inventario para un producto específico
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *     responses:
 *       200:
 *         description: Inventario del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 */
router.get(
  '/products/:productId',
  validateObjectId('productId'),
  InventoryPolicy.canView,
  InventoryController.getInventoryByProduct
);

/**
 * @swagger
 * /api/inventory/products/{productId}/movements:
 *   get:
 *     summary: Obtener movimientos de stock
 *     description: Retorna el historial de movimientos de stock para un producto específico
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [purchase, sale, adjustment, return, transfer]
 *     responses:
 *       200:
 *         description: Lista de movimientos
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
 *                     $ref: '#/components/schemas/StockMovement'
 */
router.get(
  '/products/:productId/movements',
  validateObjectId('productId'),
  validateMovementQuery,
  InventoryPolicy.canView,
  InventoryController.getStockMovements
);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Obtener todo el inventario
 *     description: Retorna una lista paginada de todo el inventario
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: lowStockOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Lista paginada de inventario
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
 *                     inventory:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryItem'
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 */
router.get(
  '/',
  InventoryPolicy.canView,
  InventoryController.getAllInventory
);

/**
 * @swagger
 * /api/inventory/products/{productId}/adjust:
 *   post:
 *     summary: Ajustar stock de un producto
 *     description: |
 *       Permite realizar ajustes manuales al stock de un producto.
 *       Actualiza tanto el inventario como el producto y registra el movimiento.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryAdjustment'
 *     responses:
 *       200:
 *         description: Stock ajustado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Datos inválidos o ajuste resultaría en stock negativo
 *       404:
 *         description: Producto no encontrado
 */
router.post(
  '/products/:productId/adjust',
  validateObjectId('productId'),
  InventoryPolicy.canManage,
  InventoryController.adjustStock
);

/**
 * @swagger
 * /api/inventory/reserve:
 *   post:
 *     summary: Reservar stock para una orden
 *     description: |
 *       Reserva stock de uno o más productos para una orden.
 *       El stock reservado no estará disponible para otras órdenes.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservationRequest'
 *     responses:
 *       200:
 *         description: Stock reservado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Stock insuficiente o datos inválidos
 *       404:
 *         description: Uno o más productos no encontrados
 */
router.post(
  '/reserve',
  InventoryPolicy.canManage,
  InventoryController.reserveStock
);

/**
 * @swagger
 * /api/inventory/release:
 *   post:
 *     summary: Liberar stock reservado
 *     description: |
 *       Libera el stock previamente reservado para una orden.
 *       El stock liberado vuelve a estar disponible para otras órdenes.
 *     tags: [Inventory]
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
 *               - items
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: mongo-id
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: mongo-id
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock liberado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Datos inválidos o stock reservado insuficiente
 *       404:
 *         description: Uno o más productos no encontrados
 */
router.post(
  '/release',
  validateReleaseItems,
  InventoryPolicy.canManage,
  InventoryController.releaseReservation
);

/**
 * @swagger
 * /api/inventory/products/{productId}/sync:
 *   post:
 *     summary: Sincronizar stock entre producto e inventario
 *     description: |
 *       Sincroniza manualmente el stock entre el producto y su registro de inventario.
 *       Útil cuando hay discrepancias entre ambos sistemas.
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: mongo-id
 *     responses:
 *       204:
 *         description: Sincronización exitosa
 *       404:
 *         description: Producto no encontrado
 */
router.post(
  '/products/:productId/sync',
  validateObjectId('productId'),
  InventoryPolicy.canManage,
  InventoryController.syncProductStock
);

module.exports = router;