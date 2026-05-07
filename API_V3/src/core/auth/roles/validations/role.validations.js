const Joi = require('joi');
const { createError } = require('http-errors');

const createSchema = Joi.object({
  name: Joi.string().required().min(3).max(30)
    .messages({
      'string.empty': 'Role name is required',
      'string.min': 'Role name must be at least {#limit} characters',
      'string.max': 'Role name cannot exceed {#limit} characters'
    }),
  permissions: Joi.array().items(Joi.string()).required()
    .messages({
      'array.base': 'Permissions must be an array',
      'array.empty': 'At least one permission is required'
    }),
  isDefault: Joi.boolean().default(false),
}).required();

const updateSchema = Joi.object({
  name: Joi.string().min(3).max(30),
  permissions: Joi.array().items(Joi.string()),
  isDefault: Joi.boolean(),
}).min(1);

const roleAssignmentSchema = Joi.object({
  roleIds: Joi.array().items(
    Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
      .message('Each role ID must be a valid MongoDB ObjectId')
  ).min(1)
   .required()
   .messages({
     'array.base': 'roleIds must be an array',
     'array.min': 'At least one role ID is required',
     'any.required': 'roleIds is required'
   })
});

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

const validateAssignRoles = (req, res, next) => {
  const { error } = roleAssignmentSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ 
      error: 'Validation error',
      details: messages 
    });
  }
  
  next();
};

module.exports = {
  validateCreate,
  validateUpdate,
  validateAssignRoles
};