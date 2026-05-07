const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  name: { type: String, required: true },
  description: { type: String },
  stage: { type: String, enum: ['new', 'qualified', 'proposition', 'won', 'lost'], default: 'new' },
  value: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  probability: { type: Number, min: 0, max: 100, default: 0 },
  expectedCloseDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Opportunity', opportunitySchema); 