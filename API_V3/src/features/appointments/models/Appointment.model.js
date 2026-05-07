const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // cliente/paciente
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'], default: 'pending' },
  type: { type: String, enum: ['in_person', 'virtual'], default: 'in_person' },
  location: { type: String },
  notes: { type: String },
  reminders: [{
    method: { type: String, enum: ['email', 'sms', 'push'] },
    timeBefore: { type: Number }, // minutos antes
    sent: { type: Boolean, default: false }
  }],
  calendarEventId: { type: String }, // para integración con Google/Outlook
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppointmentSlot' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false } // Servicio asociado (opcional)
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema); 