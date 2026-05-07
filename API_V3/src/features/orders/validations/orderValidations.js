const Joi = require('joi');
const AppError = require('../../../shared/errors.utils');

// Esquema para dirección
const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  country: Joi.string().required(),
  additionalInfo: Joi.string().allow('').optional()
});

// Esquema para ítems de la orden
const orderItemSchema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  discount: Joi.number().min(0).max(100).default(0)
});

// Esquema para detalles de pago
const paymentDetailsSchema = Joi.object({
  cardLastFour: Joi.string().length(4),
  cardBrand: Joi.string()
}).optional();

// Esquema para metadata
const metadataSchema = Joi.object({
  tipoEnvio: Joi.string(),
  regaloPara: Joi.string()
}).optional();

// Esquema principal para crear orden
const createOrderSchema = Joi.object({
  customer: Joi.string().hex().length(24).optional(),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.optional(),
  paymentMethod: Joi.string().valid('credit_card', 'paypal', 'bank_transfer', 'cash').required(),
  paymentDetails: paymentDetailsSchema,
  notes: Joi.string().allow('').optional(),
  metadata: metadataSchema
});

// Esquema para actualización de orden
const updateOrderSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 
    'processing', 
    'shipped', 
    'delivered', 
    'cancelled'
  ).required(),
  notes: Joi.string().allow('').optional()
});

module.exports = {
  validateCreateOrder: (data) => createOrderSchema.validate(data, { 
    abortEarly: false,
    allowUnknown: true // Permite campos adicionales no definidos en el esquema
  }),
  validateUpdateOrder: (data) => updateOrderSchema.validate(data, { abortEarly: false }),

};