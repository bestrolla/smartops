const Note = require('../models/Note');

exports.createNote = async (req, res) => {
  try {
    const note = await Note.create({ ...req.body, tenantId: req.user.tenantId, userId: req.user._id });
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getNotes = async (req, res) => {
  try {
    const filter = { tenantId: req.user.tenantId };
    if (req.query.customerId) filter['relatedTo.customerId'] = req.query.customerId;
    if (req.query.opportunityId) filter['relatedTo.opportunityId'] = req.query.opportunityId;
    if (req.query.activityId) filter['relatedTo.activityId'] = req.query.activityId;
    const notes = await Note.find(filter);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found or not allowed' });
    res.json(note);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId, userId: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found or not allowed' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 