const express = require('express');
const router = express.Router();
const { ProfileController } = require('./controllers/profile.controller');
const { ProfileSectionsController } = require('./controllers/profileSections.controller');
const { TestimonialsController } = require('./controllers/testimonials.controller');
const { LocationController } = require('./controllers/location.controller');
const ProfileThemeController = require('./controllers/profileThemeController');
const NFCController = require('./controllers/nfc.controller');
const FileUploadService = require('../../core/file-uploads/services/fileUpload.service');
const { 
  createOrUpdateProfileSchema, 
  partialUpdateProfileSchema,
  linkNFCSchema,
  nfcScanSchema,
  objectIdParamSchema,
  updateColorsSchema,
  updateContactSchema,
  sectionOrderSchema,
  testimonialSchema,
  locationSchema,
  testimonialParamSchema,
  // Nuevo: validador de etiqueta manual
  nfcLabelSchema
} = require('./validations/profile.validation');
const { authenticate, authorize } = require('../auth/middlewares/auth.middleware');
const validate = require('../../shared/middlewares/validate');

// Tipos MIME permitidos para la imagen de perfil
const allowedProfileImageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const maxProfileImageSize = 2 * 1024 * 1024; // 2MB

// Middleware de Multer para la carga de la imagen de perfil
const profileUploadMiddleware = FileUploadService.createUploadMiddleware({
  category: 'profiles', // Subcarpeta de destino
  allowedTypes: allowedProfileImageMimeTypes,
  maxFileSize: maxProfileImageSize
});

/**
 * @swagger
 * tags:
 *   - name: Profiles
 *     description: User profile management
 *   - name: NFC
 *     description: NFC card operations
 */

// ==================== PROFILE THEMES ROUTES (PUBLIC) ====================

/**
 * @swagger
 * /api/profiles/themes:
 *   get:
 *     summary: Get all profile themes
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [designer, consultant, medical, creative, business, technology]
 *         description: Filter by theme category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search themes by name, description, profession, or style
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of themes to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of profile themes
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
 *                     themes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProfileTheme'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */
router.get('/themes', ProfileThemeController.getAllThemes);

/**
 * @swagger
 * /api/profiles/themes/popular:
 *   get:
 *     summary: Get popular profile themes
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of themes to return
 *     responses:
 *       200:
 *         description: List of popular profile themes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProfileTheme'
 */
router.get('/themes/popular', ProfileThemeController.getPopularThemes);

/**
 * @swagger
 * /api/profiles/themes/search:
 *   get:
 *     summary: Search profile themes
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results for profile themes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProfileTheme'
 */
router.get('/themes/search', ProfileThemeController.searchThemes);

/**
 * @swagger
 * /api/profiles/themes/category/{category}:
 *   get:
 *     summary: Get profile themes by category
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [designer, consultant, medical, creative, business, technology]
 *         description: Theme category
 *     responses:
 *       200:
 *         description: List of profile themes by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProfileTheme'
 */
router.get('/themes/category/:category', ProfileThemeController.getThemesByCategory);

/**
 * @swagger
 * /api/profiles/themes/{id}:
 *   get:
 *     summary: Get a specific profile theme by ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theme ID
 *     responses:
 *       200:
 *         description: Profile theme details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProfileTheme'
 *       404:
 *         description: Theme not found
 */
router.get('/themes/:id', ProfileThemeController.getThemeById);

/**
 * @swagger
 * /api/profiles/themes/{id}/usage:
 *   post:
 *     summary: Increment theme usage count
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theme ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tenant_id:
 *                 type: string
 *                 description: Tenant ID using the theme
 *     responses:
 *       200:
 *         description: Usage count incremented
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
router.post('/themes/:id/usage', ProfileThemeController.incrementThemeUsage);

/**
 * @swagger
 * /api/profiles/themes/stats:
 *   get:
 *     summary: Get profile themes statistics
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: Profile themes statistics
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
 *                     total_themes:
 *                       type: integer
 *                     total_usage:
 *                       type: integer
 *                     category_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     top_themes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           usage:
 *                             type: object
 *                             properties:
 *                               total_profiles:
 *                                 type: number
 *                               rating:
 *                                 type: number
 */
router.get('/themes/stats', ProfileThemeController.getThemeStats);

// ==================== PROFILE THEMES ROUTES (AUTHENTICATED) ====================

/**
 * @swagger
 * /api/profiles/{tenant_id}/themes:
 *   get:
 *     summary: Get available themes for a specific tenant
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search themes
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of themes to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: Available themes for tenant
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
 *                     themes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProfileTheme'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 */
router.get('/:tenant_id/themes', ProfileController.getAvailableThemes);

/**
 * @swagger
 * /api/profiles/{tenant_id}/themes/apply:
 *   post:
 *     summary: Apply a theme to a tenant's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - theme_id
 *             properties:
 *               theme_id:
 *                 type: string
 *                 description: Theme ID to apply
 *     responses:
 *       200:
 *         description: Theme applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/Profile'
 *                     theme:
 *                       $ref: '#/components/schemas/ProfileTheme'
 *       400:
 *         description: Invalid theme ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Theme or profile not found
 */
router.post('/:tenant_id/themes/apply', ProfileController.applyThemeToProfile);

// Middleware de autenticación global para el resto de rutas
router.use(authenticate);

/**
 * @swagger
 * /api/profiles/themes/{id}/review:
 *   post:
 *     summary: Add a review to a theme
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Theme ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Review comment
 *               tenant_id:
 *                 type: string
 *                 description: Tenant ID leaving the review
 *     responses:
 *       200:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid rating or comment
 *       401:
 *         description: Authentication required
 */
router.post('/themes/:id/review', ProfileThemeController.addThemeReview);

/**
 * @swagger
 * /api/profiles/{tenant_id}:
 *   post:
 *     summary: Create or update tenant profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               public_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen para el perfil (JPG, PNG, GIF)
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *               social_links:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     url:
 *                       type: string
 *                     display_name:
 *                       type: string
 *               business_details:
 *                 type: object
 *                 properties:
 *                   services:
 *                     type: array
 *                     items:
 *                       type: string
 *                   plans:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         price:
 *                           type: string
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 *                   brand_colors:
 *                     type: object
 *                     properties:
 *                       primary:
 *                         type: string
 *                       light:
 *                         type: string
 *                       dark:
 *                         type: string
 *     responses:
 *       200:
 *         description: Profile created/updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (admin access required)
 */
router.post(
  '/:tenant_id', 
  validate(objectIdParamSchema, 'params'),
  profileUploadMiddleware.single('profileImage'),
  validate(createOrUpdateProfileSchema, 'body'),
  authorize(['admin', 'superadmin']),
  ProfileController.createOrUpdate
);

/**
 * @swagger
 * /api/profiles/{tenant_id}:
 *   get:
 *     summary: Get tenant profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.get(
  '/:tenant_id',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  ProfileController.getProfile
);

/**
 * @swagger
 * /api/profiles/{tenant_id}:
 *   put:
 *     summary: Update tenant profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               public_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen para el perfil (JPG, PNG, GIF)
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *               social_links:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     url:
 *                       type: string
 *                     display_name:
 *                       type: string
 *               testimonials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     content:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     role:
 *                       type: string
 *                     avatar:
 *                       type: string
 *               business_details:
 *                 type: object
 *                 properties:
 *                   services:
 *                     type: array
 *                     items:
 *                       type: string
 *                   plans:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         price:
 *                           type: string
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 *                   brand_colors:
 *                     type: object
 *                     properties:
 *                       primary:
 *                         type: string
 *                       light:
 *                         type: string
 *                       dark:
 *                         type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.put(
  '/:tenant_id', 
  validate(objectIdParamSchema, 'params'),
  profileUploadMiddleware.single('profileImage'),
  validate(createOrUpdateProfileSchema, 'body'),
  authorize(['admin', 'superadmin']),
  ProfileController.createOrUpdate
);

/**
 * @swagger
 * /api/profiles/{tenant_id}:
 *   patch:
 *     summary: Partially update tenant profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               public_name:
 *                 type: string
 *               bio:
 *                 type: string
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *               social_links:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                     url:
 *                       type: string
 *                     display_name:
 *                       type: string
 *               testimonials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     content:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     role:
 *                       type: string
 *                     avatar:
 *                       type: string
 *               stats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     value:
 *                       type: string
 *               theme:
 *                 type: object
 *                 properties:
 *                   primary_color:
 *                     type: string
 *                   secondary_color:
 *                     type: string
 *                   accent_color:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.patch(
  '/:tenant_id', 
  validate(objectIdParamSchema, 'params'),
  validate(partialUpdateProfileSchema, 'body'),
  authorize(['admin', 'superadmin']),
  ProfileController.partialUpdate
);

/**
 * @swagger
 * /api/profiles/{tenant_id}:
 *   delete:
 *     summary: Delete tenant profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Profile deleted successfully
 *       403:
 *         description: Forbidden (admin access required)
 */
router.delete(
  '/:tenant_id',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin']),
  ProfileController.deleteProfile
);

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: List all profiles (Superadmin only)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       403:
 *         description: Forbidden (superadmin access required)
 */
router.get(
  '/',
  authorize(['superadmin']),
  ProfileController.listProfiles
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/sections:
 *   get:
 *     summary: Get available profile sections based on tenant features
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available sections and current configuration
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
 *                     tenant_features:
 *                       type: object
 *                     available_sections:
 *                       type: object
 *                     current_configuration:
 *                       type: object
 *                     all_sections:
 *                       type: object
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Tenant not found
 */
router.get(
  '/:tenant_id/sections',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  ProfileSectionsController.getAvailableSections
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/sections:
 *   put:
 *     summary: Update profile sections configuration
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile_sections:
 *                 type: object
 *                 properties:
 *                   show_services:
 *                     type: boolean
 *                   show_products:
 *                     type: boolean
 *                   show_appointments:
 *                     type: boolean
 *                   show_stats:
 *                     type: boolean
 *                   show_testimonials:
 *                     type: boolean
 *                   show_contact:
 *                     type: boolean
 *                   show_social:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Sections configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid sections for current plan
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Tenant not found
 */
router.put(
  '/:tenant_id/sections',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin']),
  ProfileSectionsController.updateSections
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/sections/order:
 *   put:
 *     summary: Update profile sections order
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - section_order
 *             properties:
 *               section_order:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [header, stats, services, products, testimonials, contact, social, appointments]
 *                 example: ["header", "stats", "services", "testimonials", "contact", "social"]
 *     responses:
 *       200:
 *         description: Sections order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     section_order:
 *                       type: array
 *                       items:
 *                         type: string
 *                     profile_id:
 *                       type: string
 *       400:
 *         description: Invalid section order
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.put(
  '/:tenant_id/sections/order',
  validate(objectIdParamSchema, 'params'),
  validate(sectionOrderSchema, 'body'),
  authorize(['admin', 'superadmin']),
  ProfileSectionsController.updateSectionOrder
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/sections/order:
 *   get:
 *     summary: Get profile sections order
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current sections order
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
 *                     section_order:
 *                       type: array
 *                       items:
 *                         type: string
 *                     profile_id:
 *                       type: string
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.get(
  '/:tenant_id/sections/order',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  ProfileSectionsController.getSectionOrder
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/sections/config:
 *   get:
 *     summary: Get complete profile sections configuration
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complete sections configuration
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
 *                     tenant_features:
 *                       type: object
 *                     sections:
 *                       type: object
 *                     current_order:
 *                       type: array
 *                       items:
 *                         type: string
 *                     profile_id:
 *                       type: string
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Tenant not found
 */
router.get(
  '/:tenant_id/sections/config',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  ProfileSectionsController.getAllSectionsConfig
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/colors:
 *   put:
 *     summary: Update profile colors
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primary_color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *                 example: "#4f46e5"
 *               secondary_color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *                 example: "#7c3aed"
 *               accent_color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *                 example: "#ffffff"
 *               font_family:
 *                 type: string
 *                 example: "Montserrat"
 *     responses:
 *       200:
 *         description: Profile colors updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     theme:
 *                       type: object
 *                     profile_id:
 *                       type: string
 *       400:
 *         description: Invalid color values
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.put(
  '/:tenant_id/colors',
  validate(objectIdParamSchema, 'params'),
  validate(updateColorsSchema, 'body'),
  authorize(['admin', 'superadmin']),
  ProfileController.updateProfileColors
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/colors:
 *   get:
 *     summary: Get profile colors configuration
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current profile colors
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
 *                     theme:
 *                       type: object
 *                     profile_id:
 *                       type: string
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.get(
  '/:tenant_id/colors',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  ProfileController.getProfileColors
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/contact:
 *   put:
 *     summary: Update profile contact information
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com"
 *     responses:
 *       200:
 *         description: Contact information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     contact:
 *                       type: object
 *                     profile_id:
 *                       type: string
 *       400:
 *         description: Invalid contact information
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.put(
  '/:tenant_id/contact',
  validate(objectIdParamSchema, 'params'),
  validate(updateContactSchema, 'body'),
  authorize(['admin', 'superadmin']),
  ProfileController.updateContactInfo
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/contact:
 *   get:
 *     summary: Get profile contact information
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current contact information
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
 *                     contact:
 *                       type: object
 *                     profile_id:
 *                       type: string
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.get(
  '/:tenant_id/contact',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  ProfileController.getContactInfo
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/nfc:
 *   get:
 *     summary: Get NFC payload for tenant profile
 *     tags: [NFC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: NFC payload generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NFCPayload'
 *       403:
 *         description: Forbidden (tenant access required)
 *       404:
 *         description: Profile not found
 */
router.get(
  '/:tenant_id/nfc',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  NFCController.getPayload
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/nfc/link:
 *   post:
 *     summary: Link NFC card to tenant profile
 *     tags: [NFC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               card_uid:
 *                 type: string
 *                 example: "04A1B2C3D4E5F6"
 *     responses:
 *       200:
 *         description: NFC card linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile or NFC card not found
 *       409:
 *         description: NFC card already linked
 */
router.post(
  '/:tenant_id/nfc/link',
  validate(objectIdParamSchema, 'params'),
  validate(linkNFCSchema, 'body'),
  authorize(['admin', 'superadmin', 'user']),
  NFCController.linkCard
);

// Vincular por etiqueta (genera UID de 20 hex y vincula)
router.post(
  '/:tenant_id/nfc/link-by-label',
  validate(objectIdParamSchema, 'params'),
  validate(nfcLabelSchema, 'body'),
  authorize(['admin', 'superadmin', 'user']),
  NFCController.linkByLabel
);

// Nuevo: actualizar etiqueta manual de NFC (no requiere formato UID)
router.post(
  '/:tenant_id/nfc/label',
  validate(objectIdParamSchema, 'params'),
  validate(nfcLabelSchema, 'body'),
  authorize(['admin', 'superadmin', 'user']),
  NFCController.updateLabel
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/nfc/unlink:
 *   post:
 *     summary: Unlink NFC card from tenant profile
 *     tags: [NFC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: NFC card unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Profile not found
 */
router.post(
  '/:tenant_id/nfc/unlink',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  NFCController.unlinkCard
);

/**
 * @swagger
 * /api/profiles/nfc/scan:
 *   post:
 *     summary: Get profile by NFC card UID (public)
 *     tags: [NFC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card_uid
 *             properties:
 *               card_uid:
 *                 type: string
 *                 example: "04A1B2C3D4E5F6"
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfilePublic'
 *       400:
 *         description: Validation error
 *       404:
 *         description: NFC card not registered or profile not found
 */
router.post(
  '/nfc/scan',
  validate(nfcScanSchema, 'body'),
  NFCController.getProfileByNFC
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ProfileInput:
 *       type: object
 *       required:
 *         - public_name
 *       properties:
 *         public_name:
 *           type: string
 *           example: "John Doe"
 *         bio:
 *           type: string
 *           example: "Software Developer"
 *         contact:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             phone:
 *               type: string
 *             website:
 *               type: string
 *         social_links:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SocialLink'
 * 
 *     Profile:
 *       allOf:
 *         - $ref: '#/components/schemas/ProfileInput'
 *         - type: object
 *           properties:
 *             tenant_id:
 *               type: string
 *             user_id:
 *               type: string
 *             nfc:
 *               $ref: '#/components/schemas/NFCData'
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 * 
 *     ProfilePublic:
 *       type: object
 *       properties:
 *         public_name:
 *           type: string
 *         bio:
 *           type: string
 *         contact:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             website:
 *               type: string
 *         social_links:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SocialLink'
 * 
 *     SocialLink:
 *       type: object
 *       properties:
 *         platform:
 *           type: string
 *           enum: [linkedin, twitter, github, custom]
 *         url:
 *           type: string
 *           format: uri
 *         display_name:
 *           type: string
 * 
 *     NFCData:
 *       type: object
 *       properties:
 *         card_uid:
 *           type: string
 *           example: "04A1B2C3D4E580"
 *         is_linked:
 *           type: boolean
 *         last_updated:
 *           type: string
 *           format: date-time
 * 
 *     NFCPayload:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: "URL"
 *         payload:
 *           type: string
 *           format: uri
 *           example: "https://example.com/profile/tenant123/user456"
 *         qr_code:
 *           type: string
 *           format: uri
 *           example: "https://api.qrserver.com/v1/create-qr-code/?data=https://example.com/profile/tenant123/user456"
 * 
 *     NFCLinkRequest:
 *       type: object
 *       required:
 *         - card_uid
 *       properties:
 *         card_uid:
 *           type: string
 *           example: "04A1B2C3D4E580"
 * 
 *     NFCScanRequest:
 *       type: object
 *       required:
 *         - card_uid
 *       properties:
 *         card_uid:
 *           type: string
 *           example: "04A1B2C3D4E580"
 * 
 *     ProfileTheme:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "carlos-carrasco"
 *         name:
 *           type: string
 *           example: "Carlos Carrasco"
 *         description:
 *           type: string
 *           example: "Diseñador Web - Estilo minimalista y elegante"
 *         profession:
 *           type: string
 *           example: "Diseñador Web"
 *         style:
 *           type: string
 *           example: "Minimalista y Elegante"
 *         image:
 *           type: string
 *           format: uri
 *           example: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
 *         preview_url:
 *           type: string
 *           example: "/carlos-carrasco"
 *         colors:
 *           type: object
 *           properties:
 *             primary:
 *               type: string
 *               example: "#111111"
 *             secondary:
 *               type: string
 *               example: "#1a1a1a"
 *             accent:
 *               type: string
 *               example: "#ffffff"
 *         layout:
 *           type: object
 *           properties:
 *             header:
 *               type: string
 *               enum: [dark, light, gradient-blue, gradient-art]
 *             stats:
 *               type: string
 *               enum: [minimal, corporate, medical, creative]
 *             services:
 *               type: string
 *               enum: [minimal, corporate, medical, creative]
 *             testimonials:
 *               type: string
 *               enum: [minimal, corporate, medical, creative]
 *         category:
 *           type: string
 *           enum: [designer, consultant, medical, creative, business, technology]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         usage:
 *           type: object
 *           properties:
 *             total_profiles:
 *               type: number
 *             rating:
 *               type: number
 *             reviews:
 *               type: array
 *               items:
 *                 type: object
 */

// ==================== TESTIMONIALS ROUTES ====================

/**
 * @swagger
 * /api/profiles/{tenant_id}/testimonials:
 *   get:
 *     summary: Get testimonials for a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of testimonials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Testimonial'
 */
router.get(
  '/:tenant_id/testimonials',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  TestimonialsController.getTestimonials
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/testimonials:
 *   post:
 *     summary: Add a testimonial to a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Testimonial'
 *     responses:
 *       200:
 *         description: Testimonial added successfully
 */
router.post(
  '/:tenant_id/testimonials',
  validate(objectIdParamSchema, 'params'),
  validate(testimonialSchema, 'body'),
  authorize(['admin', 'superadmin']),
  TestimonialsController.addTestimonial
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/testimonials/batch:
 *   post:
 *     summary: Add multiple testimonials or replace testimonials array
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testimonials:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Testimonial'
 *     responses:
 *       200:
 *         description: Testimonials added/updated successfully
 */
router.post(
  '/:tenant_id/testimonials/batch',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin']),
  TestimonialsController.addMultipleTestimonials
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/testimonials/{testimonial_id}:
 *   put:
 *     summary: Update a specific testimonial
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testimonial_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Testimonial'
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 */
router.put(
  '/:tenant_id/testimonials/:testimonial_id',
  validate(testimonialParamSchema, 'params'),
  validate(testimonialSchema, 'body'),
  authorize(['admin', 'superadmin']),
  TestimonialsController.updateTestimonial
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/testimonials/{testimonial_id}:
 *   delete:
 *     summary: Delete a specific testimonial
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testimonial_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
 */
router.delete(
  '/:tenant_id/testimonials/:testimonial_id',
  validate(testimonialParamSchema, 'params'),
  authorize(['admin', 'superadmin']),
  TestimonialsController.deleteTestimonial
);

// ==================== LOCATION ROUTES ====================

/**
 * @swagger
 * /api/profiles/{tenant_id}/location:
 *   get:
 *     summary: Get location for a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 */
router.get(
  '/:tenant_id/location',
  validate(objectIdParamSchema, 'params'),
  authorize(['admin', 'superadmin', 'user']),
  LocationController.getLocation
);

/**
 * @swagger
 * /api/profiles/{tenant_id}/location:
 *   put:
 *     summary: Update location for a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Location'
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.put(
  '/:tenant_id/location',
  validate(objectIdParamSchema, 'params'),
  validate(locationSchema, 'body'),
  authorize(['admin', 'superadmin']),
  LocationController.updateLocation
);

module.exports = router;