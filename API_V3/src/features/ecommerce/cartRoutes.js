const express = require('express');
const router = express.Router();
const CartController = require('./controllers/CartController');
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestión del carrito de compras
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Obtener carrito actual
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 */
router.get('/', CartController.getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Añadir producto al carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "60ab12c34d5f8e7890123456"
 *               variantId:
 *                 type: string
 *                 description: "ID de la variante (requerido si el producto tiene variantes)"
 *                 example: "60ab12c34d5f8e7890123457"
 *               quantity:
 *                 type: number
 *                 default: 1
 *     responses:
 *       200:
 *         description: Producto añadido al carrito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Stock insuficiente o producto no encontrado
 */
router.post('/items', CartController.addItem);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     summary: Eliminar o reducir cantidad de un producto sin variantes
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: removeAll
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Producto no encontrado en el carrito
 */
router.delete('/items/:productId', CartController.removeItem);

/**
 * @swagger
 * /api/cart/items/{productId}/variants/{variantId}:
 *   delete:
 *     summary: Eliminar o reducir cantidad de un producto con variante específica
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: removeAll
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Carrito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Producto o variante no encontrado en el carrito
 */
router.delete('/items/:productId/variants/:variantId', CartController.removeItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Vaciar carrito completamente
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/', CartController.clearCart);

module.exports = router;