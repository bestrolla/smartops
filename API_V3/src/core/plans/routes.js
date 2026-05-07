const express = require('express');
const router = express.Router();
const PlanController = require('./controllers/plan.controller');
const { createPlanSchema, updatePlanSchema } = require('./validations/plan.validation');
const validate = require('../../shared/middlewares/validate');
const { authenticate, authorize } = require('../../core/auth/middlewares/auth.middleware');
/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Gestión de planes de suscripción maestros
 */

/**
 * @swagger
 * /api/plans:
 *   post:
 *     summary: Crea un nuevo plan de suscripción maestro
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanInput'
 *     responses:
 *       201:
 *         description: Plan creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (permisos insuficientes)
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate(createPlanSchema, 'body'),
  PlanController.createPlan
);

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Obtiene todos los planes de suscripción maestros
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *     responses:
 *       200:
 *         description: Lista de planes recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 *                 total:
 *                   type: integer
 *                   description: Número total de planes
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'tenant', 'user']),
  PlanController.getAllPlans
);

/**
 * @swagger
 * /api/plans/{id}:
 *   get:
 *     summary: Obtiene un plan de suscripción maestro por ID
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del plan
 *     responses:
 *       200:
 *         description: Plan recuperado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Plan no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'tenant', 'user']),
  PlanController.getPlan
);

/**
 * @swagger
 * /api/plans/{id}:
 *   patch:
 *     summary: Actualiza un plan de suscripción maestro existente
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del plan a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanUpdateInput'
 *     responses:
 *       200:
 *         description: Plan actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (permisos insuficientes)
 *       404:
 *         description: Plan no encontrado
 *       500:
 *         description: Error del servidor
 */
router.patch(
  '/:id',
  authenticate,
  authorize(['admin']),
  validate(updatePlanSchema, 'body'),
  PlanController.updatePlan
);

/**
 * @swagger
 * /api/plans/{id}:
 *   delete:
 *     summary: Elimina un plan de suscripción maestro
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del plan a eliminar
 *     responses:
 *       200:
 *         description: Plan eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Plan eliminado exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido (permisos insuficientes)
 *       404:
 *         description: Plan no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  PlanController.deletePlan
);

module.exports = router; 