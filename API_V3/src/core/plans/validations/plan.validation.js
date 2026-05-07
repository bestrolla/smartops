const Joi = require('joi');

const createPlanSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'El nombre del plan no puede estar vacío.',
    'any.required': 'El nombre del plan es obligatorio.'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'El precio debe ser un número.',
    'number.min': 'El precio no puede ser negativo.',
    'any.required': 'El precio es obligatorio.'
  }),
  currency: Joi.string().trim().default('USD'),
  features: Joi.array().items(Joi.string().trim()).messages({
    'array.base': 'Las características deben ser un array de strings.'
  }),
  description: Joi.string().trim().allow('').default(''),
  isActive: Joi.boolean().default(true)
});

const updatePlanSchema = Joi.object({
  name: Joi.string().trim(),
  price: Joi.number().min(0),
  currency: Joi.string().trim(),
  features: Joi.array().items(Joi.string().trim()),
  description: Joi.string().trim().allow(''),
  isActive: Joi.boolean()
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar.'
});

module.exports = {
  createPlanSchema,
  updatePlanSchema
}; 