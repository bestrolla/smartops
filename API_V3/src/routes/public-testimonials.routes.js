const express = require('express');
const router = express.Router();
const { identifyTenant } = require('../core/tenant/middlewares/tenant.middleware');
const logger = require('../shared/logger');

// Middleware para identificar tenant (sin autenticación)
router.use(identifyTenant);

/**
 * @swagger
 * tags:
 *   name: Public Testimonials
 *   description: Endpoints públicos para testimonios (sin autenticación)
 */

/**
 * @swagger
 * /api/public/testimonials:
 *   get:
 *     summary: Obtener testimonios públicos de un tenant
 *     tags: [Public Testimonials]
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de testimonios a retornar
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Solo testimonios destacados
 *     responses:
 *       200:
 *         description: Lista de testimonios públicos
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
 *                     testimonials:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           clientName:
 *                             type: string
 *                           clientTitle:
 *                             type: string
 *                           content:
 *                             type: string
 *                           rating:
 *                             type: number
 *                           isFeatured:
 *                             type: boolean
 *                           service:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
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

    const { limit = 10, featured } = req.query;
    
    // Construir filtros
    const filters = {
      tenantId: req.tenant._id,
      isActive: true,
      isApproved: true
    };
    
    if (featured === 'true') {
      filters.isFeatured = true;
    }

    // Obtener testimonios desde el perfil del tenant
    const ProfileService = require('../core/profiles/services/profile.service');
    const profile = await ProfileService.getProfile(req.tenant._id);
    
    if (!profile || !profile.testimonials || profile.testimonials.length === 0) {
      return res.json({
        success: true,
        data: {
          testimonials: [],
          total: 0
        }
      });
    }

    // Filtrar y limitar testimonios
    let testimonials = profile.testimonials.filter(testimonial => 
      testimonial.isActive !== false && testimonial.isApproved !== false
    );

    if (featured === 'true') {
      testimonials = testimonials.filter(testimonial => testimonial.isFeatured === true);
    }

    // Aplicar límite
    const limitNum = parseInt(limit);
    if (limitNum > 0) {
      testimonials = testimonials.slice(0, limitNum);
    }

    // Formatear testimonios
    const formattedTestimonials = testimonials.map(testimonial => ({
      id: testimonial._id || testimonial.id,
      clientName: testimonial.clientName || testimonial.name,
      clientTitle: testimonial.clientTitle || testimonial.title,
      content: testimonial.content || testimonial.testimonial,
      rating: testimonial.rating || 5,
      isFeatured: testimonial.isFeatured || false,
      service: testimonial.service ? {
        id: testimonial.service.id || testimonial.service._id,
        name: testimonial.service.name
      } : null,
      createdAt: testimonial.createdAt || testimonial.date
    }));

    res.set('Cache-Control', 'public, max-age=600'); // Cache 10 minutos
    res.json({
      success: true,
      data: {
        testimonials: formattedTestimonials,
        total: formattedTestimonials.length,
        tenant: {
          id: req.tenant._id,
          name: req.tenant.name,
          slug: req.tenant.slug
        }
      }
    });

  } catch (error) {
    logger.error('Error obteniendo testimonios públicos:', {
      error: error.message,
      stack: error.stack,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/testimonials:
 *   post:
 *     summary: Crear un nuevo testimonio (público)
 *     tags: [Public Testimonials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientName
 *               - content
 *               - rating
 *             properties:
 *               clientName:
 *                 type: string
 *                 description: Nombre del cliente
 *               clientTitle:
 *                 type: string
 *                 description: Título o cargo del cliente
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 description: Email del cliente (opcional)
 *               content:
 *                 type: string
 *                 description: Contenido del testimonio
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Calificación de 1 a 5 estrellas
 *               serviceId:
 *                 type: string
 *                 description: ID del servicio relacionado (opcional)
 *     responses:
 *       201:
 *         description: Testimonio creado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    const { clientName, clientTitle, clientEmail, content, rating, serviceId } = req.body;

    // Validar datos requeridos
    if (!clientName || !content || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos',
        message: 'clientName, content y rating son requeridos'
      });
    }

    // Validar rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating inválido',
        message: 'El rating debe ser un número entre 1 y 5'
      });
    }

    // Crear testimonio
    const ProfileService = require('../core/profiles/services/profile.service');
    const testimonial = {
      clientName,
      clientTitle: clientTitle || '',
      clientEmail: clientEmail || '',
      content,
      rating: ratingNum,
      serviceId: serviceId || null,
      isActive: true,
      isApproved: false, // Requiere aprobación
      isFeatured: false,
      createdAt: new Date()
    };

    // Agregar testimonio al perfil
    const updatedProfile = await ProfileService.addTestimonial(req.tenant._id, testimonial);

    if (!updatedProfile) {
      return res.status(500).json({
        success: false,
        error: 'Error interno',
        message: 'No se pudo crear el testimonio'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: testimonial._id || 'pending',
        clientName: testimonial.clientName,
        content: testimonial.content,
        rating: testimonial.rating,
        status: 'pending_approval'
      },
      message: 'Testimonio enviado exitosamente. Será revisado antes de ser publicado.'
    });

  } catch (error) {
    logger.error('Error creando testimonio público:', {
      error: error.message,
      tenantId: req.tenant?._id,
      clientName: req.body.clientName
    });
    next(error);
  }
});

/**
 * @swagger
 * /api/public/testimonials/stats:
 *   get:
 *     summary: Obtener estadísticas de testimonios
 *     tags: [Public Testimonials]
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
 *         description: Estadísticas de testimonios
 */
router.get('/stats', async (req, res, next) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant no identificado'
      });
    }

    // Obtener perfil del tenant
    const ProfileService = require('../core/profiles/services/profile.service');
    const profile = await ProfileService.getProfile(req.tenant._id);
    
    if (!profile || !profile.testimonials) {
      return res.json({
        success: true,
        data: {
          total: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          featured: 0
        }
      });
    }

    const testimonials = profile.testimonials.filter(t => 
      t.isActive !== false && t.isApproved !== false
    );

    // Calcular estadísticas
    const total = testimonials.length;
    const averageRating = total > 0 
      ? testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / total 
      : 0;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    testimonials.forEach(t => {
      const rating = t.rating || 5;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });

    const featured = testimonials.filter(t => t.isFeatured === true).length;

    res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutos
    res.json({
      success: true,
      data: {
        total,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        featured,
        tenant: {
          id: req.tenant._id,
          name: req.tenant.name,
          slug: req.tenant.slug
        }
      }
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de testimonios:', {
      error: error.message,
      tenantId: req.tenant?._id
    });
    next(error);
  }
});

module.exports = router;
