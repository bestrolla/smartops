const createError = require('../../../shared/errors.utils');
const User = require('../../auth/users/models/user.model'); // Ajusta la ruta según tu estructura

const checkRole = async (userId, roleName) => {
  // Implementación según tu estructura de datos
  // Esto es un ejemplo - ajusta según tu schema real
  const user = await User.findById(userId).populate('roles');
  return user.roles.some(role => role.name === roleName);
};

const isSuperAdmin = async (req, res, next) => {
  try {
    const hasRole = await checkRole(req.user.userId, 'superadmin');
    if (!hasRole) {
      throw createError(403, 'SuperAdmin privileges required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const isAdmin = await checkRole(req.user.userId, 'admin');
    const isSuperAdmin = await checkRole(req.user.userId, 'superadmin');
    
    if (!isAdmin && !isSuperAdmin) {
      throw createError(403, 'Admin privileges required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

const canAccessTenant = async (req, res, next) => {
  try {
    const isSuperAdmin = await checkRole(req.user.userId, 'superadmin');
    if (isSuperAdmin) return next();
    
    if (req.params.id !== req.user.tenantId) {
      throw createError(403, 'Access to other tenants is restricted');
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isSuperAdmin,
  isAdmin,
  canAccessTenant
};