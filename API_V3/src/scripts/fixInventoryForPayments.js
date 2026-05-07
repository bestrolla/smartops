const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Inventory = require('../features/inventory/models/Inventory');
const Product = require('../features/products/models/Product');
const ProductVariant = require('../features/products/models/ProductVariant');
dotenv.config();

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function fixInventoryForPayments() {
  try {
    console.log('🔧 Iniciando verificación y corrección de inventario para pagos...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar inventarios sin variant_id (problema común)
    console.log('🔍 Verificando inventarios sin variant_id...');
    
    const inventoriesWithoutVariant = await Inventory.find({
      variant_id: { $exists: false }
    });

    console.log(`Encontrados ${inventoriesWithoutVariant.length} inventarios sin variant_id`);

    if (inventoriesWithoutVariant.length > 0) {
      console.log('\n⚠️  PROBLEMA: El modelo de inventario requiere variant_id obligatorio');
      console.log('   Esto puede estar causando que no se encuentren inventarios al aprobar pagos');
      
      // Mostrar algunos ejemplos
      for (let i = 0; i < Math.min(5, inventoriesWithoutVariant.length); i++) {
        const inv = inventoriesWithoutVariant[i];
        console.log(`   - Tenant: ${inv.tenant_id}, Producto: ${inv.product_id}`);
      }
      
      if (inventoriesWithoutVariant.length > 5) {
        console.log(`   ... y ${inventoriesWithoutVariant.length - 5} más`);
      }
    }

    // 2. Verificar productos sin variantes pero con inventario
    console.log('\n🔍 Verificando productos sin variantes...');
    
    const products = await Product.find({});
    console.log(`Total de productos: ${products.length}`);

    for (const product of products) {
      const variants = await ProductVariant.find({ productId: product._id });
      
      if (variants.length === 0) {
        console.log(`⚠️  Producto ${product._id} (${product.name}) no tiene variantes`);
        
        // Verificar si tiene inventario
        const inventory = await Inventory.findOne({
          tenant_id: product.tenantId,
          product_id: product._id
        });

        if (inventory) {
          console.log(`   ❌ Tiene inventario pero no debería (sin variantes)`);
        } else {
          console.log(`   ✅ No tiene inventario (correcto)`);
        }
      } else {
        console.log(`✅ Producto ${product._id} (${product.name}) tiene ${variants.length} variantes`);
        
        // Verificar que cada variante tenga inventario
        for (const variant of variants) {
          const inventory = await Inventory.findOne({
            tenant_id: product.tenantId,
            product_id: product._id,
            variant_id: variant._id
          });

          if (!inventory) {
            console.log(`   ❌ Variante ${variant._id} no tiene inventario`);
          } else {
            console.log(`   ✅ Variante ${variant._id} tiene inventario: stock=${inventory.current_stock}, reservado=${inventory.reserved_stock}`);
          }
        }
      }
    }

    // 3. Verificar inventarios con stock negativo
    console.log('\n🔍 Verificando inventarios con stock negativo...');
    
    const negativeStockInventories = await Inventory.find({
      $or: [
        { current_stock: { $lt: 0 } },
        { reserved_stock: { $lt: 0 } }
      ]
    });

    console.log(`Encontrados ${negativeStockInventories.length} inventarios con stock negativo`);

    if (negativeStockInventories.length > 0) {
      console.log('\n⚠️  PROBLEMA: Inventarios con stock negativo detectados');
      
      for (const inv of negativeStockInventories) {
        console.log(`   - Tenant: ${inv.tenant_id}, Producto: ${inv.product_id}, Variante: ${inv.variant_id}`);
        console.log(`     Stock actual: ${inv.current_stock}, Reservado: ${inv.reserved_stock}`);
      }
    }

    // 4. Verificar inventarios con reserved_stock mayor que current_stock
    console.log('\n🔍 Verificando inventarios con stock reservado mayor al actual...');
    
    const invalidReservedStock = await Inventory.find({
      $expr: { $gt: ['$reserved_stock', '$current_stock'] }
    });

    console.log(`Encontrados ${invalidReservedStock.length} inventarios con stock reservado inválido`);

    if (invalidReservedStock.length > 0) {
      console.log('\n⚠️  PROBLEMA: Stock reservado mayor al stock actual');
      
      for (const inv of invalidReservedStock) {
        console.log(`   - Tenant: ${inv.tenant_id}, Producto: ${inv.product_id}, Variante: ${inv.variant_id}`);
        console.log(`     Stock actual: ${inv.current_stock}, Reservado: ${inv.reserved_stock}`);
        console.log(`     Diferencia: ${inv.reserved_stock - inv.current_stock}`);
      }
    }

    // 5. Sugerir correcciones
    console.log('\n🔧 SUGERENCIAS DE CORRECCIÓN:');
    
    if (inventoriesWithoutVariant.length > 0) {
      console.log('1. ❌ CRÍTICO: Corregir inventarios sin variant_id');
      console.log('   - Opción A: Crear variantes por defecto para productos sin variantes');
      console.log('   - Opción B: Modificar el modelo de inventario para hacer variant_id opcional');
      console.log('   - Opción C: Migrar datos existentes');
    }

    if (negativeStockInventories.length > 0) {
      console.log('2. ⚠️  Corregir stock negativo');
      console.log('   - Ejecutar script de corrección de stock negativo');
    }

    if (invalidReservedStock.length > 0) {
      console.log('3. ⚠️  Corregir stock reservado inválido');
      console.log('   - Ajustar reserved_stock para que no exceda current_stock');
    }

    // 6. Crear script de corrección automática
    console.log('\n🔧 Creando script de corrección automática...');
    
    let correctionScript = `
// Script de corrección automática para inventario
// Ejecutar con: node src/scripts/autoFixInventory.js

const mongoose = require('mongoose');
const Inventory = require('../features/inventory/models/Inventory');
const ProductVariant = require('../features/products/models/ProductVariant');

async function autoFixInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔧 Iniciando corrección automática...');

    // 1. Corregir stock negativo
    const negativeStockResult = await Inventory.updateMany(
      { current_stock: { $lt: 0 } },
      { $set: { current_stock: 0 } }
    );
    console.log(\`✅ Corregidos \${negativeStockResult.modifiedCount} inventarios con stock negativo\`);

    const negativeReservedResult = await Inventory.updateMany(
      { reserved_stock: { $lt: 0 } },
      { $set: { reserved_stock: 0 } }
    );
    console.log(\`✅ Corregidos \${negativeReservedResult.modifiedCount} inventarios con stock reservado negativo\`);

    // 2. Corregir stock reservado inválido
    const invalidReservedResult = await Inventory.updateMany(
      { $expr: { $gt: ['$reserved_stock', '$current_stock'] } },
      [{ $set: { reserved_stock: '$current_stock' } }]
    );
    console.log(\`✅ Corregidos \${invalidReservedResult.modifiedCount} inventarios con stock reservado inválido\`);

    console.log('✅ Corrección automática completada');
  } catch (error) {
    console.error('❌ Error en corrección:', error);
  } finally {
    await mongoose.disconnect();
  }
}

autoFixInventory();
`;

    // Guardar script de corrección
    const fs = require('fs');
    fs.writeFileSync('src/scripts/autoFixInventory.js', correctionScript);
    console.log('✅ Script de corrección guardado en: src/scripts/autoFixInventory.js');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar verificación
if (require.main === module) {
  fixInventoryForPayments();
}

module.exports = fixInventoryForPayments; 