const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function deleteAllProductIndexes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log(`✅ Conectado a la base de datos: ${db.databaseName}`);

    // Mostrar índices actuales
    const indexes = await db.collection('products').indexes();
    console.log('\n📋 Índices actuales de la colección products:');
    console.log(JSON.stringify(indexes, null, 2));

    // Eliminar todos los índices excepto el índice por defecto _id
    console.log('\n🗑️  Eliminando todos los índices de la colección products...');
    await db.collection('products').dropIndexes();
    console.log('✅ Todos los índices eliminados (excepto _id).');

    // Mostrar índices finales
    const finalIndexes = await db.collection('products').indexes();
    console.log('\n📋 Índices finales de la colección products:');
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\n🎉 Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

deleteAllProductIndexes(); 