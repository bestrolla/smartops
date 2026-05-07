const Service = require('../models/Service.model');
const ServiceCategory = require('../models/ServiceCategory.model');
const { createError } = require('../../../shared/errors.utils');

class ServiceValidator {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async validateServiceData(serviceData) {
    // Validar que la categoría existe si se proporciona
    if (serviceData.categoryId) {
      await this.validateCategory(serviceData.categoryId);
    }

    // Validar que no existe un servicio con el mismo nombre
    await this.validateUniqueName(serviceData.name, serviceData.id);

    // Validar profesionales si se proporcionan
    if (serviceData.professionals && serviceData.professionals.length > 0) {
      await this.validateProfessionals(serviceData.professionals);
    }

    // Validar datos de paquete si es un paquete
    if (serviceData.isPackage) {
      await this.validatePackageData(serviceData);
    }

    return true;
  }

  async validateCategory(categoryId) {
    const category = await ServiceCategory.findOne({
      _id: categoryId,
      tenantId: this.tenantId,
      isActive: true
    });

    if (!category) {
      throw createError(400, 'Invalid category ID or category is inactive');
    }

    return category;
  }

  async validateUniqueName(name, excludeId = null) {
    const query = {
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      tenantId: this.tenantId
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingService = await Service.findOne(query);

    if (existingService) {
      throw createError(400, 'A service with this name already exists');
    }

    return true;
  }

  async validateProfessionals(professionalIds) {
    // En una implementación completa, aquí validaríamos que los profesionales existen
    // y pertenecen al tenant. Por ahora, solo validamos que sea un array válido
    if (!Array.isArray(professionalIds)) {
      throw createError(400, 'Professionals must be an array');
    }

    // Validar que todos los IDs son válidos ObjectIds
    for (const id of professionalIds) {
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError(400, `Invalid professional ID: ${id}`);
      }
    }

    return true;
  }

  async validatePackageData(packageData) {
    if (!packageData.packageServices || packageData.packageServices.length === 0) {
      throw createError(400, 'Package must include at least one service');
    }

    // Validar que todos los servicios del paquete existen y no son paquetes
    for (const packageService of packageData.packageServices) {
      const service = await Service.findOne({
        _id: packageService.serviceId,
        tenantId: this.tenantId,
        isPackage: false,
        isActive: true
      });

      if (!service) {
        throw createError(400, `Invalid service ID in package: ${packageService.serviceId}`);
      }
    }

    return true;
  }

  async validateServiceUpdate(serviceId, updateData) {
    // Verificar que el servicio existe
    const service = await Service.findOne({
      _id: serviceId,
      tenantId: this.tenantId
    });

    if (!service) {
      throw createError(404, 'Service not found');
    }

    // No permitir cambiar el tipo de servicio (paquete/no paquete)
    if (updateData.hasOwnProperty('isPackage') && updateData.isPackage !== service.isPackage) {
      throw createError(400, 'Cannot change service type (package/service)');
    }

    // Validar otros campos como en la creación
    if (updateData.name && updateData.name !== service.name) {
      await this.validateUniqueName(updateData.name, serviceId);
    }

    if (updateData.categoryId) {
      await this.validateCategory(updateData.categoryId);
    }

    if (updateData.professionals) {
      await this.validateProfessionals(updateData.professionals);
    }

    if (updateData.isPackage && updateData.packageServices) {
      await this.validatePackageData(updateData);
    }

    return true;
  }
}

module.exports = ServiceValidator;