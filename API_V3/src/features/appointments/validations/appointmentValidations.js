const Joi = require('joi');

exports.createAppointmentSchema = Joi.object({
  slotId: Joi.string().hex().length(24).required(),
  notes: Joi.string().allow('', null),
  reminders: Joi.array().items(
    Joi.object({
      method: Joi.string().valid('email', 'sms', 'push').required(),
      timeBefore: Joi.number().integer().min(1).required().description('Minutos antes de la cita'),
    })
  ).default([]),
  serviceId: Joi.string().hex().length(24).optional().allow(null).description('ID del servicio asociado (opcional)'),
}); 