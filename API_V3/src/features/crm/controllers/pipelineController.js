const Pipeline = require('../models/Pipeline');
const Opportunity = require('../models/Opportunity');

exports.createPipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json(pipeline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.find({ tenantId: req.user.tenantId });
    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPipelineById = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    );
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    res.json(pipeline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePipeline = async (req, res) => {
  try {
    const pipeline = await Pipeline.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
    res.json({ message: 'Pipeline deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mover oportunidad de etapa
exports.moveOpportunityStage = async (req, res) => {
  try {
    const { opportunityId, stageName } = req.body;
    const opportunity = await Opportunity.findOne({ _id: opportunityId, tenantId: req.user.tenantId });
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    opportunity.stage = stageName;
    await opportunity.save();
    res.json(opportunity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 