const Professional = require('../models/Professional.model');
const { createError } = require('../../../shared/errors.utils');

module.exports = {
  // Middleware para validar que el profesional pertenece al tenant
  validateProfessionalTenant: async (req, res, next) => {
    try {
      const { tenantId, params: { id } } = req;
      
      const professional = await Professional.findOne({
        _id: id,
        tenantId
      });
      
      if (!professional) {
        throw createError(404, 'Professional not found or not accessible');
      }
      
      req.professional = professional;
      next();
    } catch (error) {
      next(error);
    }
  },

  // Middleware para cargar profesional en req
  loadProfessional: async (req, res, next) => {
    try {
      const { params: { id } } = req;
      
      const professional = await Professional.findById(id).populate('user');
      
      if (!professional) {
        throw createError(404, 'Professional not found');
      }
      
      req.professional = professional;
      next();
    } catch (error) {
      next(error);
    }
  }
};