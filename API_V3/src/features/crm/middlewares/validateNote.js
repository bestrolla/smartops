const { createNoteSchema, updateNoteSchema } = require('../validations/noteValidations');

function validateCreateNote(req, res, next) {
  const { error } = createNoteSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

function validateUpdateNote(req, res, next) {
  const { error } = updateNoteSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = {
  validateCreateNote,
  validateUpdateNote
}; 