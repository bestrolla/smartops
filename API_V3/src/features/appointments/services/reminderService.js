const Reminder = require('../models/Reminder.model');
const moment = require('moment');

/**
 * Crea los registros de recordatorio para una nueva cita.
 * Lee la configuración de recordatorios del propio appointment.
 * @param {Appointment} appointment - El objeto de la cita recién creada.
 */
exports.createRemindersForAppointment = async (appointment) => {
  if (!appointment.reminders || appointment.reminders.length === 0) {
    return;
  }

  const remindersToCreate = appointment.reminders.map(reminderConfig => {
    const reminderTime = moment(appointment.start).subtract(reminderConfig.timeBefore, 'minutes');
    return {
      appointmentId: appointment._id,
      userId: appointment.userId,
      method: reminderConfig.method,
      timeToSend: reminderTime.toDate(), // Guardamos la hora exacta de envío
      sent: false,
    };
  });

  if (remindersToCreate.length > 0) {
    await Reminder.insertMany(remindersToCreate);
  }
};

/**
 * Encuentra todos los recordatorios pendientes de envío.
 * Un recordatorio está pendiente si su `timeToSend` es en el pasado y `sent` es false.
 * @returns {Promise<Reminder[]>}
 */
exports.findPendingReminders = async () => {
  return Reminder.find({
    timeToSend: { $lte: new Date() },
    sent: false
  }).populate('appointmentId'); // Populate para tener datos de la cita
};

/**
 * "Envía" un recordatorio y lo marca como enviado.
 * @param {Reminder} reminder - El recordatorio a enviar.
 */
exports.sendReminder = async (reminder) => {
  if (!reminder || !reminder.appointmentId) {
    // La cita pudo haber sido cancelada
    return;
  }
  
  // Lógica de envío real iría aquí (usando SendGrid para email, Twilio para SMS, etc.)
  console.log(`[INFO] Enviando recordatorio via ${reminder.method} para la cita de las ${moment(reminder.appointmentId.start).format('HH:mm')} al usuario ${reminder.userId}.`);

  // Marcar como enviado en la base de datos
  reminder.sent = true;
  reminder.sentAt = new Date();
  await reminder.save();
};

// Se mantienen los placeholders para posible gestión manual futura
exports.createReminder = async (data) => {
  // Implementación manual si fuese necesaria
};

exports.listReminders = async (filter) => {
  return Reminder.find(filter);
}; 