const express = require('express');
const router = express.Router();
const RoleController = require('./controllers/role.controller');
const { validateCreate, validateUpdate, validateAssignRoles } = require('./validations/role.validations');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.use(authorize(['users:manage']));

/**
 * @swagger
 * /api/auth/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleCreate'
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 */
router.post('/', validateCreate, RoleController.create);

/**
 * @swagger
 * /api/auth/roles:
 *   get:
 *     summary: Get all roles for current tenant
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 */
router.get('/', RoleController.getAll);

/**
 * @swagger
 * /api/auth/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Role not found
 */
router.get('/:id', RoleController.getById);

/**
 * @swagger
 * /api/auth/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdate'
 *     responses:
 *       200:
 *         description: Updated role data
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Role not found
 */
router.put('/:id', validateUpdate, RoleController.update);

/**
 * @swagger
 * /api/auth/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Role not found
 */
router.delete('/:id', RoleController.delete);

// Swagger components
/**
 * @swagger
 * components:
 *   schemas:
 *     RoleCreate:
 *       type: object
 *       required:
 *         - name
 *         - permissions
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           example: content-manager
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["content.create", "content.edit"]
 *         isDefault:
 *           type: boolean
 *           default: false
 * 
 *     RoleUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           example: content-manager
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["content.create", "content.edit", "content.delete"]
 *         isDefault:
 *           type: boolean
 */
// Nuevas rutas para gestión de roles de usuario
router.post('/:userId/assign', authenticate, RoleController.assignRoles);
router.post('/:userId/remove', authenticate, RoleController.removeRoles);

module.exports = router;