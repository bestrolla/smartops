const Joi = require('joi');
const createError = require('../../../shared/errors.utils');

const createSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(3)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': 'El nombre solo puede contener letras minúsculas, números y guiones',
      'any.required': 'El nombre del tenant es requerido'
    }),
  displayName: Joi.string()
    .required()
    .min(3)
    .max(100),
  publicProfile: Joi.object({
    description: Joi.string()
      .max(500)
      .allow(''),
    logoUrl: Joi.string()
      .uri()
      .allow(''),
    contactEmail: Joi.string()
      .email()
      .allow('')
  }).default({}),
  theme: Joi.object({
    primaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .default('#4f46e5'),
    secondaryColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .default('#f43f5e'),
    darkMode: Joi.boolean()
      .default(false)
  }).default({}),
  features: Joi.object({
    manageProducts: Joi.boolean().default(false),
    manageServices: Joi.boolean().default(false),
    payments: Joi.boolean().default(false),
    auth: Joi.boolean().default(true)
  }).default({})
}).required();

const updateSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-z0-9-]+$/),
  displayName: Joi.string()
    .min(3)
    .max(100),
  isActive: Joi.boolean(),
  publicProfile: Joi.object({
    description: Joi.string().max(500),
    logoUrl: Joi.string().uri(),
    contactEmail: Joi.string().email()
  }),
  theme: Joi.object({
    primaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    secondaryColor: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    darkMode: Joi.boolean()
  }),
  features: Joi.object({
    manageProducts: Joi.boolean(),
    manageServices: Joi.boolean(),
    payments: Joi.boolean(),
    auth: Joi.boolean(),
    customDomain: Joi.boolean()
  })
}).min(1);

const themeSchema = Joi.object({
  primaryColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .required(),
  secondaryColor: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .required(),
  darkMode: Joi.boolean()
}).required();

const validateCreateTenant = (req, res, next) => {
  const { error } = createSchema.validate(req.body);
  if (error) throw createError(error.details[0].message, 400);
  next();
};

const validateUpdateTenant = (req, res, next) => {
  const { error } = updateSchema.validate(req.body);
  if (error) throw createError(error.details[0].message, 400);
  next();
};

const validateUpdateTheme = (req, res, next) => {
  const { error } = themeSchema.validate(req.body);
  if (error) throw createError(error.details[0].message, 400);
  next();
};

module.exports = {
  validateCreateTenant,
  validateUpdateTenant,
  validateUpdateTheme
};