const Service = require('../models/Service.model');
const { createError } = require('../../../shared/errors.utils');

module.exports = {
  // Middleware para validar que el servicio pertenece al tenant
  validateServiceTenant: async (req, res, next) => {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = await Service.findOne({
        _id: id,
        tenantId
      });
      
      if (!service) {
        throw createError(404, 'Service not found or not accessible');
      }
      
      req.service = service;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Middleware para validar que es un paquete
  validateIsPackage: async (req, res, next) => {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = await Service.findOne({
        _id: id,
        tenantId,
        isPackage: true
      });
      
      if (!service) {
        throw createError(404, 'Service package not found');
      }
      
      req.service = service;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Middleware para validar que NO es un paquete
  validateIsNotPackage: async (req, res, next) => {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = await Service.findOne({
        _id: id,
        tenantId,
        isPackage: false
      });
      
      if (!service) {
        throw createError(404, 'Service not found or is a package');
      }
      
      req.service = service;
      next();
    } catch (error) {
      next(error);
    }
  }
};