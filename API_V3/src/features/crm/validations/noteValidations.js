const Joi = require('joi');

const createNoteSchema = Joi.object({
  text: Joi.string().required(),
  relatedTo: Joi.object({
    customerId: Joi.string().optional(),
    opportunityId: Joi.string().optional(),
    activityId: Joi.string().optional()
  }).optional()
});

const updateNoteSchema = Joi.object({
  text: Joi.string().optional(),
  relatedTo: Joi.object({
    customerId: Joi.string().optional(),
    opportunityId: Joi.string().optional(),
    activityId: Joi.string().optional()
  }).optional()
});

module.exports = {
  createNoteSchema,
  updateNoteSchema
}; 