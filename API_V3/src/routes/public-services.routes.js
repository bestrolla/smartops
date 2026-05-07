const express = require('express');
const router = express.Router();
const ServiceController = require('../features/services/controllers/ServiceController');
const ServiceCategoryController = require('../features/services/controllers/ServiceCategoryController');
const { identifyTenant } = require('../core/tenant/middlewares/tenant.middleware');
const logger = require('../shared/logger');
const ProductController = require('../features/products/controllers/productController');

// Middleware para identificar tenant (sin autenticación)
router.use(identifyTenant);

/**
 * @swagger
 * tags:
 *   name: Public Services
 *   description: Endpoints públicos para servicios (sin autenticación)
 */

/**
 * @swagger
 * /api/public/services:
 *   get:
 *     summary: Obtener servicios públicos de un tenant
 *     tags: [Public Services]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del tenant
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug del tenant
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: isPackage
 *         schema:
 *           type: boolean
 *         description: Filtrar por servicios normales o paquetes
 *     responses:
 *       200:
 *         description: Lista de servicios públicos
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
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           duration:
 *                             type: number
 *                           price:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           isPackage:
 *                             type: boolean
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *       404:
 *         description: Tenant no encontrado
 */
router.get('/', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado',
        message: 'No se pudo identificar el tenant. Proporcione X-Tenant-Name o X-Tenant-Slug en el header.'
      });
    }

    const { categoryId, isPackage } = req.query;
    
    // Construir filtros
    const filters = {
      isActive: true,
      tenantId: req.tenant._id
    };
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (isPackage !== undefined) {
      filters.isPackage = isPackage === 'true';
    }

    // Obtener servicios
    const services = await ServiceController.getPublicServices(filters);
    
    // Obtener categorías para enriquecer la respuesta
    const categories = await ServiceCategoryController.getPublicCategories(req.tenant._id);
    
    // Enriquecer servicios con información de categorías
    const enrichedServices = services.map(service => {
      const category = categories.find(cat => cat._id.toString() === service.categoryId?.toString());
      return {
        id: service._id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        currency: service.currency,
        isPackage: service.isPackage,
        category: category ? {
          id: category._id,
          name: category.name
        } : null,
        requirements: service.requirements || [],
        createdAt: service.createdAt
      };
    });

    res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutos
    res.json({
      success: true,
      data: {
        services: enrichedServices,
        categories: categories.map(cat => ({
          id: cat._id,
          name: cat.name,
          description: cat.description
        })),
        tenant: {
          id: req.tenant._id,
          name: req.tenant.name,
          slug: req.tenant.slug
        }
      }
    });

  } catch (error) {
    logger.error('Error en endpoint público de servicios:', {
      error: error.message,
      stack: error.stack,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/services/categories:
 *   get:
 *     summary: Obtener categorías públicas de servicios
 *     tags: [Public Services]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del tenant
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug del tenant
 *     responses:
 *       200:
 *         description: Lista de categorías públicas
 */
router.get('/categories', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const categories = await ServiceCategoryController.getPublicCategories(req.tenant._id);

    res.set('Cache-Control', 'public, max-age=600'); // Cache 10 minutos
    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat._id,
          name: cat.name,
          description: cat.description,
          parentCategory: cat.parentCategory,
          createdAt: cat.createdAt
        }))
      }
    });

  } catch (error) {
    logger.error('Error obteniendo categorías públicas:', {
      error: error.message,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/services/{id}:
 *   get:
 *     summary: Obtener un servicio público específico
 *     tags: [Public Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del servicio
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del tenant
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug del tenant
 *     responses:
 *       200:
 *         description: Datos del servicio
 *       404:
 *         description: Servicio no encontrado
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const service = await ServiceController.getPublicServiceById(req.params.id, req.tenant._id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Servicio no encontrado',
        message: 'El servicio solicitado no existe o no está disponible'
      });
    }

    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      success: true,
      data: {
        id: service._id,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        currency: service.currency,
        isPackage: service.isPackage,
        requirements: service.requirements || [],
        professionals: service.professionals || [],
        packageServices: service.packageServices || [],
        createdAt: service.createdAt,
        updatedAt: service.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error obteniendo servicio público:', {
      error: error.message,
      serviceId: req.params.id,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/products:
 *   get:
 *     summary: Obtener productos públicos de un tenant
 *     tags: [Public Products]
 *     parameters:
 *       - in: header
 *         name: X-Tenant-Name
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del tenant
 *       - in: header
 *         name: X-Tenant-Slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Slug del tenant
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por productos activos
 *     responses:
 *       200:
 *         description: Lista de productos públicos
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       category:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *       404:
 *         description: Tenant no encontrado
 */
router.get('/products', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado',
        message: 'No se pudo identificar el tenant. Proporcione X-Tenant-Name o X-Tenant-Slug en el header.'
      });
    }

    const { categoryId, isActive } = req.query;

    // Construir filtros
    const filters = {
      tenantId: req.tenant._id
    };

    if (categoryId && typeof categoryId === 'string') {
      filters.categoryId = categoryId;
    } else if (categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid categoryId',
        message: 'categoryId must be a string.'
      });
    }

    if (isActive !== undefined) {
      if (isActive === 'true' || isActive === 'false') {
        filters.isActive = isActive === 'true';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid isActive',
          message: 'isActive must be true or false.'
        });
      }
    }

    // Obtener productos
    const products = await ProductController.getPublicProducts(filters);

    res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutos
    res.json({
      success: true,
      data: products.map(product => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category ? {
          id: product.category._id,
          name: product.category.name
        } : null
      }))
    });

  } catch (error) {
    logger.error('Error en endpoint público de productos:', {
      error: error.message,
      stack: error.stack,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

module.exports = router;