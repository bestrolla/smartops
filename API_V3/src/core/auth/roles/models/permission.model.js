// auth/roles/models/permission.model.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'users', 'products', 'orders', 'inventory', 'tenants', 
      'roles', 'settings', 'reports', 'customers', 
      'variants', 'discounts', 'promotions', 'appointments',
      'services', 'professionals', 'crm'
    ]
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage', 'view', 'cancel']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { 
  timestamps: true,
  versionKey: false 
});

// Índices
permissionSchema.index({ code: 1 }, { unique: true });
permissionSchema.index({ resource: 1, action: 1 });

// Middleware para generar código si no existe
permissionSchema.pre('save', function(next) {
  if (!this.code && this.resource && this.action) {
    this.code = `${this.action}:${this.resource}`;
  }
  next();
});

module.exports = mongoose.model('Permission', permissionSchema);