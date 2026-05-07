const mongoose = require('mongoose');
const config = require('../config');

async function fixInventoryIndexes() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(config.mongoUri);
    console.log('Conectado a MongoDB');

    // Obtener la colección de inventarios
    const db = mongoose.connection.db;
    const inventoryCollection = db.collection('inventories');

    // Eliminar el índice problemático
    await inventoryCollection.dropIndex('tenant_id_1_product_id_1');
    console.log('Índice problemático eliminado');

    // Crear los índices correctos
    await inventoryCollection.createIndex({ tenant_id: 1, product_id: 1, variant_id: 1 }, { unique: true });
    await inventoryCollection.createIndex({ tenant_id: 1, current_stock: 1 });
    await inventoryCollection.createIndex({ tenant_id: 1, location: 1 });
    await inventoryCollection.createIndex({ tenant_id: 1, variant_id: 1 });
    console.log('Índices correctos creados');

    console.log('Proceso completado exitosamente');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar el script
fixInventoryIndexes(); 