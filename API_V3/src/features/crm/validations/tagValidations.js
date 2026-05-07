const Joi = require('joi');

const createTagSchema = Joi.object({
  name: Joi.string().required(),
  color: Joi.string().optional()
});

const updateTagSchema = Joi.object({
  name: Joi.string().optional(),
  color: Joi.string().optional()
});

const tagAssignSchema = Joi.object({
  tagId: Joi.string().required()
});

module.exports = {
  createTagSchema,
  updateTagSchema,
  tagAssignSchema
}; 