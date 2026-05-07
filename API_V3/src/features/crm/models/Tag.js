const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#cccccc' }
}, { timestamps: true });

module.exports = mongoose.model('Tag', tagSchema); 