const mongoose = require('mongoose');
const config = require('../../config');

async function cleanDatabase() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(config.MONGO_URI);
    console.log('Conexión a MongoDB establecida');

    // Obtener todas las colecciones
    const collections = await mongoose.connection.db.collections();

    // Eliminar todos los documentos de cada colección
    for (let collection of collections) {
      await collection.deleteMany({});
      console.log(`Colección ${collection.collectionName} limpiada`);
    }

    console.log('Base de datos limpiada exitosamente');
  } catch (error) {
    console.error('Error limpiando la base de datos:', error);
    throw error;
  }
}

// Si este archivo se ejecuta directamente
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('Proceso de limpieza completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error en el proceso de limpieza:', error);
      process.exit(1);
    });
}

module.exports = cleanDatabase; 