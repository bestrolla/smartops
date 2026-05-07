const { createError } = require('http-errors');

const isAdmin = (req, res, next) => {
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('superadmin')) {
    throw createError(403, 'Admin access required');
  }
  next();
};

const isSelfOrAdmin = (req, res, next) => {
  if (req.params.id !== req.user.userId && 
      !req.user.roles.includes('admin') && 
      !req.user.roles.includes('superadmin')) {
    throw createError(403, 'Unauthorized access');
  }
  next();
};

module.exports = {
  isAdmin,
  isSelfOrAdmin,
};