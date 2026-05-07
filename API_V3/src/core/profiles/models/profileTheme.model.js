const mongoose = require('mongoose');

const ProfileThemeSchema = new mongoose.Schema({
  // Identificación básica
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  profession: {
    type: String,
    required: true,
    trim: true
  },
  
  style: {
    type: String,
    required: true,
    trim: true
  },
  
  // Imagen y preview
  image: {
    type: String,
    required: true
  },
  
  preview_url: {
    type: String,
    required: true
  },
  
  // Configuración de colores
  colors: {
    primary: {
      type: String,
      required: true,
      default: '#4f46e5'
    },
    secondary: {
      type: String,
      required: true,
      default: '#7c3aed'
    },
    accent: {
      type: String,
      required: true,
      default: '#ffffff'
    }
  },
  
  // Configuración de layout
  layout: {
    header: {
      type: String,
      enum: ['dark', 'light', 'gradient-blue', 'gradient-art'],
      default: 'dark'
    },
    stats: {
      type: String,
      enum: ['minimal', 'corporate', 'medical', 'creative'],
      default: 'minimal'
    },
    services: {
      type: String,
      enum: ['minimal', 'corporate', 'medical', 'creative'],
      default: 'minimal'
    },
    testimonials: {
      type: String,
      enum: ['minimal', 'corporate', 'medical', 'creative'],
      default: 'minimal'
    }
  },
  
  // Configuración de secciones por defecto
  default_sections: {
    show_stats: {
      type: Boolean,
      default: true
    },
    show_testimonials: {
      type: Boolean,
      default: true
    },
    show_contact: {
      type: Boolean,
      default: true
    },
    show_social: {
      type: Boolean,
      default: true
    },
    show_services: {
      type: Boolean,
      default: false
    },
    show_products: {
      type: Boolean,
      default: false
    },
    show_appointments: {
      type: Boolean,
      default: false
    }
  },
  
  // Datos de ejemplo para el tema
  sample_data: {
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    specialty: {
      type: String
    },
    bio: {
      type: String,
      required: true
    },
    stats: [{
      label: {
        type: String,
        required: true
      },
      value: {
        type: String,
        required: true
      }
    }],
    contact: {
      email: String,
      phone: String,
      website: String
    },
           social_links: [{
         platform: {
           type: String,
           enum: ['linkedin', 'twitter', 'github', 'instagram', 'whatsapp', 'website', 'custom'],
           required: true
         },
      url: {
        type: String,
        required: true
      },
      display_name: String
    }]
  },
  
  // Metadatos
  category: {
    type: String,
    enum: ['designer', 'consultant', 'medical', 'creative', 'business', 'technology'],
    required: true
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Estadísticas de uso
  usage: {
    total_profiles: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    reviews: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Información del creador
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  version: {
    type: String,
    default: '1.0.0'
  }
  
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
ProfileThemeSchema.index({ id: 1 }, { unique: true });
ProfileThemeSchema.index({ category: 1, isActive: 1 });
ProfileThemeSchema.index({ tags: 1 });
ProfileThemeSchema.index({ 'usage.rating': -1 });
ProfileThemeSchema.index({ 'usage.total_profiles': -1 });

// Métodos del schema
ProfileThemeSchema.methods.incrementUsage = function() {
  this.usage.total_profiles += 1;
  return this.save();
};

ProfileThemeSchema.methods.addReview = function(review) {
  this.usage.reviews.push(review);
  
  // Recalcular rating promedio
  const totalRating = this.usage.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.usage.rating = totalRating / this.usage.reviews.length;
  
  return this.save();
};

// Métodos estáticos
ProfileThemeSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true, isPublic: true })
    .sort({ 'usage.rating': -1, 'usage.total_profiles': -1 });
};

ProfileThemeSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ 'usage.total_profiles': -1, 'usage.rating': -1 })
    .limit(limit);
};

ProfileThemeSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { isActive: true, isPublic: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { profession: { $regex: query, $options: 'i' } },
          { style: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).sort({ 'usage.rating': -1 });
};

module.exports = mongoose.model('ProfileTheme', ProfileThemeSchema);
