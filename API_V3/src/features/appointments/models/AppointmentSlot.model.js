const mongoose = require('mongoose');

const appointmentSlotSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  isAvailable: { type: Boolean, default: true },
  type: { type: String, enum: ['fixed', 'custom'], default: 'fixed' },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  daysOfWeek: [{ type: Number }], // 0=Domingo, 1=Lunes...
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AppointmentSlot', appointmentSlotSchema); 