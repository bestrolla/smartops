const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  type: { type: String, enum: ['call', 'meeting', 'task', 'email', 'other'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  relatedTo: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' }
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema); 