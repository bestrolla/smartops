const { createCustomerSchema, updateCustomerSchema } = require('../validations/customerValidations');

function validateCreateCustomer(req, res, next) {
  const { error } = createCustomerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdateCustomer(req, res, next) {
  const { error } = updateCustomerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer
}; 