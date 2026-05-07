const { createError } = require('http-errors');

const adminPolicy = (req, res, next) => {
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('superadmin')) {
    throw createError(403, 'Admin access required');
  }
  next();
};

module.exports = adminPolicy;