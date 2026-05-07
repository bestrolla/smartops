const Joi = require('joi');
const { professionalTypes } = require('../../../shared/constants');

const baseProfessionalSchema = {
  userId: Joi.string().hex().length(24).required(),
  professionalType: Joi.string().hex().length(24).required().messages({
    'string.hex': 'El tipo de profesional debe ser un ObjectId válido',
    'string.length': 'El tipo de profesional debe tener 24 caracteres',
    'any.required': 'El tipo de profesional es obligatorio'
  }),
  specialties: Joi.array().items(Joi.string()).default([]),
  experienceYears: Joi.number().integer().min(0).max(100),
  licenseNumber: Joi.string().optional(), // Simplificar por ahora ya que no sabemos qué tipos requieren licencia
  customFields: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.date(),
      Joi.array()
    )
  ).default({})
};

const createProfessionalSchema = Joi.object({
  ...baseProfessionalSchema
});

const updateProfessionalSchema = Joi.object({
  professionalType: Joi.string().hex().length(24).messages({
    'string.hex': 'El tipo de profesional debe ser un ObjectId válido',
    'string.length': 'El tipo de profesional debe tener 24 caracteres'
  }),
  specialties: Joi.array().items(Joi.string()),
  experienceYears: Joi.number().integer().min(0).max(100),
  licenseNumber: Joi.string(),
  customFields: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.date(),
      Joi.array()
    )
  ),
  isActive: Joi.boolean()
}).min(1); // Al menos un campo debe ser proporcionado para actualizar

const listProfessionalsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  professionalType: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'El tipo de profesional debe ser un ObjectId válido',
    'string.length': 'El tipo de profesional debe tener 24 caracteres'
  }),
  isActive: Joi.boolean().default(true)
});

module.exports = {
  createProfessionalSchema,
  updateProfessionalSchema,
  listProfessionalsSchema
};