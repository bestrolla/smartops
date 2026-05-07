const mongoose = require('mongoose');

const SocialLinkSchema = new mongoose.Schema({
  platform: { type: String, enum: ['linkedin', 'twitter', 'github', 'custom', 'instagram', 'whatsapp', 'facebook'], required: true },
  url: { type: String, required: true },
  display_name: { type: String } // Solo si platform='custom'
});

const StatSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
});

// Removidos ServiceSchema y PortfolioItemSchema 
// Los servicios vienen del módulo features/services
// El portfolio viene del módulo features/products (si está habilitado ecommerce)

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  avatar: { type: String } // URL del avatar (opcional)
});

const LocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  country: { type: String, required: true },
  postal_code: { type: String },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  business_hours: {
    monday: { type: String },
    tuesday: { type: String },
    wednesday: { type: String },
    thursday: { type: String },
    friday: { type: String },
    saturday: { type: String },
    sunday: { type: String }
  },
  additional_info: { type: String }
});

const ThemeSchema = new mongoose.Schema({
  template_id: { type: String },
  primary_color: { type: String },
  secondary_color: { type: String },
  accent_color: { type: String },
  font_family: { type: String, default: 'Montserrat' },
  layout_style: { type: String, default: 'modern' }
});

const NFCSchema = new mongoose.Schema({
  card_uid: { type: String, unique: true, sparse: true }, // ID físico de la tarjeta
  is_linked: { type: Boolean, default: false },
  last_updated: { type: Date },
  // Nuevo: identificador manual que escribe el usuario (modelo, etiqueta, alias)
  card_label: { type: String, trim: true }
});

const AppointmentConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  title: { type: String, default: 'Agendar Cita' },
  subtitle: { type: String, default: '¿Listo para comenzar?' },
  description: { type: String, default: 'Agenda una consulta gratuita y descubre cómo puedo ayudarte a transformar tu presencia digital.' },
  button_text: { type: String, default: 'Agendar Consulta Gratuita' },
  availability_message: { type: String, default: 'Horarios disponibles: Lunes a Viernes de 9:00 AM a 6:00 PM' }
});

const ProfileSchema = new mongoose.Schema({
  tenant_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true
    // La unicidad se maneja con el índice explícito
  },
  // Información básica
  profileImage: { type: String }, // URL de la imagen de perfil
  profile_image: { type: String }, // Alias para compatibilidad
  public_name: { type: String, trim: true, required: true },
  title: { type: String, trim: true }, // Título profesional
  specialty: { type: String, trim: true }, // Especialidad
  bio: { type: String, maxlength: 1000 },
  
  // Contacto
  contact: {
    emails: [{
      email: { type: String, trim: true, required: true },
      type: { type: String, enum: ['personal', 'business', 'other'], default: 'personal' },
      label: { type: String, trim: true }
    }],
    phones: [{
      phone: { type: String, trim: true, required: true },
      type: { type: String, enum: ['mobile', 'landline', 'whatsapp', 'other'], default: 'mobile' },
      label: { type: String, trim: true }
    }],
    website: { type: String, trim: true }
  },
  
  // Redes sociales
  social_links: [SocialLinkSchema],
  
  // Estadísticas/logros
  stats: [StatSchema],
  
  // Testimonios
  testimonials: [TestimonialSchema],
  
  // Ubicación
  location: LocationSchema,
  
  // Configuración de secciones visibles en el perfil
  profile_sections: {
    show_services: { type: Boolean, default: false },
    show_products: { type: Boolean, default: false },
    show_appointments: { type: Boolean, default: false },
    show_stats: { type: Boolean, default: true },
    show_testimonials: { type: Boolean, default: true },
    show_contact: { type: Boolean, default: true },
    show_location: { type: Boolean, default: true },
    show_social: { type: Boolean, default: true }
  },
  
  // Orden de las secciones en el perfil
  section_order: {
    type: [String],
    default: ['header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments'],
    validate: {
      validator: function(v) {
        const validSections = ['header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments'];
        return v.every(section => validSections.includes(section));
      },
      message: 'Secciones inválidas en el orden'
    }
  },
  
  // Configuración del tema
  theme: ThemeSchema,
  
  // NFC
  nfc: NFCSchema,
  
  // Configuración de citas
  appointment_config: AppointmentConfigSchema,
  
  // Campos personalizados
  custom_fields: { type: Map, of: String }
}, { timestamps: true });

// Índices para búsquedas rápidas
ProfileSchema.index({ tenant_id: 1 }, { unique: true }); // Un perfil por tenant
ProfileSchema.index({ 'nfc.card_uid': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Profile', ProfileSchema);