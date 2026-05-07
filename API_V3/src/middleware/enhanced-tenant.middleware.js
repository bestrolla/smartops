const TenantService = require('../core/tenant/services/tenant.service');
const logger = require('../shared/logger');

/**
 * Middleware mejorado para detectar tenant desde la URL
 * Maneja tanto perfiles públicos (por slug) como áreas administrativas (por name)
 */
const enhancedTenantDetection = async (req, res, next) => {
  const pathParts = req.path.split('/').filter(part => part);
  
  // Lista de archivos estáticos comunes que deben ser excluidos
  const staticFiles = [
    'favicon.ico', 'robots.txt', 'sitemap.xml', 'manifest.json',
    'apple-touch-icon.png', 'browserconfig.xml', 'sw.js'
  ];
  
  // Solo procesar si no es API, archivos estáticos o health check
  if (pathParts.length > 0 && 
      !req.path.startsWith('/api') && 
      !req.path.startsWith('/static') &&
      !req.path.startsWith('/health') &&
      !req.path.startsWith('/api-docs') &&
      !req.path.startsWith('/uploads') &&
      !staticFiles.includes(pathParts[0]) &&
      !pathParts[0].match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)) {
    
    const firstSegment = pathParts[0];
    req.originalPath = '/' + pathParts.slice(1).join('/');
    
    try {
      // PRIORIDAD 1: Buscar por slug (para perfiles públicos)
      let tenant = await TenantService.findBySlug(firstSegment);
      
      if (tenant && tenant.isActive) {
        req.tenant = tenant;
        req.tenantSlug = firstSegment;
        req.isPublicProfile = true;
        req.tenantDetectionMethod = 'slug';
        
        logger.info('Tenant detectado por slug', {
          slug: firstSegment,
          tenantId: tenant._id,
          tenantName: tenant.name
        });
        
        return next();
      }
      
      // PRIORIDAD 2: Buscar por name (para áreas administrativas)
      tenant = await TenantService.findByName(firstSegment);
      
      if (tenant && tenant.isActive) {
        req.tenant = tenant;
        req.tenantName = firstSegment;
        req.isAdminArea = true;
        req.tenantDetectionMethod = 'name';
        
        logger.info('Tenant detectado por name', {
          name: firstSegment,
          tenantId: tenant._id,
          slug: tenant.slug
        });
        
        return next();
      }
      
      // Si no encuentra tenant activo, marcar como no encontrado
      req.tenantNotFound = firstSegment;
      
      logger.warn('Tenant no encontrado', {
        segment: firstSegment,
        path: req.path,
        method: req.method
      });
      
    } catch (error) {
      logger.error('Error en detección de tenant:', {
        error: error.message,
        segment: firstSegment,
        path: req.path
      });
      
      // Continuar sin tenant en caso de error
      req.tenantError = error.message;
    }
  }
  
  next();
};

/**
 * Middleware para requerir que un tenant haya sido detectado
 */
const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    if (req.tenantNotFound) {
      return res.status(404).json({
        success: false,
        error: 'Perfil no encontrado',
        message: `No existe un perfil con el identificador: ${req.tenantNotFound}`,
        suggestion: 'Verifica que la URL sea correcta'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Tenant no identificado',
      message: 'No se pudo identificar la organización desde la URL'
    });
  }
  
  if (!req.tenant.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Perfil inactivo',
      message: 'Este perfil se encuentra temporalmente deshabilitado'
    });
  }
  
  next();
};

/**
 * Middleware específico para perfiles públicos
 */
const requirePublicProfile = (req, res, next) => {
  if (!req.isPublicProfile) {
    return res.status(404).json({
      success: false,
      error: 'Perfil no público',
      message: 'Esta URL no corresponde a un perfil público'
    });
  }
  
  next();
};

/**
 * Middleware específico para áreas administrativas
 */
const requireAdminArea = (req, res, next) => {
  if (!req.isAdminArea) {
    return res.status(404).json({
      success: false,
      error: 'Área administrativa no encontrada',
      message: 'Esta URL no corresponde a un área administrativa válida'
    });
  }
  
  next();
};

module.exports = {
  enhancedTenantDetection,
  requireTenant,
  requirePublicProfile,
  requireAdminArea
};
