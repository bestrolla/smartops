const { createError } = require('./errors.utils');

/**
 * Middleware para validar el cuerpo de la petición contra un esquema Joi
 * @param {Joi.Schema} schema - Esquema de validación Joi
 * @returns {Function} Middleware de validación
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(createError(400, 'Error de validación', { errors }));
    }

    next();
  };
};

module.exports = {
  validate
}; 