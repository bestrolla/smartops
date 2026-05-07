const Joi = require('joi');
const { validate } = require('../../../shared/validation.utils');

const createSchema = Joi.object({
  planId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'El ID del plan debe ser un ObjectId válido.',
    'any.required': 'El ID del plan es obligatorio.'
  })
});

const updateSchema = Joi.object({
  planId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'El ID del plan debe ser un ObjectId válido.'
  }),
  status: Joi.string().valid('pending', 'active', 'expired', 'cancelled').optional(),
  payment_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'El ID del pago debe ser un ObjectId válido.'
  })
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});

module.exports = {
  create: validate(createSchema),
  update: validate(updateSchema)
}; 