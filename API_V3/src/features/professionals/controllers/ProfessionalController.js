const ProfessionalService = require('../services/ProfessionalService');
const ProfessionalValidator = require('../services/ProfessionalValidator');
const ProfessionalType = require('../models/ProfessionalType.model');
const { createError } = require('../../../shared/errors.utils');

class ProfessionalController {
  static async create(req, res, next) {
    try {
      const { tenantId, body } = req;
      
      // Validación de negocio
      const validator = new ProfessionalValidator(tenantId);
      await validator.validateProfessionalData(body);
      
      // Crear profesional
      const service = new ProfessionalService(tenantId);
      const professional = await service.createProfessional(body);
      
      res.status(201).json({
        status: 'success',
        data: professional
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = new ProfessionalService(tenantId);
      const professional = await service.getProfessionalById(id);
      
      res.json({
        status: 'success',
        data: professional
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { tenantId, params: { id }, body } = req;
      
      // Actualizar profesional
      const service = new ProfessionalService(tenantId);
      const professional = await service.updateProfessional(id, body);
      
      res.json({
        status: 'success',
        data: professional
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { tenantId, query } = req;
      
      const service = new ProfessionalService(tenantId);
      const result = await service.listProfessionals(query);
      
      res.json({
        status: 'success',
        data: {
          professionals: result.docs,
          total: result.totalDocs,
          pages: result.totalPages,
          page: result.page,
          limit: result.limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfessionalTypes(req, res, next) {
    try {
      const { tenantId } = req;
      
      const professionalTypes = await ProfessionalType.find({
        tenantId: tenantId,
        isActive: true
      }).select('_id name description requiresLicense').sort({ name: 1 });
      
      res.json({
        status: 'success',
        data: professionalTypes
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProfessionalType(req, res, next) {
    try {
      const { tenantId, body } = req;
      
      const professionalType = new ProfessionalType({
        ...body,
        tenantId: tenantId
      });
      
      const savedType = await professionalType.save();
      
      res.status(201).json({
        status: 'success',
        data: savedType
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = new ProfessionalService(tenantId);
      const professional = await service.deactivateProfessional(id);
      
      res.json({
        status: 'success',
        data: professional,
        message: 'Professional deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfessionalController;