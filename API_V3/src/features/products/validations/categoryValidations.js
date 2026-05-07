const Joi = require('joi');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

const baseCategorySchema = {
  name: Joi.string().max(50),
  description: Joi.string().max(500),
  parentId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null),
  isActive: Joi.boolean()
};

const createCategorySchema = Joi.object({
  ...baseCategorySchema,
  name: baseCategorySchema.name.required()
});

const updateCategorySchema = Joi.object(baseCategorySchema);

// Middleware para creación
const validateCreateCategory = (req, res, next) => {
  try {
    const { error } = createCategorySchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) return handleValidationError(error, next);
    next();
  } catch (error) {
    logger.error('Error en validación de creación de categoría:', error);
    next(error);
  }
};

// Middleware para actualización
const validateUpdateCategory = (req, res, next) => {
  try {
    logger.debug('Validando datos de actualización de categoría:', req.body);
    const { error } = updateCategorySchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) return handleValidationError(error, next);
    next();
  } catch (error) {
    logger.error('Error en validación de actualización de categoría:', error);
    next(error);
  }
};

function handleValidationError(error, next) {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message.replace(/['"]+/g, '')
  }));
  
  return next(createError(400, 'Validación fallida', { errors }));
}

module.exports = {
  validateCreateCategory,
  validateUpdateCategory
};