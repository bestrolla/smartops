// features/products/policies/productPolicy.js
const AppError = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

class ProductPolicy {
  constructor(user) {
    this.user = user;
  }

  // Método mejorado para verificar permisos
  hasPermission(requiredPermission) {
    logger.debug('Verificando permisos para usuario', {
      user: this.user,
      requiredPermission
    });
    
    // 1. Verificar si el usuario es superadmin o admin
    const isAdmin = this.user.roles.includes('superadmin') || 
                   this.user.roles.includes('admin') ||
                   this.user.roles.some(role => 
                     (typeof role === 'object' && role.name === 'superadmin') || 
                     (typeof role === 'object' && role.name === 'admin')
                   );
    logger.debug('¿Es admin?', { isAdmin });

    // 2. Verificar si el tenant tiene el feature habilitado
    if (this.user.tenant && !this.user.tenant.features?.manageProducts) {
      logger.warn('Tenant no tiene permisos para gestionar productos', {
        tenantId: this.user.tenant.tenantId,
        features: this.user.tenant.features
      });
      return false;
    }

    if (isAdmin) {
      return true;
    }

    // 3. Si los roles son objetos, verificar permisos
    const rolesWithPermissions = this.user.roles.filter(role => typeof role === 'object' && role.permissions);
    logger.debug('Roles con permisos:', { rolesWithPermissions });
    
    if (rolesWithPermissions.length > 0) {
      // Verificar permiso "all"
      const hasAllPermission = rolesWithPermissions.some(role => 
        role.permissions.includes('all') || role.permissions.includes('*')
      );
      logger.debug('¿Tiene permiso all?', { hasAllPermission });
      if (hasAllPermission) {
        return true;
      }

      // Verificar permiso específico
      const userPermissions = rolesWithPermissions.flatMap(role => role.permissions);
      logger.debug('Permisos del usuario:', { userPermissions });
      const hasSpecificPermission = userPermissions.includes(requiredPermission);
      logger.debug('¿Tiene permiso específico?', { hasSpecificPermission });
      return hasSpecificPermission;
    }

    return false;
  }

  // Middleware estático mejorado
  static checkPermission(requiredPermission) {
    return async (req, res, next) => {
      try {
        logger.debug('Middleware de permisos - Request:', {
          method: req.method,
          path: req.path,
          user: req.user,
          tenant: req.tenant,
          headers: req.headers
        });

        if (!req.user) {
          throw new AppError('Acceso no autorizado: usuario no autenticado', 401);
        }

        // Adjuntar el tenant al usuario para la verificación de permisos
        req.user.tenant = req.tenant;

        const policy = new ProductPolicy(req.user);
        
        if (!policy.hasPermission(requiredPermission)) {
          throw new AppError(
            `Acceso denegado: no tienes permiso para ${requiredPermission}`, 
            403
          );
        }

        next();
      } catch (error) {
        logger.error('Error en middleware de permisos:', {
          error: error.message,
          stack: error.stack
        });
        next(error);
      }
    };
  }
}

module.exports = ProductPolicy;