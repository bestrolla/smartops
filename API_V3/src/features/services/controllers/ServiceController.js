const ServiceCoreService = require('../services/ServiceCoreService');
const ServicePackageService = require('../services/ServicePackageService');
const ServiceValidator = require('../services/ServiceValidator');
const { createError } = require('../../../shared/errors.utils');

class ServiceController {
  static async create(req, res, next) {
    try {
      const { tenantId, body } = req;
      
      // Validación de negocio
      const validator = new ServiceValidator(tenantId);
      await validator.validateServiceData(body);
      
      // Crear servicio
      const service = body.isPackage 
        ? await new ServicePackageService(tenantId).createPackage(body)
        : await new ServiceCoreService(tenantId).createService(body);
      
      res.status(201).json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = await new ServiceCoreService(tenantId).getServiceById(id);
      
      res.json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { tenantId, params: { id }, body } = req;
      
      // Actualizar servicio
      const service = body.isPackage 
        ? await new ServicePackageService(tenantId).updatePackage(id, body)
        : await new ServiceCoreService(tenantId).updateService(id, body);
      
      res.json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const { tenantId, query } = req;
      
      const service = new ServiceCoreService(tenantId);
      const result = await service.listServices(query);
      
      res.json({
        status: 'success',
        data: {
          services: result.docs,
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

  static async deactivate(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = await new ServiceCoreService(tenantId).deactivateService(id);
      
      res.json({
        status: 'success',
        data: service,
        message: 'Service deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async addProfessional(req, res, next) {
    try {
      const { tenantId, params: { id }, body } = req;
      
      const service = await new ServiceCoreService(tenantId)
        .addProfessionalToService(id, body.professionalId);
      
      res.status(200).json({
        status: 'success',
        data: service,
        message: 'Professional added to service successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeProfessional(req, res, next) {
    try {
      const { tenantId, params: { id }, body } = req;
      
      const service = await new ServiceCoreService(tenantId)
        .removeProfessionalFromService(id, body.professionalId);
      
      res.status(200).json({
        status: 'success',
        data: service,
        message: 'Professional removed from service successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPackageDetails(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = await new ServicePackageService(tenantId)
        .getPackageDetails(id);
      
      res.json({
        status: 'success',
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  // Métodos públicos (sin autenticación)
  static async getPublicServices(filters) {
    try {
      const serviceCoreService = new ServiceCoreService(filters.tenantId);
      return await serviceCoreService.getPublicServices(filters);
    } catch (error) {
      throw error;
    }
  }

  static async getPublicServiceById(serviceId, tenantId) {
    try {
      const serviceCoreService = new ServiceCoreService(tenantId);
      return await serviceCoreService.getPublicServiceById(serviceId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ServiceController;