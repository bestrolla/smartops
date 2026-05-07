const { createOpportunitySchema, updateOpportunitySchema } = require('../validations/opportunityValidations');

function validateCreateOpportunity(req, res, next) {
  const { error } = createOpportunitySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdateOpportunity(req, res, next) {
  const { error } = updateOpportunitySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateCreateOpportunity,
  validateUpdateOpportunity
}; 