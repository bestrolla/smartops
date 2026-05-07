// features/orders/policies/orderPolicy.js
const { createError } = require('../../../shared/errors.utils');

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        throw createError('Usuario no autenticado o sin roles asignados', 403);
      }

      // Verificación simplificada para superadmin
      if (req.user.roles.some(role => role === 'superadmin' || (role.name && role.name === 'superadmin'))) {
        return next();
      }

      // TEMPORARY BYPASS FOR order:view FOR DEVELOPMENT TESTING ONLY
      if (process.env.NODE_ENV !== 'production' && requiredPermission === 'order:view') {
          return next();
      }
      // END TEMPORARY BYPASS

      // Verificación de permisos específicos
      const hasPermission = req.user.roles.some(role => {
        // Si el rol es un string (nombre del rol)
        if (typeof role === 'string') {
          return role === 'admin' || role === 'superadmin';
        }
        
        // Si el rol es un objeto con permisos
        if (role.permissions) {
          return role.permissions.includes(requiredPermission) || 
                 role.permissions.includes('*');
        }

        return false;
      });

      if (!hasPermission) {
        throw createError(`Acceso denegado. Se requiere permiso: ${requiredPermission}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Función para verificar ownership (cuando aplica)
const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        throw createError('Usuario no autenticado o sin roles asignados', 403);
      }

      // 1. Superadmin puede hacer cualquier cosa
      const isSuperadmin = req.user.roles.some(role => 
        role === 'superadmin' || 
        (role.name && role.name === 'superadmin')
      );
      
      if (isSuperadmin) return next();

      // 2. Obtener el recurso (orden en este caso)
      const resource = await getResourceFromDB(resourceType, req.params.id);
      
      // 3. Verificar si el usuario es el dueño
      if (resource.userId.equals(req.user._id)) {
        return next();
      }

      throw createError('Solo puedes acceder a tus propios recursos', 403);
    } catch (error) {
      next(error);
    }
  };
};

// Helper para obtener recursos de la DB
async function getResourceFromDB(resourceType, id) {
  let model;
  switch (resourceType) {
    case 'order':
      model = require('../models/Order');
      break;
    // Puedes añadir más casos según necesites
    default:
      throw createError('Tipo de recurso no válido', 400);
  }
  return await model.findById(id);
}

module.exports = {
  checkPermission,
  checkOwnership
};