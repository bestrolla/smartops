const express = require('express');
const router = express.Router();
const UserController = require('./controllers/user.controller');
const { validateCreate, validateUpdate } = require('./validations/user.validations');
const { isAdmin, isSelfOrAdmin } = require('./policies/user.policy');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 */
router.post('/', authorize(['admin', 'superadmin']), validateCreate, UserController.create);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users for current tenant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 */
router.get('/', authorize(['admin', 'superadmin']), UserController.getAll);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (access to other users requires admin)
 *       404:
 *         description: User not found
 */
router.get('/:id', isSelfOrAdmin, UserController.getById);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: Updated user data
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (update of other users requires admin)
 *       404:
 *         description: User not found
 */
router.put('/:id', isSelfOrAdmin, validateUpdate, UserController.update);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Deactivate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: User not found
 */
router.delete('/:id', authorize(['admin', 'superadmin']), UserController.deactivate);


// Swagger components
/**
 * @swagger
 * components:
 *   schemas:
 *     UserCreate:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - tenantId
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
 *           example: Password123!
 *         tenantId:
 *           type: string
 *           example: abc123
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, admin, superadmin]
 *           default: ["user"]
 * 
 *     UserUpdate:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           example: johndoe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
 *           example: NewPassword123!
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, admin, superadmin]
 *         isActive:
 *           type: boolean
 */

module.exports = router;