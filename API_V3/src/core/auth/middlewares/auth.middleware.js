// auth/middlewares/auth.middleware.js
const AuthService = require('../services/auth.service');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');
const User = require('../users/models/user.model');
const { Role } = require('../roles/models');

const authenticate = async (req, res, next) => {
  try {
    logger.info('🔐 Autenticando petición:', {
      method: req.method,
      url: req.originalUrl,
      hasAuthHeader: !!req.headers.authorization,
      authHeaderStart: req.headers.authorization?.substring(0, 20) + '...'
    });

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('❌ Token de autenticación faltante o mal formateado');
      throw createError(401, 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    logger.info('🎫 Token extraído (primeros 20 chars):', token.substring(0, 20) + '...');
    
    const decoded = await AuthService.verifyToken(token);
    logger.info('✅ Token decodificado exitosamente:', {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    logger.info('🔍 Buscando usuario en DB:', { userId: decoded.userId });
    
    const user = await User.findById(decoded.userId).populate('roles', 'name');
    logger.info('👤 Usuario encontrado:', {
      found: !!user,
      isActive: user?.isActive,
      roles: user?.roles?.map(r => r.name)
    });
    
    if (!user || !user.isActive) {
      logger.error('❌ Usuario no encontrado o inactivo');
      throw createError(401, 'User not found or inactive');
    }

    req.user = {
      userId: user._id,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      roles: user.roles,
      role: user.roles && user.roles.length > 0 ? { name: user.roles[0].name } : undefined
    };



    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

const authorize = (requiredRolesOrPermissions = []) => {
  return async (req, res, next) => {
    try {
      if (!requiredRolesOrPermissions || requiredRolesOrPermissions.length === 0) {
        return next();
      }

      // Verificar si son roles (nombres simples) o permisos (con formato action:resource)
      const isRoleCheck = requiredRolesOrPermissions.every(item => !item.includes(':'));
      
      let hasAccess = false;

      if (isRoleCheck) {
        // Verificación por roles
        hasAccess = req.user.roles.some(role => 
          requiredRolesOrPermissions.includes(role.name)
        );
        
        // Superadmin siempre tiene acceso
        if (req.user.roles.some(role => role.name === 'superadmin')) {
          hasAccess = true;
        }
      } else {
        // Verificación por permisos específicos
        hasAccess = await Role.checkUserAccess(
          req.user.userId,
          requiredRolesOrPermissions
        );
      }

      if (!hasAccess) {
        throw createError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize
};