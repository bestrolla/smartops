const Opportunity = require('../models/Opportunity');

exports.createOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json(opportunity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ tenantId: req.user.tenantId });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOpportunityById = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    res.json({ message: 'Opportunity deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 