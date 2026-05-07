const Note = require('../models/Note');

async function createNote(data) {
  return Note.create(data);
}

async function getNotes(tenantId, filter = {}) {
  return Note.find({ tenantId, ...filter });
}

async function getNoteById(id, tenantId) {
  return Note.findOne({ _id: id, tenantId });
}

async function updateNote(id, tenantId, userId, data) {
  return Note.findOneAndUpdate({ _id: id, tenantId, userId }, data, { new: true });
}

async function deleteNote(id, tenantId, userId) {
  return Note.findOneAndDelete({ _id: id, tenantId, userId });
}

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
}; 