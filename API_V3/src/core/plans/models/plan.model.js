const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  },
  features: {
    appointments: { type: Boolean, default: false },
    crm: { type: Boolean, default: false },
    ecommerce: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    orders: { type: Boolean, default: false },
    products: { type: Boolean, default: false },
    professionals: { type: Boolean, default: false },
    services: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false },
    automation: { type: Boolean, default: false }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

PlanSchema.index({ name: 1 });
PlanSchema.index({ isActive: 1 });

PlanSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

module.exports = mongoose.model('Plan', PlanSchema);