const mongoose = require('mongoose');
const dbConfig = require('../config/db'); // Asumiendo que la config de DB está aquí
const reminderService = require('../features/appointments/services/reminderService');

const run = async () => {
  console.log('[INFO] Iniciando worker de envío de recordatorios...');
  try {
    await mongoose.connect(dbConfig.url, dbConfig.options);
    console.log('[INFO] Conectado a la base de datos.');

    const pendingReminders = await reminderService.findPendingReminders();

    if (pendingReminders.length === 0) {
      console.log('[INFO] No hay recordatorios pendientes para enviar.');
      return;
    }

    console.log(`[INFO] Se encontraron ${pendingReminders.length} recordatorios pendientes.`);

    for (const reminder of pendingReminders) {
      try {
        await reminderService.sendReminder(reminder);
      } catch (error) {
        console.error(`[ERROR] No se pudo enviar el recordatorio ${reminder._id}:`, error);
      }
    }

    console.log('[INFO] Proceso de recordatorios finalizado.');

  } catch (error) {
    console.error('[FATAL] Error en el worker de recordatorios:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[INFO] Desconectado de la base de datos.');
  }
};

run();

// Para ejecutarlo cada minuto, se podría envolver esto en un setInterval
// o usar una librería más robusta como node-cron.

/*
Ejemplo con node-cron:
const cron = require('node-cron');
cron.schedule('* * * * *', () => {
  console.log('Ejecutando el cron job de recordatorios...');
  run();
});
*/ 