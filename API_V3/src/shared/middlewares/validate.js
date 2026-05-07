const Joi = require('joi');

const validate = (schema, source = 'body') => (req, res, next) => {
  const dataToValidate = req[source];
  const { error, value } = schema.validate(dataToValidate, { abortEarly: false, allowUnknown: true });

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return res.status(400).json({ status: 'error', message: 'Validation Error', errors });
  } else {
    req[source] = value; // Replace req[source] with validated data
    next();
  }
};

module.exports = validate; 