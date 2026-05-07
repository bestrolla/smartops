const Activity = require('../models/Activity');

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ tenantId: req.user.tenantId });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    );
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reassignActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { assignedTo: req.body.assignedTo },
      { new: true }
    );
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 