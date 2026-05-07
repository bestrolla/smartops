const slotService = require('../services/slotService');

/**
 * Genera slots de citas para un profesional en un rango de fechas.
 * Requiere professionalId, startDate y endDate.
 */
exports.generate = async (req, res, next) => {
  try {
    const { professionalId, startDate, endDate } = req.body;
    if (!professionalId || !startDate || !endDate) {
      return res.status(400).json({ message: 'professionalId, startDate y endDate son requeridos.' });
    }
    const slots = await slotService.generateSlots(professionalId, startDate, endDate);
    res.status(201).json({ message: `${slots.length} slots generados exitosamente.`, slots });
  } catch (error) {
    next(error);
  }
};

/**
 * Lista los slots disponibles para un día específico.
 * Requiere professionalId y date en los query params.
 */
exports.listAvailable = async (req, res, next) => {
  try {
    const { professionalId, date } = req.query;
    if (!professionalId || !date) {
      return res.status(400).json({ message: 'professionalId y date son requeridos.' });
    }
    const slots = await slotService.listAvailableSlots(professionalId, date);
    res.json(slots);
  } catch (error) {
    next(error);
  }
};

// Se mantienen los placeholders por si se necesita crear/listar slots manualmente en el futuro
exports.list = async (req, res) => {
  res.status(501).json({ message: 'No implementado. Usar /available-slots' });
};

exports.create = async (req, res) => {
  res.status(501).json({ message: 'No implementado. Usar /generate-slots' });
}; 