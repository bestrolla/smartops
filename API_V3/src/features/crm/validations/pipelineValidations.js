const Joi = require('joi');

const stageSchema = Joi.object({
  name: Joi.string().required(),
  order: Joi.number().required(),
  color: Joi.string().optional()
});

const createPipelineSchema = Joi.object({
  name: Joi.string().required(),
  stages: Joi.array().items(stageSchema).min(1).required(),
  isDefault: Joi.boolean().optional()
});

const updatePipelineSchema = Joi.object({
  name: Joi.string().optional(),
  stages: Joi.array().items(stageSchema).optional(),
  isDefault: Joi.boolean().optional()
});

module.exports = {
  createPipelineSchema,
  updatePipelineSchema
}; 