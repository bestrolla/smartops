const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  color: { type: String, default: '#cccccc' }
}, { _id: false });

const pipelineSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  stages: [stageSchema],
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Pipeline', pipelineSchema); 