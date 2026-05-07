const Joi = require('joi');

const createOpportunitySchema = Joi.object({
  customerId: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  stage: Joi.string().valid('new', 'qualified', 'proposition', 'won', 'lost').optional(),
  value: Joi.number().required(),
  currency: Joi.string().optional(),
  probability: Joi.number().min(0).max(100).optional(),
  expectedCloseDate: Joi.date().optional(),
  assignedTo: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid('open', 'closed', 'cancelled').optional()
});

const updateOpportunitySchema = Joi.object({
  customerId: Joi.string().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  stage: Joi.string().valid('new', 'qualified', 'proposition', 'won', 'lost').optional(),
  value: Joi.number().optional(),
  currency: Joi.string().optional(),
  probability: Joi.number().min(0).max(100).optional(),
  expectedCloseDate: Joi.date().optional(),
  assignedTo: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid('open', 'closed', 'cancelled').optional()
});

module.exports = {
  createOpportunitySchema,
  updateOpportunitySchema
}; 