const availabilityService = require('../services/availabilityService');

/**
 * Obtiene la disponibilidad para un profesional específico.
 * El ID del profesional se toma de los parámetros de la ruta.
 */
exports.get = async (req, res, next) => {
  try {
    const { professionalId } = req.params;
    const availability = await availabilityService.getAvailability(professionalId);
    if (!availability) {
      return res.status(404).json({ message: 'Disponibilidad no configurada para este profesional.' });
    }
    res.json(availability);
  } catch (error) {
    next(error);
  }
};

/**
 * Crea o actualiza la disponibilidad de un profesional.
 * El ID del profesional se toma de los parámetros de la ruta.
 * Los datos de disponibilidad vienen en el cuerpo de la solicitud.
 */
exports.update = async (req, res, next) => {
  try {
    const { professionalId } = req.params;
    // Aquí debería haber una validación para asegurar que el usuario logueado
    // es el profesional o un admin. Se puede hacer en un middleware.
    const availability = await availabilityService.updateAvailability(professionalId, req.body);
    res.status(200).json(availability);
  } catch (error) {
    next(error);
  }
}; 