const Joi = require('joi');
// Corregir la ruta de importación de constants
// const { professionalTypes } = require('../../../shared/constants');

const baseServiceSchema = {
  name: Joi.string().trim().required().max(100),
  description: Joi.string().trim().max(500).optional(),
  categoryId: Joi.string().hex().length(24).optional(),
  duration: Joi.number().integer().min(5).max(1440).required()
    .description('Duration in minutes'),
  price: Joi.number().min(0).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  professionals: Joi.array().items(Joi.string().hex().length(24)).optional(),
  requirements: Joi.array().items(Joi.string().trim().max(100)).optional(),
  isActive: Joi.boolean().default(true),
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

const createServiceSchema = Joi.object({
  ...baseServiceSchema,
  isPackage: Joi.boolean().default(false)
});

const updateServiceSchema = Joi.object({
  ...baseServiceSchema,
  isPackage: Joi.boolean().forbidden() // No se puede cambiar este campo
}).min(1);

const createPackageSchema = Joi.object({
  ...baseServiceSchema,
  isPackage: Joi.boolean().valid(true).default(true),
  packageServices: Joi.array().items(
    Joi.object({
      serviceId: Joi.string().hex().length(24).required(),
      order: Joi.number().integer().min(0).default(0)
    })
  ).min(1).required()
});

const updatePackageSchema = Joi.object({
  ...baseServiceSchema,
  isPackage: Joi.boolean().valid(true).default(true),
  packageServices: Joi.array().items(
    Joi.object({
      serviceId: Joi.string().hex().length(24).required(),
      order: Joi.number().integer().min(0).default(0)
    })
  ).min(1)
}).min(1);

const listServicesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  categoryId: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().default(true),
  isPackage: Joi.boolean().default(false)
});

const serviceProfessionalSchema = Joi.object({
  professionalId: Joi.string().hex().length(24).required()
});

// Validaciones para categorías de servicios
const createServiceCategorySchema = Joi.object({
  name: Joi.string().trim().required().max(100),
  description: Joi.string().trim().max(500).optional(),
  parentCategory: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().default(true),
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
});

const updateServiceCategorySchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  description: Joi.string().trim().max(500).optional(),
  parentCategory: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().optional(),
  customFields: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.date(),
      Joi.array()
    )
  ).optional()
}).min(1);

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  createPackageSchema,
  updatePackageSchema,
  listServicesSchema,
  serviceProfessionalSchema,
  createServiceCategorySchema,
  updateServiceCategorySchema
};