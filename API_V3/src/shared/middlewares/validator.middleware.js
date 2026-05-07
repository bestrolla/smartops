const Joi = require('joi');

/**
 * Middleware para validar el cuerpo de una solicitud contra un schema de Joi.
 * @param {Joi.Schema} schema - El schema de Joi a usar para la validación.
 * @returns
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false, // Devuelve todos los errores, no solo el primero
    stripUnknown: true, // Elimina campos no definidos en el schema
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      message: detail.message.replace(/['"]/g, ''),
      field: detail.context.key,
    }));
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validate; 