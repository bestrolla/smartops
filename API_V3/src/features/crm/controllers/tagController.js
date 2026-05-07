const Tag = require('../models/Tag');
const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');

exports.createTag = async (req, res) => {
  try {
    const tag = await Tag.create({ ...req.body, tenantId: req.user.tenantId });
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find({ tenantId: req.user.tenantId });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    );
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Asignar etiqueta a cliente
exports.addTagToCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.customerId, tenantId: req.user.tenantId },
      { $addToSet: { tags: req.body.tagId } },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Quitar etiqueta de cliente
exports.removeTagFromCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.customerId, tenantId: req.user.tenantId },
      { $pull: { tags: req.body.tagId } },
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Asignar etiqueta a oportunidad
exports.addTagToOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOneAndUpdate(
      { _id: req.params.opportunityId, tenantId: req.user.tenantId },
      { $addToSet: { tags: req.body.tagId } },
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Quitar etiqueta de oportunidad
exports.removeTagFromOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findOneAndUpdate(
      { _id: req.params.opportunityId, tenantId: req.user.tenantId },
      { $pull: { tags: req.body.tagId } },
      { new: true }
    );
    if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
    res.json(opportunity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; 