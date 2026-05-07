const Joi = require('joi');

const createCustomerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  company: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid('lead', 'prospect', 'customer', 'inactive').optional()
});

const updateCustomerSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  company: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid('lead', 'prospect', 'customer', 'inactive').optional()
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema
}; 