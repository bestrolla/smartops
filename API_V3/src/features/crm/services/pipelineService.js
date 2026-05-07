const Pipeline = require('../models/Pipeline');

async function createPipeline(data) {
  return Pipeline.create(data);
}

async function getPipelines(tenantId) {
  return Pipeline.find({ tenantId });
}

async function getPipelineById(id, tenantId) {
  return Pipeline.findOne({ _id: id, tenantId });
}

async function updatePipeline(id, tenantId, data) {
  return Pipeline.findOneAndUpdate({ _id: id, tenantId }, data, { new: true });
}

async function deletePipeline(id, tenantId) {
  return Pipeline.findOneAndDelete({ _id: id, tenantId });
}

module.exports = {
  createPipeline,
  getPipelines,
  getPipelineById,
  updatePipeline,
  deletePipeline
}; 