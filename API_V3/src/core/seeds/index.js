require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../../config');
const { createInitialData } = require('./initial.seed');
const cleanDatabase = require('./clean');

async function runSeeds() {
  try {
    // Limpiar la base de datos primero
    await cleanDatabase();

    // Reconectar después de limpiar
    await mongoose.connect(config.MONGO_URI);
    console.log('Conexión a MongoDB establecida');

    // Crear datos iniciales
    console.log('Iniciando creación de datos iniciales...');
    await createInitialData();
    console.log('Datos iniciales creados exitosamente');

  } catch (error) {
    console.error('Error ejecutando seeds:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Si este archivo se ejecuta directamente
if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Proceso de seed completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de seed:', error);
      process.exit(1);
    });
}

module.exports = {
  runSeeds
}; 