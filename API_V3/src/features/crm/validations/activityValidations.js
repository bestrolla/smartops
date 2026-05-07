const Joi = require('joi');

const createActivitySchema = Joi.object({
  type: Joi.string().valid('call', 'meeting', 'task', 'email', 'other').required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'completed', 'cancelled').optional(),
  relatedTo: Joi.object({
    customerId: Joi.string().optional(),
    opportunityId: Joi.string().optional()
  }).optional(),
  assignedTo: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  completedAt: Joi.date().optional()
});

const updateActivitySchema = Joi.object({
  type: Joi.string().valid('call', 'meeting', 'task', 'email', 'other').optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  dueDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'completed', 'cancelled').optional(),
  relatedTo: Joi.object({
    customerId: Joi.string().optional(),
    opportunityId: Joi.string().optional()
  }).optional(),
  assignedTo: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  completedAt: Joi.date().optional()
});

module.exports = {
  createActivitySchema,
  updateActivitySchema
}; 