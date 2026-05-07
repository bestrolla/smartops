const AppointmentSlot = require('../models/AppointmentSlot.model');
const Availability = require('../models/Availability.model');
const moment = require('moment'); // Usaremos moment.js para manejar fechas y horas

/**
 * Genera slots de citas para un profesional basados en su disponibilidad.
 * @param {string} professionalId - ID del profesional.
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD).
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD).
 */
exports.generateSlots = async (professionalId, startDate, endDate) => {
  const availability = await Availability.findOne({ professionalId });
  if (!availability) {
    throw new Error('Disponibilidad no encontrada para este profesional.');
  }

  const {
    daysOfWeek,
    startTime,
    endTime,
    slotDuration,
    exceptions
  } = availability;
  
  const exceptionDates = exceptions.map(ex => moment(ex.date).format('YYYY-MM-DD'));
  
  const slotsToCreate = [];
  const start = moment(startDate);
  const end = moment(endDate);

  for (let m = moment(start); m.isBefore(end); m.add(1, 'days')) {
    const dayOfWeek = m.day();
    const currentDate = m.format('YYYY-MM-DD');

    // Saltar si no es un día laboral o si es una excepción
    if (!daysOfWeek.includes(dayOfWeek) || exceptionDates.includes(currentDate)) {
      continue;
    }

    const slotStart = moment(currentDate + ' ' + startTime, 'YYYY-MM-DD HH:mm');
    const slotEnd = moment(currentDate + ' ' + endTime, 'YYYY-MM-DD HH:mm');

    for (let s = moment(slotStart); s.isBefore(slotEnd); s.add(slotDuration, 'minutes')) {
      slotsToCreate.push({
        professionalId,
        tenantId: availability.tenantId,
        start: s.toDate(),
        end: moment(s).add(slotDuration, 'minutes').toDate(),
        isAvailable: true
      });
    }
  }

  if (slotsToCreate.length > 0) {
    // Para evitar duplicados, podríamos borrar los slots existentes en el rango de fechas
    await AppointmentSlot.deleteMany({
      professionalId,
      start: { $gte: start.toDate() },
      end: { $lte: end.toDate() }
    });
    await AppointmentSlot.insertMany(slotsToCreate);
  }

  return slotsToCreate;
};

/**
 * Lista los slots disponibles para un profesional en un rango de fechas.
 * @param {string} professionalId - ID del profesional.
 * @param {string} startDate - Fecha de inicio.
 * @returns {Promise<AppointmentSlot[]>}
 */
exports.listAvailableSlots = async (professionalId, startDate) => {
  const start = moment(startDate).startOf('day').toDate();
  const end = moment(startDate).endOf('day').toDate();

  return AppointmentSlot.find({
    professionalId,
    start: { $gte: start, $lte: end },
    isAvailable: true
  }).sort({ start: 'asc' });
};

exports.createSlot = async (data) => {
  // TODO: lógica de creación de slot
};

exports.listSlots = async (filter) => {
  // TODO: lógica de listado de slots
}; 