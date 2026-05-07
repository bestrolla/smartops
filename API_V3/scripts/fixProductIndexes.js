const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

async function fixProductIndexes() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    
    // Verificar índices actuales de la colección products
    console.log('\n📋 Índices actuales de la colección products:');
    const indexes = await db.collection('products').indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Buscar y eliminar el índice único problemático en sku
    const skuIndex = indexes.find(index => 
      index.key && 
      Object.keys(index.key).length === 1 && 
      index.key.sku === 1
    );

    if (skuIndex) {
      console.log(`\n🗑️  Eliminando índice problemático: ${skuIndex.name}`);
      await db.collection('products').dropIndex(skuIndex.name);
      console.log('✅ Índice eliminado correctamente');
    } else {
      console.log('\n✅ No se encontró índice único problemático en sku');
    }

    // Verificar que el índice compuesto correcto existe
    const compoundIndex = indexes.find(index => 
      index.key && 
      index.key.tenantId === 1 && 
      index.key.sku === 1
    );

    if (!compoundIndex) {
      console.log('\n🔧 Creando índice compuesto { tenantId: 1, sku: 1 }...');
      await db.collection('products').createIndex(
        { tenantId: 1, sku: 1 }, 
        { unique: true }
      );
      console.log('✅ Índice compuesto creado correctamente');
    } else {
      console.log('\n✅ Índice compuesto ya existe');
    }

    // Verificar índices finales
    console.log('\n📋 Índices finales de la colección products:');
    const finalIndexes = await db.collection('products').indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\n🎉 Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
fixProductIndexes(); 