const ProfessionalType = require('../models/ProfessionalType.model');
const { createError } = require('../../../shared/errors.utils');

class ProfessionalValidator {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async validateProfessionalData(professionalData) {
    // Validar que el tipo de profesional existe
    const professionalType = await ProfessionalType.findOne({
      tenantId: this.tenantId,
      name: professionalData.professionalType
    });
    
    if (!professionalType) {
      throw createError(400, 'Invalid professional type');
    }

    // Validar campos personalizados requeridos
    if (professionalType.customFields && professionalType.customFields.length > 0) {
      for (const field of professionalType.customFields) {
        if (field.isRequired && !professionalData.customFields?.get(field.fieldName)) {
          throw createError(400, `Field ${field.fieldName} is required`);
        }
      }
    }

    return true;
  }
}

module.exports = ProfessionalValidator;