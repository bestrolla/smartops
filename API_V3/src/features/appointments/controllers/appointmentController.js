const appointmentService = require('../services/appointmentService');

/**
 * Crea una nueva cita.
 * El cuerpo de la solicitud debe contener slotId, userId, y notas opcionales.
 * Puede incluir serviceId para asociar la cita a un servicio, o dejarlo vacío para citas sin servicio.
 */
exports.create = async (req, res, next) => {
  try {
    // El tenantId y createdBy deberían venir del usuario autenticado (req.user)
    const appointmentData = {
      ...req.body,
      userId: req.user.id, // Asumiendo que el ID del cliente viene del token JWT
      createdBy: req.user.id
    };
    const appointment = await appointmentService.createAppointment(appointmentData);
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Lista citas con filtros.
 * Los filtros (professionalId, userId, status) se pueden pasar por query params.
 */
exports.list = async (req, res, next) => {
  try {
    const filter = { tenantId: req.user.tenantId }; // Filtrar por tenant
    const { professionalId, userId, status, page, limit, sortBy, order } = req.query;
    
    // Solo permitir a ciertos roles ver todas las citas.
    // Un cliente normal solo debería ver las suyas.
    if (req.user.role === 'customer') {
      filter.userId = req.user.id;
    } else if (userId) {
      filter.userId = userId;
    }
    
    if (professionalId) filter.professionalId = professionalId;
    if (status) filter.status = status;

    const options = { page, limit, sortBy, order };

    const appointments = await appointmentService.listAppointments(filter, options);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza una cita.
 */
exports.update = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;
    
    // Aquí debería haber una política de seguridad para asegurar que el usuario
    // puede actualizar esta cita (es suya, es un admin, etc.).
    const appointment = await appointmentService.updateAppointment(appointmentId, updateData);
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancela una cita.
 */
exports.cancel = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    // Aquí debería haber una política de seguridad para asegurar que el usuario
    // puede cancelar esta cita (es suya, es un admin, etc.).
    const appointment = await appointmentService.cancelAppointment(appointmentId);
    res.json({ message: 'Cita cancelada exitosamente.', appointment });
  } catch (error) {
    next(error);
  }
}; 