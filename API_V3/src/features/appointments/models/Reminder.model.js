const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['email', 'sms', 'push'], required: true },
  timeToSend: { type: Date, required: true }, // Hora exacta a la que se debe enviar
  sent: { type: Boolean, default: false },
  sentAt: { type: Date }
}, { timestamps: true });

// Índice para buscar eficientemente los recordatorios pendientes
reminderSchema.index({ sent: 1, timeToSend: 1 });

module.exports = mongoose.model('Reminder', reminderSchema); 