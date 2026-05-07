const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  fileUrl: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relatedTo: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }
  },
  type: { type: String },
  size: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Attachment', attachmentSchema); 