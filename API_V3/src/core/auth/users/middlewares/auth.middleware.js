const AuthService = require('../services/auth.service');
const { createError } = require('http-errors');
const logger = require('../logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await AuthService.validateToken(token);

    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

module.exports = authMiddleware;