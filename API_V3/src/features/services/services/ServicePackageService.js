const Service = require('../models/Service.model');
const { createError } = require('../../../shared/errors.utils');

class ServicePackageService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async createPackage(packageData) {
    // Verificar que packageServices exista y tenga al menos un elemento
    if (!packageData.packageServices || packageData.packageServices.length === 0) {
      throw createError(400, 'Package must include at least one service');
    }

    // Verificar que todos los servicios existen y pertenecen al tenant
    if (packageData.packageServices && packageData.packageServices.length > 0) {
      const serviceIds = packageData.packageServices.map(s => s.serviceId);
      
      const servicesCount = await Service.countDocuments({
        _id: { $in: serviceIds },
        tenantId: this.tenantId,
        isPackage: false
      });
      
      if (servicesCount !== serviceIds.length) {
        throw createError(400, 'One or more services are invalid or already packages');
      }
    }

    const servicePackage = new Service({
      ...packageData,
      isPackage: true,
      tenantId: this.tenantId
    });

    return await servicePackage.save();
  }

  async updatePackage(packageId, updateData) {
    // Verificar que no se intenta cambiar isPackage
    if (updateData.isPackage === false) {
      throw createError(400, 'Cannot convert package to regular service');
    }

    // Verificar servicios si se actualizan
    if (updateData.packageServices && updateData.packageServices.length > 0) {
      const serviceIds = updateData.packageServices.map(s => s.serviceId);
      
      const servicesCount = await Service.countDocuments({
        _id: { $in: serviceIds },
        tenantId: this.tenantId,
        isPackage: false
      });
      
      if (servicesCount !== serviceIds.length) {
        throw createError(400, 'One or more services are invalid or already packages');
      }
    }

    const servicePackage = await Service.findOneAndUpdate(
      { 
        _id: packageId, 
        tenantId: this.tenantId,
        isPackage: true 
      },
      { ...updateData, isPackage: true },
      { new: true, runValidators: true }
    )
    .populate('packageServices.serviceId');

    if (!servicePackage) {
      throw createError(404, 'Service package not found');
    }

    return servicePackage;
  }

  async getPackageDetails(packageId) {
    const servicePackage = await Service.findOne({
      _id: packageId,
      tenantId: this.tenantId,
      isPackage: true
    })
    .populate('packageServices.serviceId');

    if (!servicePackage) {
      throw createError(404, 'Service package not found');
    }

    return servicePackage;
  }
}

module.exports = ServicePackageService;