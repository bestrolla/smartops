const TenantService = require('../services/tenant.service');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');
const mongoose = require('mongoose');

const identifyTenant = async (req, res, next) => {
  try {
    const originalPath = req.originalUrl || req.path;
    const method = req.method;

    // Rutas que no necesitan identificación de tenant en absoluto
    if (originalPath.startsWith('/api/health') || originalPath.startsWith('/static')) {
      return next();
    }

    let tenant;
    const tenantSlug = req.headers['x-tenant-slug'];
    const tenantId = req.headers['x-tenant-id'];
    const tenantName = req.tenantName; // De middleware anterior para rutas como /<tenantName>/dashboard

    // Prioridad 1: Acceso a API pública por Slug
    if (tenantSlug) {
      tenant = await TenantService.findBySlug(tenantSlug);
      if (!tenant) {
        logger.warn('Tenant no encontrado por slug de header', { tenantSlug });
        // No lanzamos error aquí para permitir otros métodos, pero es una advertencia
      }
    }

    // Prioridad 2: Usuario autenticado (si no se encontró por slug)
    if (!tenant && req.user?.tenantId) {
      if (!mongoose.Types.ObjectId.isValid(req.user.tenantId)) {
        logger.error('TenantID inválido en token de usuario', { tenantId: req.user.tenantId });
        return next(createError(400, 'Identificación de tenant inválida en credenciales'));
      }
      tenant = await TenantService.findById(req.user.tenantId);
    }

    // Prioridad 3: Acceso por nombre en la ruta (si no se encontró por otros métodos)
    if (!tenant && tenantName) {
      tenant = await TenantService.findByName(tenantName);
    }
    
    // Prioridad 4: Acceso por ID en el header (legado o casos específicos)
    if (!tenant && tenantId) {
        if (!mongoose.Types.ObjectId.isValid(tenantId)) {
            logger.warn('x-tenant-id header inválido', { tenantId });
        } else {
            tenant = await TenantService.findById(tenantId);
        }
    }

    // Si después de todos los métodos no hay tenant, y es una ruta de API que lo requiere, fallar.
    if (!tenant) {
        // Para rutas de API públicas, la falta de un tenant es un 404.
        if (originalPath.startsWith('/api/public')) {
            logger.warn('No se pudo identificar tenant para ruta pública', { path: originalPath, headers: req.headers });
            return next(createError(404, 'Recurso de tenant no encontrado. Verifique el slug.'));
        }
        // Para otras rutas de API, es un 400 Bad Request.
        logger.error('No se pudo identificar tenant para ruta protegida', { path: originalPath });
        return next(createError(400, 'Se requiere identificación de tenant'));
    }

    // Validaciones finales sobre el tenant encontrado
    if (!tenant.isActive) {
      logger.warn('Intento de acceso a tenant inactivo', { tenantId: tenant._id, name: tenant.name });
      return next(createError(403, 'El perfil de este negocio se encuentra inactivo'));
    }

    // Asignar tenant a la request para uso en controladores posteriores
    req.tenant = tenant;
    req.tenantId = tenant._id;
    logger.debug('Tenant identificado exitosamente', {
      tenantId: tenant._id,
      name: tenant.name,
      method: req.method,
      path: originalPath
    });

    next();
  } catch (error) {
    logger.error('Error fatal en middleware de identificación de tenant', {
      error: error.message,
      stack: error.stack,
      path: req.originalUrl
    });
    next(error);
  }
};

module.exports = { identifyTenant };