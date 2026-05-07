const Activity = require('../models/Activity');

async function createActivity(data) {
  return Activity.create(data);
}

async function getActivities(tenantId) {
  return Activity.find({ tenantId });
}

async function getActivityById(id, tenantId) {
  return Activity.findOne({ _id: id, tenantId });
}

async function updateActivity(id, tenantId, data) {
  return Activity.findOneAndUpdate({ _id: id, tenantId }, data, { new: true });
}

async function deleteActivity(id, tenantId) {
  return Activity.findOneAndDelete({ _id: id, tenantId });
}

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity
}; 