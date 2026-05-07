const Appointment = require('../models/Appointment.model');
const AppointmentSlot = require('../models/AppointmentSlot.model');
const mongoose = require('mongoose');
const reminderService = require('./reminderService');
const googleCalendarService = require('./googleCalendarService');
const Service = require('../../services/models/Service.model');

/**
 * Crea una nueva cita a partir de un slot disponible.
 * @param {object} data - Datos de la cita { slotId, userId, notes, ... }
 * @returns {Promise<Appointment>}
 */
exports.createAppointment = async (data) => {
  const { slotId, userId, createdBy, serviceId } = data;

  const slot = await AppointmentSlot.findById(slotId);

  if (!slot || !slot.isAvailable) {
    throw new Error('Este horario ya no está disponible.');
  }

  // Validación de serviceId si se provee
  if (serviceId) {
    // Validar que el servicio existe y pertenece al tenant
    const service = await Service.findOne({ _id: serviceId, tenantId: slot.tenantId });
    if (!service) {
      throw new Error('El servicio seleccionado no existe o no pertenece al tenant.');
    }
    // Validar que el profesional está asociado al servicio
    if (!service.professionals.map(id => id.toString()).includes(slot.professionalId.toString())) {
      throw new Error('El profesional seleccionado no ofrece este servicio.');
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Marcar el slot como no disponible
    slot.isAvailable = false;
    await slot.save({ session });

    // Crear la cita
    const appointment = new Appointment({
      ...data,
      tenantId: slot.tenantId,
      professionalId: slot.professionalId,
      userId: userId,
      start: slot.start,
      end: slot.end,
      slotId: slot._id,
      createdBy: createdBy,
      serviceId: serviceId || null
    });
    await appointment.save({ session });
    
    // Sincronizar con Google Calendar DESPUÉS de confirmar la transacción local
    const googleEventId = await googleCalendarService.createEvent(appointment.professionalId, appointment);
    if (googleEventId) {
      appointment.calendarEventId = googleEventId;
      await appointment.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    
    // Disparar creación de recordatorios
    if (appointment) {
      reminderService.createRemindersForAppointment(appointment);
    }
    // TODO: Disparar notificaciones

    return appointment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Cancela una cita.
 * @param {string} appointmentId - ID de la cita.
 * @returns {Promise<Appointment>}
 */
exports.cancelAppointment = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Cita no encontrada.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Actualizar estado de la cita
    appointment.status = 'cancelled';
    await appointment.save({ session });

    // Liberar el slot de nuevo
    if (appointment.slotId) {
      await AppointmentSlot.findByIdAndUpdate(appointment.slotId, { isAvailable: true }, { session });
    }

    // Sincronizar con Google Calendar
    if (appointment.calendarEventId) {
      // No necesitamos esperar (await) para no retrasar la respuesta
      googleCalendarService.deleteEvent(appointment.professionalId, appointment.calendarEventId);
    }
    
    await session.commitTransaction();
    session.endSession();

    // TODO: Disparar notificaciones de cancelación

    return appointment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


/**
 * Actualiza una cita.
 * @param {string} appointmentId - ID de la cita.
 * @param {object} updateData - Datos a actualizar.
 * @returns {Promise<Appointment>}
 */
exports.updateAppointment = async (appointmentId, updateData) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error('Cita no encontrada.');
  }

  // Actualizar solo los campos permitidos
  const allowedUpdates = ['status', 'notes', 'location', 'type'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  updates.updatedBy = updateData.updatedBy;

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    updates,
    { new: true, runValidators: true }
  ).populate('professionalId', 'firstName lastName')
   .populate('userId', 'firstName lastName email');

  return updatedAppointment;
};

/**
 * Lista citas según un filtro.
 * @param {object} filter - Filtro de Mongoose (ej: { professionalId, userId, status })
 * @param {object} options - Opciones de paginación y ordenación
 * @returns {Promise<Appointment[]>}
 */
exports.listAppointments = async (filter, options) => {
  // Aquí se podría usar un servicio de paginación genérico si existiera
  const { page = 1, limit = 10, sortBy = 'start', order = 'asc' } = options;
  const skip = (page - 1) * limit;

  const total = await Appointment.countDocuments(filter);
  const appointments = await Appointment.find(filter)
    .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('professionalId', 'firstName lastName')
    .populate('userId', 'firstName lastName email')
    .populate('serviceId', 'name price');

  return {
    appointments,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit)
  };
}; 