const Professional = require('../models/Professional.model');
const ProfessionalType = require('../models/ProfessionalType.model');
const { createError } = require('../../../shared/errors.utils');

class ProfessionalService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async createProfessional(professionalData) {
    // Verificar que el tipo de profesional existe para este tenant
    const professionalType = await ProfessionalType.findOne({
      tenantId: this.tenantId,
      name: professionalData.professionalType
    });
    
    if (!professionalType) {
      throw createError(400, 'Invalid professional type for this tenant');
    }

    // Validar campos requeridos según el tipo
    if (professionalType.requiresLicense && !professionalData.licenseNumber) {
      throw createError(400, 'License number is required for this professional type');
    }

    const professional = new Professional({
      ...professionalData,
      tenantId: this.tenantId
    });

    return await professional.save();
  }

  async getProfessionalById(id) {
    const professional = await Professional.findOne({
      _id: id,
      tenantId: this.tenantId
    }).populate('user', '-password -__v');

    if (!professional) {
      throw createError(404, 'Professional not found');
    }

    return professional;
  }

  async updateProfessional(id, updateData) {
    const professional = await Professional.findOneAndUpdate(
      { _id: id, tenantId: this.tenantId },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', '-password -__v');

    if (!professional) {
      throw createError(404, 'Professional not found');
    }

    return professional;
  }

  async listProfessionals({ page = 1, limit = 10, professionalType, isActive }) {
    const query = { tenantId: this.tenantId };
    
    if (professionalType && professionalType !== '') {
      // Buscar el ID del tipo de profesional por su nombre
      const type = await ProfessionalType.findOne({ tenantId: this.tenantId, name: professionalType });
      if (type) {
        query.professionalType = type._id; // Usar el ID del tipo
      } else {
        // Si el tipo de profesional no existe, no se encontrará ningún profesional
        // Devolver una lista vacía directamente para evitar una consulta ineficiente
        return { docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10 };
      }
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: 'user'
    };

    return await Professional.paginate(query, options);
  }

  async deactivateProfessional(id) {
    return await this.updateProfessional(id, { isActive: false });
  }
}

module.exports = ProfessionalService;