const Joi = require('joi');

const adjustmentSchema = Joi.object({
  delta: Joi.number().integer().required()
    .messages({
      'number.base': 'Delta debe ser un número',
      'number.integer': 'Delta debe ser entero'
    }),
  reason: Joi.string().max(200).required()
    .messages({
      'string.empty': 'La razón es requerida',
      'string.max': 'La razón no puede exceder 200 caracteres'
    })
});

const createInventorySchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  initialStock: Joi.number().integer().min(0).default(0)
});

const movementQuerySchema = Joi.object({
  startDate: Joi.string().isoDate(),
  endDate: Joi.string().isoDate(),
  type: Joi.string().valid('purchase', 'sale', 'adjustment', 'return', 'transfer')
});

const releaseItemsSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
      productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
      quantity: Joi.number().integer().min(1).required()
    }).or('product', 'productId') // Requiere al menos uno de estos campos
  ).min(1).required()
});


module.exports = {
  validateAdjustment: (data) => {
    const { error, value } = adjustmentSchema.validate(data, { 
      abortEarly: false 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      throw { details: errors };
    }
    
    return value;
  },

  validateCreate: (data) => {
    const { error } = createInventorySchema.validate(data);
    if (error) throw new AppError(error.details[0].message, 400);
  },

  validateMovementQuery: (data) => {
    const { error } = movementQuerySchema.validate(data);
    if (error) throw new AppError(error.details[0].message, 400);
  },

   validateReleaseItems: (data) => {
    const { error } = releaseItemsSchema.validate(data, { 
      abortEarly: false,
      allowUnknown: true
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new AppError('Validación fallida', 400, {
        details: errorDetails
      });
    }
    
    return true;
  }
};