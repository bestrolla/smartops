const Joi = require('joi');
const createError = require('../../../../shared/errors.utils');
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const createSchema = Joi.object({
  username: Joi.string().required().min(3).max(30)
    .messages({
      'string.empty': 'Username is required',
      'string.min': 'Username must be at least {#limit} characters',
      'string.max': 'Username cannot exceed {#limit} characters'
    }),
  email: Joi.string().required().email()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be a valid email address'
    }),
  password: Joi.string().required().pattern(passwordRegex)
    .messages({
      'string.empty': 'Password is required',
      'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    }),
  tenantId: Joi.string().required()
    .messages({
      'string.empty': 'Tenant ID is required'
    }),
  roles: Joi.array().items(Joi.string().valid('user', 'admin', 'superadmin'))
    .default(['user'])
    .messages({
      'array.includes': 'Invalid role provided'
    }),
}).required();

const updateSchema = Joi.object({
  username: Joi.string().min(3).max(30),
  email: Joi.string().email(),
  password: Joi.string().pattern(passwordRegex),
  roles: Joi.array().items(Joi.string().valid('user', 'admin', 'superadmin')),
  isActive: Joi.boolean(),
}).min(1);

const validateCreate = (req, res, next) => {
  const { error } = createSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw createError(400, messages.join('; '));
  }
  next();
};

const validateUpdate = (req, res, next) => {
  const { error } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    throw createError(400, messages.join('; '));
  }
  next();
};

module.exports = {
  validateCreate,
  validateUpdate,
};