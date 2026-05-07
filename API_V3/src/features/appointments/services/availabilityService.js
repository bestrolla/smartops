const Availability = require('../models/Availability.model');

/**
 * Obtiene la disponibilidad de un profesional.
 * @param {string} professionalId - ID del profesional.
 * @returns {Promise<Availability>}
 */
exports.getAvailability = async (professionalId) => {
  return Availability.findOne({ professionalId });
};

/**
 * Crea o actualiza la disponibilidad de un profesional.
 * Utiliza upsert para crear si no existe.
 * @param {string} professionalId - ID del profesional.
 * @param {object} data - Datos de disponibilidad.
 * @returns {Promise<Availability>}
 */
exports.updateAvailability = async (professionalId, data) => {
  return Availability.findOneAndUpdate(
    { professionalId },
    { ...data, professionalId },
    { new: true, upsert: true, runValidators: true }
  );
}; 