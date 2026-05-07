const { createTagSchema, updateTagSchema, tagAssignSchema } = require('../validations/tagValidations');

function validateCreateTag(req, res, next) {
  const { error } = createTagSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdateTag(req, res, next) {
  const { error } = updateTagSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateTagAssign(req, res, next) {
  const { error } = tagAssignSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateCreateTag,
  validateUpdateTag,
  validateTagAssign
}; 