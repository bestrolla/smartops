const { createPipelineSchema, updatePipelineSchema } = require('../validations/pipelineValidations');

function validateCreatePipeline(req, res, next) {
  const { error } = createPipelineSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdatePipeline(req, res, next) {
  const { error } = updatePipelineSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateCreatePipeline,
  validateUpdatePipeline
}; 