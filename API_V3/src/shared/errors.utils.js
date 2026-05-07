const logger = require('./logger');

/**
 * Crea un error personalizado con código de estado y detalles
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} message - Mensaje de error
 * @param {object} details - Detalles adicionales del error
 * @returns {Error} Error personalizado
 */
const createError = (statusCode, message, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  
  logger.error(`[Error] ${message}`, {
    statusCode,
    details,
    stack: error.stack
  });
  
  return error;
};

module.exports = {
  createError
};