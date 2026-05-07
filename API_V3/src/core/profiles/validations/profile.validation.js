const Joi = require('joi');

const socialLinkSchema = Joi.object({
  platform: Joi.string().valid(
    'linkedin', 'twitter', 'instagram', 'facebook', 'tiktok', 'youtube',
    'github', 'behance', 'dribbble', 'pinterest', 'snapchat', 'telegram',
    'whatsapp', 'discord', 'twitch', 'reddit', 'medium', 'substack',
    'patreon', 'onlyfans', 'spotify', 'soundcloud', 'website', 'blog',
    'portfolio', 'custom'
  ).required(),
  url: Joi.string().min(3).pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/).required().messages({
    'string.pattern.base': 'URL must be a valid web address (e.g., example.com or https://example.com)'
  }),
  display_name: Joi.string().allow('').optional()
});

const statSchema = Joi.object({
  label: Joi.string().required(),
  value: Joi.string().required()
});

// Removidos serviceSchema y portfolioItemSchema
// Los servicios vienen del módulo features/services  
// El portfolio viene del módulo features/products

const testimonialSchema = Joi.object({
  name: Joi.string().required(),
  role: Joi.string().required(),
  content: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  avatar: Joi.string().uri().allow('').optional()
});

const locationSchema = Joi.object({
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().allow('').optional(),
  country: Joi.string().required(),
  postal_code: Joi.string().allow('').optional(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
  }).optional(),
  business_hours: Joi.object({
    monday: Joi.string().allow('').optional(),
    tuesday: Joi.string().allow('').optional(),
    wednesday: Joi.string().allow('').optional(),
    thursday: Joi.string().allow('').optional(),
    friday: Joi.string().allow('').optional(),
    saturday: Joi.string().allow('').optional(),
    sunday: Joi.string().allow('').optional()
  }).optional(),
  additional_info: Joi.string().allow('').optional()
});

const themeSchema = Joi.object({
  template_id: Joi.string().optional(),
  primary_color: Joi.string().optional(),
  secondary_color: Joi.string().optional(),
  accent_color: Joi.string().optional(),
  font_family: Joi.string().default('Montserrat').optional(),
  layout_style: Joi.string().default('modern').optional()
}).min(1);

// Validación para actualización de colores
const updateColorsSchema = Joi.object({
  primary_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  secondary_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  accent_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  font_family: Joi.string().optional()
}).min(1);

// Validación para actualización de contacto
const updateContactSchema = Joi.object({
  email: Joi.string().email().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  website: Joi.string().uri().allow('').optional()
}).min(1);

// Validación para orden de secciones
const sectionOrderSchema = Joi.object({
  section_order: Joi.array().items(
    Joi.string().valid('header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments')
  ).required()
});

exports.createOrUpdateProfileSchema = Joi.object({
  // Información básica
  public_name: Joi.string().required(),
  title: Joi.string().allow('').optional(),
  specialty: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  profileImage: Joi.string().uri().optional(),
  profile_image: Joi.string().allow('').optional(),
  
  // Contacto
  contact: Joi.object({
    email: Joi.string().email().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    website: Joi.string().uri().allow('').optional()
  }).optional(),
  
  // Redes sociales
  social_links: Joi.array().items(socialLinkSchema).optional(),
  
  // Estadísticas
  stats: Joi.array().items(statSchema).optional(),
  
  // Testimonios
  testimonials: Joi.array().items(testimonialSchema).optional(),
  
  // Ubicación
  location: locationSchema.optional(),
  
  // Configuración de secciones del perfil
  profile_sections: Joi.object({
    show_services: Joi.boolean().optional(),
    show_products: Joi.boolean().optional(),
    show_appointments: Joi.boolean().optional(),
    show_stats: Joi.boolean().optional(),
    show_testimonials: Joi.boolean().optional(),
    show_contact: Joi.boolean().optional(),
    show_location: Joi.boolean().optional(),
    show_social: Joi.boolean().optional()
  }).optional(),
  
  // Orden de secciones
  section_order: Joi.array().items(
    Joi.string().valid('header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments')
  ).optional(),
  
  // Tema
  theme: themeSchema.optional(),
  
  // Campos personalizados
  custom_fields: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

// Exportar los nuevos esquemas de validación
exports.updateColorsSchema = updateColorsSchema;
exports.updateContactSchema = updateContactSchema;
exports.sectionOrderSchema = sectionOrderSchema;

// Normaliza y valida UIDs provenientes de NFC Tools (colon/guiones/espacios, mayúsc/minúsc)
const cardUidSchema = Joi.string().custom((value, helpers) => {
  const normalized = value.replace(/[^0-9a-f]/gi, '').toUpperCase();
  const validLengths = [8, 14, 20];
  if (!/^[0-9A-F]+$/.test(normalized) || !validLengths.includes(normalized.length)) {
    return helpers.error('string.pattern.base', { value });
  }
  return normalized;
}, 'NFC UID normalizer').messages({
  'string.pattern.base': 'card_uid debe ser el Tag UID en hexadecimal (8, 14 o 20 dígitos). Se aceptan separadores ":" "-" y espacios.'
});

exports.linkNFCSchema = Joi.object({
  card_uid: cardUidSchema.required()
});

// Scan NFC: body { card_uid } normalizado automáticamente
const nfcScanSchema = Joi.object({
  card_uid: cardUidSchema.required()
});

exports.nfcScanSchema = nfcScanSchema;

// Validación para parámetros de ruta con ObjectId
exports.objectIdParamSchema = Joi.object({
  tenant_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'tenant_id must be a valid ObjectId',
    'any.required': 'tenant_id is required'
  })
});

// Validación para testimonios
exports.testimonialSchema = testimonialSchema;

// Validación para ubicación
exports.locationSchema = locationSchema;

// Validación para parámetros de testimonio
exports.testimonialParamSchema = Joi.object({
  tenant_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  testimonial_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
});

// Validación para actualización parcial del perfil
exports.partialUpdateProfileSchema = Joi.object({
  public_name: Joi.string().optional(),
  title: Joi.string().allow('').optional(),
  specialty: Joi.string().allow('').optional(),
  bio: Joi.string().allow('').optional(),
  profileImage: Joi.string().uri().optional(),
  profile_image: Joi.string().allow('').optional(),
  
  // Contacto
  contact: Joi.object({
    email: Joi.string().email().allow('').optional(),
    phone: Joi.string().allow('').optional(),
    website: Joi.string().uri().allow('').optional()
  }).optional(),
  
  // Redes sociales
  social_links: Joi.array().items(socialLinkSchema).optional(),
  
  // Estadísticas
  stats: Joi.array().items(statSchema).optional(),
  
  // Testimonios
  testimonials: Joi.array().items(testimonialSchema).optional(),
  
  // Ubicación
  location: locationSchema.optional(),
  
  // Configuración de secciones del perfil
  profile_sections: Joi.object({
    show_services: Joi.boolean().optional(),
    show_products: Joi.boolean().optional(),
    show_appointments: Joi.boolean().optional(),
    show_stats: Joi.boolean().optional(),
    show_testimonials: Joi.boolean().optional(),
    show_contact: Joi.boolean().optional(),
    show_location: Joi.boolean().optional(),
    show_social: Joi.boolean().optional()
  }).optional(),
  
  // Orden de secciones
  section_order: Joi.array().items(
    Joi.string().valid('header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments')
  ).optional(),
  
  // Tema
  theme: themeSchema.optional(),
  
  // Campos personalizados
  custom_fields: Joi.object().pattern(Joi.string(), Joi.string()).optional()
}).min(1); // Al menos un campo debe estar presente

// Nuevo: esquema para actualizar el campo manual de NFC (sin formato hex)
exports.nfcLabelSchema = Joi.object({
  card_label: Joi.string().min(2).max(64).required().messages({
    'any.required': 'card_label es requerido',
    'string.min': 'card_label debe tener al menos 2 caracteres',
    'string.max': 'card_label debe tener como máximo 64 caracteres'
  })
});