const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function deleteProductSkuIndexes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    console.log(`✅ Conectado a la base de datos: ${db.databaseName}`);

    // Mostrar índices actuales
    const indexes = await db.collection('products').indexes();
    console.log('\n📋 Índices actuales de la colección products:');
    console.log(JSON.stringify(indexes, null, 2));

    // Buscar todos los índices simples sobre sku
    const skuIndexes = indexes.filter(index =>
      index.key &&
      Object.keys(index.key).length === 1 &&
      index.key.sku === 1
    );

    if (skuIndexes.length === 0) {
      console.log('\n✅ No se encontraron índices simples sobre sku para eliminar.');
    } else {
      for (const idx of skuIndexes) {
        console.log(`\n🗑️  Eliminando índice: ${idx.name}`);
        await db.collection('products').dropIndex(idx.name);
        console.log(`✅ Índice ${idx.name} eliminado.`);
      }
    }

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

deleteProductSkuIndexes(); 