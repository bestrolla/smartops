// features/products/validations/productValidations.js
const Joi = require('joi');
const AppError = require('../../../shared/errors.utils');

const digitalDetailsSchema = Joi.object({
  downloadUrl: Joi.string().uri().allow(''),
  fileSize: Joi.string(),
  fileType: Joi.string()
});

// Esquema base compartido
const productBaseSchema = {
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500),
  sku: Joi.string().min(3).max(50),
  price: Joi.number().min(0),
  cost: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
  categories: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
  isDigital: Joi.boolean(),
  digitalDetails: Joi.when('isDigital', {
    is: true,
    then: digitalDetailsSchema.required(),
    otherwise: digitalDetailsSchema.optional()
  }),
  images: Joi.array().items(Joi.string().uri().allow('')),
  isActive: Joi.boolean(),
  metadata: Joi.object()
};

// Esquema para creación (campos requeridos)
const createProductSchema = Joi.object({
  ...productBaseSchema,
  name: productBaseSchema.name.required(),
  sku: productBaseSchema.sku.required(),
  price: productBaseSchema.price.required()
});

// Esquema para actualización (todos los campos opcionales)
const updateProductSchema = Joi.object(productBaseSchema);

// Middleware para creación
const validateProduct = (req, res, next) => {
  const { error } = createProductSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true
  });

  if (error) return handleValidationError(error, next);
  next();
};

// Middleware para actualización
const validateProductUpdate = (req, res, next) => {
  const { error } = updateProductSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true
  });

  if (error) return handleValidationError(error, next);
  next();
};

// Manejo común de errores
function handleValidationError(error, next) {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message.replace(/['"]+/g, '')
  }));
  
  return next(new AppError('Validación fallida', 400, { errors }));
}

module.exports = {
  validateProduct,
  validateProductUpdate
};