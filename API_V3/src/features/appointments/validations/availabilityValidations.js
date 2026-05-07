const Joi = require('joi');

exports.updateAvailabilitySchema = Joi.object({
  type: Joi.string().valid('fixed', 'custom').default('fixed'),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).required(), // 0=Domingo, 6=Sábado
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // Formato HH:mm
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // Formato HH:mm
  slotDuration: Joi.number().integer().min(5).default(30),
  exceptions: Joi.array().items(
    Joi.object({
      date: Joi.date().required(),
      isAvailable: Joi.boolean().default(false),
      notes: Joi.string().allow('', null)
    })
  ).default([]),
  notes: Joi.string().allow('', null)
}); 