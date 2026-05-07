const Joi = require('joi');
const { createError } = require('../../../shared/errors.utils');
const { validate } = require('../../../shared/validation.utils');

const createSchema = Joi.object({
  order: Joi.string().hex().length(24)
    .when('type', {
      is: 'order_payment',
      then: Joi.required().messages({
        'any.required': 'El campo order es obligatorio para pagos de tipo order_payment',
        'string.hex': 'El ID de la orden debe ser un ObjectId válido',
        'string.length': 'El ID de la orden debe tener 24 caracteres'
      }),
      otherwise: Joi.optional()
    }),
  amount: Joi.number().positive().required().messages({
    'number.base': 'El monto debe ser un número',
    'number.positive': 'El monto debe ser positivo',
    'any.required': 'El monto es obligatorio'
  }),
  description: Joi.string().max(500).messages({
    'string.max': 'La descripción no puede exceder los 500 caracteres'
  }),
  type: Joi.string().valid('order_payment', 'subscription', 'refund').required().messages({
    'any.only': 'El tipo de pago debe ser order_payment, subscription o refund',
    'any.required': 'El tipo de pago es obligatorio'
  }),
  method: Joi.string().valid('credit_card', 'debit_card', 'cash', 'transfer').required().messages({
    'any.only': 'El método de pago debe ser credit_card, debit_card, cash o transfer',
    'any.required': 'El método de pago es obligatorio'
  })
});

const listSchema = Joi.object({
  tenantId: Joi.string().hex().length(24).messages({
    'string.hex': 'El ID del tenant debe ser un ObjectId válido',
    'string.length': 'El ID del tenant debe tener 24 caracteres'
  }),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'completed', 'refunded').messages({
    'any.only': 'El estado debe ser pending, verified, rejected, completed o refunded'
  }),
  type: Joi.string().valid('order_payment', 'subscription', 'refund').messages({
    'any.only': 'El tipo debe ser order_payment, subscription o refund'
  })
});

const rejectSchema = Joi.object({
  reason: Joi.string().max(500).required().messages({
    'string.max': 'La razón no puede exceder los 500 caracteres',
    'any.required': 'La razón es obligatoria'
  })
});

const automaticPaymentSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'El monto debe ser un número',
    'number.positive': 'El monto debe ser positivo',
    'any.required': 'El monto es obligatorio'
  }),
  currency: Joi.string().valid('USD', 'USDT').required().messages({
    'any.only': 'La moneda debe ser USD o USDT',
    'any.required': 'La moneda es obligatoria'
  }),
  paymentMethod: Joi.string().valid('paypal', 'binance').required().messages({
    'any.only': 'El método de pago debe ser paypal o binance',
    'any.required': 'El método de pago es obligatorio'
  })
});

const updateManualSchema = Joi.object({
  amount: Joi.number().positive().messages({
    'number.base': 'El monto debe ser un número',
    'number.positive': 'El monto debe ser positivo'
  }),
  method: Joi.string().valid('credit_card', 'debit_card', 'cash', 'transfer').messages({
    'any.only': 'El método de pago debe ser credit_card, debit_card, cash o transfer'
  }),
  currency: Joi.string().messages({
    'string.base': 'La moneda debe ser un string'
  }),
  notes: Joi.string().max(500).messages({
    'string.max': 'Las notas no pueden exceder los 500 caracteres'
  })
});

const approveManualSchema = Joi.object({
  notes: Joi.string().max(500).messages({
    'string.max': 'Las notas no pueden exceder los 500 caracteres'
  })
});

module.exports = {
  create: validate(createSchema),
  list: validate(listSchema),
  reject: validate(rejectSchema),
  validateAutomaticPayment: validate(automaticPaymentSchema),
  updateManual: validate(updateManualSchema),
  approveManual: validate(approveManualSchema)
};