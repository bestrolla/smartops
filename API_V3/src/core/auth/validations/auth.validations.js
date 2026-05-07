const Joi = require('joi');
const { createError } = require('../../../shared/errors.utils');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.!@#$%^&*]).{8,}$/;

const signUpSchema = Joi.object({
  organizationName: Joi.string().required().min(3).max(50)
    .messages({
      'string.empty': 'Organization name is required',
      'string.min': 'Organization name must be at least 3 characters'
    }),
  domain: Joi.string().optional().min(3).max(30).pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': 'Domain can only contain lowercase letters, numbers and hyphens',
      'string.min': 'Domain must be at least 3 characters',
      'string.max': 'Domain must be at most 30 characters'
    }),
  username: Joi.string().required().min(3).max(30),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8)
    .pattern(passwordRegex)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter and one number'
    }),
  firstName: Joi.string().required().min(2).max(50)
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters'
    }),
  lastName: Joi.string().required().min(2).max(50)
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters'
    }),
  features: Joi.object().optional(),
  profile: Joi.object().optional(),
  trial: Joi.boolean()
    .optional()
    .when('planId', {
      is: Joi.exist(),
      then: Joi.forbidden(),
      otherwise: Joi.boolean().default(true)
    }),
  planId: Joi.string().optional()
}).xor('trial', 'planId'); // exactamente uno de los dos

const loginSchema = Joi.object({
  username: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().required(),
}).or('username', 'email').required();

const validateRegister = (req, res, next) => {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw createError(400, messages.join('; '));
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) throw createError(400, error.details[0].message);
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};