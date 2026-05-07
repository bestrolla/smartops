exports.checkAvailability = async (req, res, next) => {
  // TODO: lógica para verificar disponibilidad antes de crear cita
  next();
};

/**
 * Middleware para verificar que el usuario autenticado es el profesional
 * que está intentando modificar o ver, o que es un administrador.
 * Asume que el ID del profesional viene en `req.params.professionalId`.
 */
exports.checkProfessionalOwnership = async (req, res, next) => {
  const { user } = req; // Usuario autenticado desde el token JWT
  const { professionalId } = req.params;

  // Si el usuario es admin, puede continuar
  if (user.roles.some(role => role.name === 'admin' || role.name === 'superadmin')) {
    return next();
  }

  // Si el ID del profesional en la ruta coincide con el tenantId del usuario logueado
  // (en este sistema, los usuarios admin actúan como profesionales usando su tenantId)
  if (user.tenantId && user.tenantId.toString() === professionalId) {
    return next();
  }

  // También verificar si hay un professionalId específico (para futura compatibilidad)
  if (user.professionalId && user.professionalId.toString() === professionalId) {
    return next();
  }

  return res.status(403).json({ message: 'No tienes permiso para realizar esta acción sobre este profesional.' });
};

/**
 * Middleware para verificar la disponibilidad de un slot antes de crear la cita.
 * Es una doble verificación, ya que el servicio también lo comprueba.
 * Puede ser útil para devolver un error temprano.
 */
exports.checkSlotAvailability = async (req, res, next) => {
  const { slotId } = req.body;
  if (!slotId) {
    return next(); // Dejar que la validación de Joi se encargue
  }

  const AppointmentSlot = require('../models/AppointmentSlot.model');
  const slot = await AppointmentSlot.findById(slotId);

  if (!slot || !slot.isAvailable) {
    return res.status(409).json({ message: 'Este horario ya no está disponible.' }); // 409 Conflict
  }

  next();
}; 