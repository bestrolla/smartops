const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, index: true },
  type: { type: String, enum: ['fixed', 'custom'], default: 'fixed' },
  daysOfWeek: [{ type: Number }], // 0=Domingo, 1=Lunes...
  startTime: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, required: true }, // '08:00'
  endTime: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, required: true },   // '17:00'
  slotDuration: { type: Number, default: 30 }, // Duración en minutos
  exceptions: [{
    date: { type: Date },
    isAvailable: { type: Boolean, default: false },
    notes: { type: String }
  }],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema); 