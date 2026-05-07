const Joi = require('joi');

exports.createReminderSchema = Joi.object({
  appointmentId: Joi.string().required(),
  userId: Joi.string().required(),
  method: Joi.string().valid('email', 'sms', 'push').required(),
  timeBefore: Joi.number().integer().min(0).required(),
  sent: Joi.boolean(),
  sentAt: Joi.date().allow(null)
}); 