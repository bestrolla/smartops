const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Identificación
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-z0-9-]+$/, 'Slug solo puede contener letras minúsculas, números y guiones']
  },
  domain: {
    type: String,
    default: 'smartopsve.com',
    immutable: true
  },

  // Estado
  isActive: {
    type: Boolean,
    default: true
  },

  // Información pública
  publicProfile: {
    displayName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    logoUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/, 'URL no válida']
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email no válido']
    }
  },

  // Tipo de negocio para templates
  businessType: {
    type: String,
    enum: ['salon', 'restaurant', 'medical', 'store', 'portfolio', 'general'],
    default: 'general',
    trim: true,
    lowercase: true
  },

  // Tema visual (ELIMINADO: el theme se maneja en profile.theme)
  // theme: {
  //   primaryColor: { ... },
  //   secondaryColor: { ... },
  //   darkMode: { ... }
  // },

  // Configuración
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

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Middlewares
tenantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-generar slug si no existe
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones múltiples
      .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
  }
  
  next();
});

// Métodos estáticos
tenantSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

tenantSchema.statics.isSlugAvailable = async function(slug, excludeId = null) {
  const query = { slug: slug.toLowerCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await this.findOne(query);
  return !existing;
};

tenantSchema.statics.generateUniqueSlug = async function(baseSlug) {
  let slug = baseSlug.toLowerCase().trim();
  let counter = 1;
  let finalSlug = slug;
  
  while (!(await this.isSlugAvailable(finalSlug))) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return finalSlug;
};

// Índices
tenantSchema.index({ name: 1 }, { unique: true });
tenantSchema.index({ isActive: 1 });
tenantSchema.index({ 'publicProfile.displayName': 'text' });

module.exports = mongoose.model('Tenant', tenantSchema);