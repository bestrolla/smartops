const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        throw createError(401, 'Usuario no autenticado');
      }

      logger.debug('Verificando permisos', {
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        userRoles: req.user.roles
      });

      // Verificar si es superadmin o tiene todos los permisos
      if (req.user.roles?.some(role => role.name === 'admin' || role.name === 'superadmin') || 
          req.user.permissions?.includes('all')) {
        return next();
      }

      // Verificar permiso específico
      if (req.user.permissions?.includes(permission)) {
        return next();
      }

      throw createError(403, 'No tienes permisos suficientes');
    } catch (error) {
      next(error);
    }
  };
};

const checkInventoryOwnership = () => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        throw createError(401, 'Usuario no autenticado');
      }

      // Superadmin bypass
      if (req.user.roles?.some(role => role.name === 'admin' || role.name === 'superadmin') || 
          req.user.permissions?.includes('all')) {
        return next();
      }

      // Obtener el item de inventario
      const Inventory = require('../models/Inventory');
      const inventoryItem = await Inventory.findById(req.params.id);

      if (!inventoryItem) {
        throw createError(404, 'Item de inventario no encontrado');
      }

      // Verificar que pertenece al tenant correcto
      if (inventoryItem.tenant_id !== req.user.tenantId) {
        throw createError(403, 'No tienes acceso a este inventario');
      }

      // Verificar roles específicos
      const allowedRoles = ['warehouse_manager', 'inventory_manager'];
      if (req.user.roles?.some(role => allowedRoles.includes(role.name))) {
        return next();
      }

      throw createError(403, 'No tienes permisos sobre este item');
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  checkPermission,
  checkInventoryOwnership,
  
  // Aliases para permisos comunes
  canView: checkPermission('inventory:view'),
  canAdjust: checkPermission('inventory:adjust'),
  canManage: checkPermission('inventory:manage'),
  canUpdate: checkPermission('inventory:update')
};