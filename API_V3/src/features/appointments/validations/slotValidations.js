const Joi = require('joi');

exports.createSlotSchema = Joi.object({
  professionalId: Joi.string().required(),
  start: Joi.date().required(),
  end: Joi.date().required(),
  type: Joi.string().valid('fixed', 'custom'),
  recurrence: Joi.string().valid('none', 'daily', 'weekly', 'monthly'),
  daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)),
  notes: Joi.string().allow('', null)
}); 