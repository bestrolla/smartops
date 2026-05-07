const express = require('express');
const router = express.Router();
const productController = require('./controllers/productController');
const simpleProductController = require('./controllers/simpleProductController');
const categoryController = require('./controllers/categoryController');
const { validateProduct, validateProductUpdate } = require('./validations/productValidations');
const { validateCreateCategory, validateUpdateCategory } = require('./validations/categoryValidations');
const validateObjectId = require('./middlewares/validateObjectId');
const ProductPolicy = require('./policies/productPolicy');
const { authenticate, authorize } = require('../../core/auth/middlewares/auth.middleware');
const { identifyTenant } = require('../../core/tenant/middlewares/tenant.middleware');
const variantController = require('./controllers/ProductVariantController');
const { protect, restrictTo } = require('../../core/auth/middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API para gestión de productos y sus variantes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VariantOption:
 *       type: object
 *       required:
 *         - name
 *         - value
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre de la opción (ej. "Color", "Talla")
 *         value:
 *           type: string
 *           description: Valor de la opción (ej. "Rojo", "XL")
 *     
 *     ProductVariant:
 *       type: object
 *       required:
 *         - sku
 *         - price
 *         - options
 *       properties:
 *         sku:
 *           type: string
 *           description: SKU único de la variante
 *         price:
 *           type: number
 *           description: Precio de la variante
 *         cost:
 *           type: number
 *           description: Costo de la variante
 *         stock:
 *           type: number
 *           description: Stock disponible
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/VariantOption'
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 * 
 *     ProductBase:
 *       type: object
 *       required:
 *         - name
 *         - sku
 *         - basePrice
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del producto
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *           description: SKU único del producto
 *         basePrice:
 *           type: number
 *           description: Precio base del producto
 *         baseCost:
 *           type: number
 *           description: Costo base del producto
 *         hasVariants:
 *           type: boolean
 *           description: Indica si el producto tiene variantes
 *         variantOptions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 */

// Middleware de autenticación y tenant
// router.use(authenticate);
router.use(identifyTenant);

// ==============================================
// RUTAS DE CATEGORÍAS
// ==============================================

/**
 * @swagger
 * /api/products/categories:
 *   post:
 *     summary: Crear nueva categoría
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Error de validación
 *       403:
 *         description: No autorizado
 */
router.post('/categories', categoryController.createCategory);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Obtener todas las categorías del tenant
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por categorías activas/inactivas
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       403:
 *         description: No autorizado
 */
router.get('/categories', categoryController.getCategories);

/**
 * @swagger
 * /api/products/categories/tree:
 *   get:
 *     summary: Obtener árbol jerárquico de categorías
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     responses:
 *       200:
 *         description: Árbol de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   children:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Category'
 *       403:
 *         description: No autorizado
 */
router.get('/categories/tree', categoryController.getCategoryTree);

/**
 * @swagger
 * /api/products/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Detalles de la categoría
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoría no encontrada
 *       403:
 *         description: No autorizado
 */
router.get('/categories/:id', categoryController.getCategory);

/**
 * @swagger
 * /api/products/categories/{id}:
 *   patch:
 *     summary: Actualizar una categoría existente
 *     description: Actualiza los datos de una categoría específica. Solo se actualizarán los campos proporcionados.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nuevo nombre de la categoría
 *               description:
 *                 type: string
 *                 description: Nueva descripción de la categoría
 *               parentId:
 *                 type: string
 *                 description: ID de la categoría padre (opcional)
 *               isActive:
 *                 type: boolean
 *                 description: Estado de la categoría
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Categoría actualizada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Error de validación o ID inválido
 *       404:
 *         description: Categoría no encontrada
 *       403:
 *         description: No autorizado
 */
router.patch('/categories/:id', validateObjectId(), validateUpdateCategory, categoryController.updateCategory);

/**
 * @swagger
 * /api/products/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría (marcar como inactiva)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *       - tenantHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       204:
 *         description: Categoría eliminada (marcada como inactiva)
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: No se puede eliminar (tiene productos o subcategorías asociadas)
 */
router.delete('/categories/:id', categoryController.deleteCategory);

// ==============================================
// RUTAS DE PRODUCTOS
// ==============================================

// ==============================================
// RUTAS SIMPLIFICADAS (NUEVAS)
// ==============================================

/**
 * @swagger
 * /api/products/simple:
 *   get:
 *     summary: Obtiene lista de productos (versión simplificada)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: hasVariants
 *         schema:
 *           type: boolean
 *         description: Filtrar por productos con/sin variantes
 *       - in: query
 *         name: includeVariants
 *         schema:
 *           type: boolean
 *         description: Si se deben incluir las variantes
 *     responses:
 *       200:
 *         description: Lista de productos con información enriquecida
 */
router.get('/simple', simpleProductController.getAllProducts);

/**
 * @swagger
 * /api/products/simple:
 *   post:
 *     summary: Crea un nuevo producto (versión simplificada)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sku
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto
 *               sku:
 *                 type: string
 *                 description: SKU único del producto
 *               description:
 *                 type: string
 *                 description: Descripción del producto
 *               category:
 *                 type: string
 *                 description: ID de la categoría
 *               brand:
 *                 type: string
 *                 description: Marca del producto
 *               condition:
 *                 type: string
 *                 enum: [new, used, refurbished]
 *                 description: Condición del producto
 *               hasVariants:
 *                 type: boolean
 *                 description: Si el producto tiene variantes
 *               price:
 *                 type: number
 *                 description: Precio (requerido si no tiene variantes)
 *               stock:
 *                 type: number
 *                 description: Stock (para productos sin variantes)
 *               variantAttributes:
 *                 type: array
 *                 description: Atributos para generar variantes
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     values:
 *                       type: array
 *                       items:
 *                         type: string
 *               variants:
 *                 type: array
 *                 description: Variantes del producto (si hasVariants es true)
 *                 items:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                     attributes:
 *                       type: object
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *                     isActive:
 *                       type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
router.post('/simple', simpleProductController.createProduct);

/**
 * @swagger
 * /api/products/simple/search:
 *   get:
 *     summary: Busca productos (versión simplificada)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
router.get('/simple/search', simpleProductController.searchProducts);

/**
 * @swagger
 * /api/products/simple/{id}:
 *   get:
 *     summary: Obtiene un producto por ID (versión simplificada)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto encontrado con información enriquecida
 */
router.get('/simple/:id', simpleProductController.getProduct);

/**
 * @swagger
 * /api/products/simple/{id}:
 *   put:
 *     summary: Actualiza un producto (versión simplificada)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Same schema as POST but optional fields
 *     responses:
 *       200:
 *         description: Producto actualizado
 */
router.put('/simple/:id', simpleProductController.updateProduct);

/**
 * @swagger
 * /api/products/simple/{id}:
 *   delete:
 *     summary: Elimina un producto (versión simplificada)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado (soft delete)
 */
router.delete('/simple/:id', simpleProductController.deleteProduct);

/**
 * @swagger
 * /api/products/simple/{id}/variants:
 *   get:
 *     summary: Obtiene las variantes de un producto (versión simplificada)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de variantes del producto
 */
router.get('/simple/:id/variants', simpleProductController.getProductVariants);

// ==============================================
// RUTAS LEGACY (MANTENER COMPATIBILIDAD)
// ==============================================

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtiene lista de productos (legacy)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página
 *       - in: query
 *         name: includeVariants
 *         schema:
 *           type: boolean
 *         description: Si se deben incluir las variantes
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductBase'
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtiene un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeVariants
 *         schema:
 *           type: boolean
 *         description: Si se deben incluir las variantes
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductBase'
 */
router.get('/:id', productController.getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crea un nuevo producto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductBase'
 *     responses:
 *       201:
 *         description: Producto creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductBase'
 */
router.post('/', productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualiza un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductBase'
 *     responses:
 *       200:
 *         description: Producto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductBase'
 */
router.put('/:id', productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Elimina un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Producto eliminado
 */
router.delete('/:id', productController.deleteProduct);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Busca productos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: includeVariants
 *         schema:
 *           type: boolean
 *         description: Si se deben incluir las variantes
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductBase'
 */
router.get('/search', productController.searchProducts);

// Rutas de variantes
/**
 * @swagger
 * /api/products/{productId}/variants:
 *   get:
 *     summary: Obtiene las variantes de un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de variantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductVariant'
 */
router.get('/:productId/variants', variantController.getProductVariants);

/**
 * @swagger
 * /api/products/{productId}/variants:
 *   post:
 *     summary: Crea una nueva variante
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       201:
 *         description: Variante creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductVariant'
 */
router.post('/:productId/variants', variantController.createVariant);

/**
 * @swagger
 * /api/products/{productId}/variants/bulk:
 *   post:
 *     summary: Crea múltiples variantes
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               variants:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       201:
 *         description: Variantes creadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductVariant'
 */
router.post('/:productId/variants/bulk', variantController.bulkCreateVariants);

/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}:
 *   get:
 *     summary: Obtiene una variante específica
 *     tags: [Products]
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
 *     responses:
 *       200:
 *         description: Variante encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductVariant'
 */
router.get('/:productId/variants/:variantId', variantController.getVariant);

/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}:
 *   put:
 *     summary: Actualiza una variante
 *     tags: [Products]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductVariant'
 *     responses:
 *       200:
 *         description: Variante actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductVariant'
 */
router.put('/:productId/variants/:variantId', variantController.updateVariant);

/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}:
 *   delete:
 *     summary: Elimina una variante
 *     tags: [Products]
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
 *     responses:
 *       204:
 *         description: Variante eliminada
 */
router.delete('/:productId/variants/:variantId', variantController.deleteVariant);

/**
 * @swagger
 * /api/products/{productId}/variants/{variantId}/stock:
 *   put:
 *     summary: Actualiza el stock de una variante
 *     tags: [Products]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Stock actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProductVariant'
 */
router.put('/:productId/variants/:variantId/stock', variantController.updateVariantStock);

module.exports = router;