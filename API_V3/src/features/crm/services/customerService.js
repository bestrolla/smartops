const Customer = require('../models/Customer');

async function createCustomer(data) {
  return Customer.create(data);
}

async function getCustomers(tenantId) {
  return Customer.find({ tenantId });
}

async function getCustomerById(id, tenantId) {
  return Customer.findOne({ _id: id, tenantId });
}

async function updateCustomer(id, tenantId, data) {
  return Customer.findOneAndUpdate({ _id: id, tenantId }, data, { new: true });
}

async function deleteCustomer(id, tenantId) {
  return Customer.findOneAndDelete({ _id: id, tenantId });
}

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
}; 