const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  text: { type: String, required: true },
  relatedTo: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema); 