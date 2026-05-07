const express = require('express');
const router = express.Router();
const AuthController = require('./controllers/auth.controller');
const userRoutes = require('./users/routes');
const roleRoutes = require('./roles/routes');
const { validateRegister, validateLogin } = require('./validations/auth.validations');
const { authenticate } = require('./middlewares/auth.middleware');

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Complete registration (tenant + admin user + subscription)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               organizationName:
 *                 type: string
 *               domain:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               profile:
 *                 type: object
 *               // NUEVO: elegir exactamente uno
 *               trial:
 *                 type: boolean
 *                 description: Activa prueba de 7 días con el plan más económico
 *               planId:
 *                 type: string
 *                 description: ID de un plan activo existente
 *     responses:
 *       201:
 *         description: Tenant, usuario admin y suscripción creados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenant:
 *                   $ref: '#/components/schemas/Tenant'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 */
router.post('/signup', validateRegister, AuthController.signUp);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

// Mount user and role routes
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);

// Swagger components
/**
 * @swagger
 * components:
 *   schemas:
 *     SignUpRequest:
 *       type: object
 *       required:
 *         - organizationName
 *         - domain
 *         - email
 *         - password
 *         - username
 *       properties:
 *         organizationName:
 *           type: string
 *           example: "Acme Corp"
 *         domain:
 *           type: string
 *           example: "acme"
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@acme.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *         username:
 *           type: string
 *           example: "admin_acme"
 * 
 *     SignUpResponse:
 *       type: object
 *       properties:
 *         tenant:
 *           $ref: '#/components/schemas/Tenant'
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: johndoe
 *         password:
 *           type: string
 *           format: password
 *           example: Password123!
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         tenantId:
 *           type: string
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
/**
/**
 * @swagger
 * /api/auth/roles/{userId}/assign:
 *   post:
 *     summary: Assign roles to a user
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleAssignment'
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleOperationResponse'
 *       403:
 *         description: Unauthorized - trying to assign roles from another tenant
 *       404:
 *         description: User or role not found
 */

/**
 * @swagger
 * /api/auth/roles/{userId}/remove:
 *   post:
 *     summary: Remove roles from a user
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleAssignment'
 *     responses:
 *       200:
 *         description: Roles removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleOperationResponse'
 *       403:
 *         description: Unauthorized - trying to remove roles from another tenant
 *       404:
 *         description: User or role not found
 */

module.exports = router;