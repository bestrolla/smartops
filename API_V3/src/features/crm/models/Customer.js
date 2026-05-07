const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  company: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['lead', 'prospect', 'customer', 'inactive'],
    default: 'lead'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema); 