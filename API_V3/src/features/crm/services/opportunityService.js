const Opportunity = require('../models/Opportunity');

async function createOpportunity(data) {
  return Opportunity.create(data);
}

async function getOpportunities(tenantId) {
  return Opportunity.find({ tenantId });
}

async function getOpportunityById(id, tenantId) {
  return Opportunity.findOne({ _id: id, tenantId });
}

async function updateOpportunity(id, tenantId, data) {
  return Opportunity.findOneAndUpdate({ _id: id, tenantId }, data, { new: true });
}

async function deleteOpportunity(id, tenantId) {
  return Opportunity.findOneAndDelete({ _id: id, tenantId });
}

module.exports = {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity
}; 