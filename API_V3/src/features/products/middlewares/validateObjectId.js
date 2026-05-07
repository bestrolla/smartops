const { Types } = require('mongoose');
const AppError = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

module.exports = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      logger.debug('Validando ObjectId', { id, paramName });
      
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError(`El ID proporcionado (${id}) no es un ObjectId válido`, 400);
      }

      // Si es válido, adjuntamos el ID convertido a ObjectId
      req.validatedIds = req.validatedIds || {};
      req.validatedIds[paramName] = new Types.ObjectId(id);
      
      next();
    } catch (error) {
      logger.error('Error en validación de ObjectId:', error);
      next(error);
    }
  };
};