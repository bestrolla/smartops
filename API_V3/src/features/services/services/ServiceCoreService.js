const Service = require('../models/Service.model');
const ServiceCategory = require('../models/ServiceCategory.model');
const { createError } = require('../../../shared/errors.utils');
const Professional = require('../../professionals/models/Professional.model');

class ServiceCoreService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async createService(serviceData) {
    // Validar categoría si se proporciona
    if (serviceData.categoryId) {
      const categoryExists = await ServiceCategory.findOne({
        _id: serviceData.categoryId,
        tenantId: this.tenantId
      });
      
      if (!categoryExists) {
        throw createError(400, 'Invalid service category');
      }
    }

    const service = new Service({
      ...serviceData,
      tenantId: this.tenantId
    });

    return await service.save();
  }

  async getServiceById(id) {
    const service = await Service.findOne({
      _id: id,
      tenantId: this.tenantId
    })
    .populate('category')
    .populate('professionalDetails');

    if (!service) {
      throw createError(404, 'Service not found');
    }

    return service;
  }

  async updateService(id, updateData) {
    // Validar categoría si se actualiza
    if (updateData.categoryId) {
      const categoryExists = await ServiceCategory.findOne({
        _id: updateData.categoryId,
        tenantId: this.tenantId
      });
      
      if (!categoryExists) {
        throw createError(400, 'Invalid service category');
      }
    }

    const service = await Service.findOneAndUpdate(
      { _id: id, tenantId: this.tenantId },
      updateData,
      { new: true, runValidators: true }
    )
    .populate('category')
    .populate('professionalDetails');

    if (!service) {
      throw createError(404, 'Service not found');
    }

    return service;
  }

  async listServices({ page = 1, limit = 10, categoryId, isActive = true, isPackage = false }) {
    const query = { tenantId: this.tenantId };
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    
    if (isPackage !== undefined) {
      query.isPackage = isPackage;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: ['category', 'professionalDetails']
    };

    return await Service.paginate(query, options);
  }

  async deactivateService(id) {
    return await this.updateService(id, { isActive: false });
  }

  async addProfessionalToService(serviceId, professionalId) {
    // Verifica que el profesional exista
    const professionalExists = await Professional.findOne({ _id: professionalId, tenantId: this.tenantId });
    if (!professionalExists) {
      throw createError(400, 'Professional does not exist');
    }
    const service = await Service.findOneAndUpdate(
      { 
        _id: serviceId, 
        tenantId: this.tenantId,
        professionals: { $ne: professionalId }
      },
      { $addToSet: { professionals: professionalId } },
      { new: true }
    );

    if (!service) {
      throw createError(404, 'Service not found or professional already added');
    }

    return service;
  }

  async removeProfessionalFromService(serviceId, professionalId) {
    const service = await Service.findOneAndUpdate(
      { 
        _id: serviceId, 
        tenantId: this.tenantId,
        professionals: professionalId
      },
      { $pull: { professionals: professionalId } },
      { new: true }
    );

    if (!service) {
      throw createError(404, 'Service not found or professional not associated');
    }

    return service;
  }

  // --- Métodos Públicos ---

  async getPublicServices(filters) {
    const query = {
      tenantId: this.tenantId,
      isActive: true
    };

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    if (filters.isPackage !== undefined) {
      query.isPackage = filters.isPackage;
    }

    return await Service.find(query).populate('category');
  }

  async getPublicServiceById(serviceId) {
    const service = await Service.findOne({
      _id: serviceId,
      tenantId: this.tenantId,
      isActive: true
    })
    .populate('category')
    .populate('professionalDetails');

    if (!service) {
      throw createError(404, 'Service not found');
    }

    return service;
  }
}

module.exports = ServiceCoreService;