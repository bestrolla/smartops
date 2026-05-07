const { createActivitySchema, updateActivitySchema } = require('../validations/activityValidations');

function validateCreateActivity(req, res, next) {
  const { error } = createActivitySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdateActivity(req, res, next) {
  const { error } = updateActivitySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateCreateActivity,
  validateUpdateActivity
}; 