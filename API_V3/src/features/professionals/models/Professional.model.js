const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const professionalSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  name:{
    type: mongoose.Schema.Types.String,
    required: true,
    index: true
  },
  surname:{
    type: mongoose.Schema.Types.String,
    required: true,
    index: true
  },

  professionalType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProfessionalType',
    required: true,
    index: true
  },
  specialties: {
    type: [String],
    default: []
  },
  licenseNumber: {
    type: String,
    // La validación condicional se omite aquí, se puede manejar a nivel de lógica de negocio si es necesario
  },
  experienceYears: {
    type: Number,
    min: 0,
    max: 100
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  googleCalendar: {
    tokens: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
      token_type: String,
      scope: String,
    },
    isLinked: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.tenantId;
      return ret;
    }
  }

});

// Plugin para paginación
professionalSchema.plugin(mongoosePaginate);

// Índices compuestos para mejorar consultas multi-tenant
professionalSchema.index({ tenantId: 1, professionalType: 1 });
professionalSchema.index({ tenantId: 1, isActive: 1 });

// Virtual para obtener el usuario asociado
professionalSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Professional', professionalSchema);