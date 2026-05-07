
// Script de corrección automática para inventario
// Ejecutar con: node src/scripts/autoFixInventory.js
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Inventory = require('../features/inventory/models/Inventory');
const ProductVariant = require('../features/products/models/ProductVariant');

async function autoFixInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔧 Iniciando corrección automática...');

    // 1. Corregir stock negativo
    const negativeStockResult = await Inventory.updateMany(
      { current_stock: { $lt: 0 } },
      { $set: { current_stock: 0 } }
    );
    console.log(`✅ Corregidos ${negativeStockResult.modifiedCount} inventarios con stock negativo`);

    const negativeReservedResult = await Inventory.updateMany(
      { reserved_stock: { $lt: 0 } },
      { $set: { reserved_stock: 0 } }
    );
    console.log(`✅ Corregidos ${negativeReservedResult.modifiedCount} inventarios con stock reservado negativo`);

    // 2. Corregir stock reservado inválido
    const invalidReservedResult = await Inventory.updateMany(
      { $expr: { $gt: ['$reserved_stock', '$current_stock'] } },
      [{ $set: { reserved_stock: '$current_stock' } }]
    );
    console.log(`✅ Corregidos ${invalidReservedResult.modifiedCount} inventarios con stock reservado inválido`);

    console.log('✅ Corrección automática completada');
  } catch (error) {
    console.error('❌ Error en corrección:', error);
  } finally {
    await mongoose.disconnect();
  }
}

autoFixInventory();
