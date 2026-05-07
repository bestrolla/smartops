const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI;
const Product = require('../features/products/models/Product');
const ProductVariant = require('../features/products/models/ProductVariant');
const Inventory = require('../features/inventory/models/Inventory');

async function migrateInventoryForVariants() {
  try {
    console.log('🔧 Iniciando migración de inventarios para variantes...');
    
    // Conectar a la base de datos
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a la base de datos');

    // 1. Obtener todos los productos
    const products = await Product.find({}).lean();
    console.log(`📦 Encontrados ${products.length} productos`);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        console.log(`\n🔄 Procesando producto: ${product.name} (${product.sku})`);
        
        if (product.hasVariants) {
          // Producto con variantes
          console.log(`  📋 Producto tiene variantes`);
          
          // Obtener todas las variantes del producto
          const variants = await ProductVariant.find({
            productId: product._id,
            tenantId: product.tenantId,
            isActive: true
          }).lean();

          console.log(`  🎨 Encontradas ${variants.length} variantes activas`);

          for (const variant of variants) {
            // Verificar si ya existe inventario para esta variante
            const existingInventory = await Inventory.findOne({
              tenant_id: product.tenantId,
              product_id: product._id,
              variant_id: variant._id
            });

            if (!existingInventory) {
              // Crear inventario para la variante
              const inventory = new Inventory({
                tenant_id: product.tenantId,
                product_id: product._id,
                variant_id: variant._id,
                current_stock: variant.stock || 0,
                reserved_stock: 0,
                low_stock_threshold: 5,
                high_stock_threshold: 100,
                location: 'default',
                last_movement_date: new Date(),
                metadata: {
                  created_from: 'migration_script',
                  type: 'variant',
                  variant_sku: variant.sku,
                  variant_options: variant.options
                }
              });

              await inventory.save();
              console.log(`    ✅ Inventario creado para variante: ${variant.sku}`);
              createdCount++;
            } else {
              console.log(`    ℹ️  Inventario ya existe para variante: ${variant.sku}`);
            }
          }
        } else {
          // Producto sin variantes
          console.log(`  📦 Producto sin variantes`);
          
          // Verificar si ya existe inventario para este producto (sin variante)
          const existingInventory = await Inventory.findOne({
            tenant_id: product.tenantId,
            product_id: product._id,
            variant_id: null
          });

          if (!existingInventory) {
            // Crear inventario para producto sin variantes
            const inventory = new Inventory({
              tenant_id: product.tenantId,
              product_id: product._id,
              variant_id: null,
              current_stock: 0, // Stock base del producto (si existe)
              reserved_stock: 0,
              low_stock_threshold: 5,
              high_stock_threshold: 100,
              location: 'default',
              last_movement_date: new Date(),
              metadata: {
                created_from: 'migration_script',
                type: 'base_product',
                product_sku: product.sku
              }
            });

            await inventory.save();
            console.log(`    ✅ Inventario creado para producto base`);
            createdCount++;
          } else {
            console.log(`    ℹ️  Inventario ya existe para producto base`);
          }
        }
      } catch (error) {
        console.error(`    ❌ Error procesando producto ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de la migración:');
    console.log(`  ✅ Inventarios creados: ${createdCount}`);
    console.log(`  ℹ️  Inventarios existentes: ${updatedCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);

    // Verificar inventarios problemáticos
    console.log('\n🔍 Verificando inventarios problemáticos...');
    
    const problematicInventories = await Inventory.find({
      $or: [
        { current_stock: { $lt: 0 } },
        { reserved_stock: { $lt: 0 } },
        { $expr: { $gt: ['$reserved_stock', '$current_stock'] } }
      ]
    }).populate('product_id').populate('variant_id');

    if (problematicInventories.length > 0) {
      console.log(`⚠️  Encontrados ${problematicInventories.length} inventarios problemáticos:`);
      
      for (const inv of problematicInventories) {
        console.log(`  - Producto: ${inv.product_id?.name || 'N/A'}`);
        console.log(`    Variante: ${inv.variant_id?.sku || 'Base'}`);
        console.log(`    Stock actual: ${inv.current_stock}`);
        console.log(`    Stock reservado: ${inv.reserved_stock}`);
        console.log(`    Stock disponible: ${inv.available_stock}`);
        console.log('');
      }
    } else {
      console.log('✅ No se encontraron inventarios problemáticos');
    }

    console.log('\n🎉 Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  migrateInventoryForVariants();
}

module.exports = migrateInventoryForVariants; 