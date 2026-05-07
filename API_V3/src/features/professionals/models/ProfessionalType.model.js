const mongoose = require('mongoose');

const professionalTypeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  requiresLicense: {
    type: Boolean,
    default: false
  },
  customFields: [{
    fieldName: String,
    fieldType: {
      type: String,
      enum: ['String', 'Number', 'Boolean', 'Date', 'Array']
    },
    isRequired: Boolean
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ProfessionalType', professionalTypeSchema);