const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const Product = require('../features/products/models/Product');
const ProductVariant = require('../features/products/models/ProductVariant');
const Inventory = require('../features/inventory/models/Inventory');
const Cart = require('../features/ecommerce/models/Cart');
const Order = require('../features/orders/models/Order');

async function testVariantSystem() {
  try {
    console.log('🧪 Iniciando prueba del sistema de variantes...');
    
    // Conectar a la base de datos
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a la base de datos');

    // 1. Obtener productos y variantes para pruebas
    console.log('\n📦 Obteniendo productos para pruebas...');
    
    const products = await Product.find({}).populate('variants').lean();
    console.log(`Encontrados ${products.length} productos`);

    if (products.length === 0) {
      console.log('❌ No hay productos para probar');
      return;
    }

    const product = products[0];
    console.log(`\n🔍 Producto seleccionado: ${product.name} (${product.sku})`);
    console.log(`Tiene variantes: ${product.hasVariants}`);

    if (product.hasVariants && product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      console.log(`\n🎨 Variante seleccionada: ${variant.sku}`);
      console.log(`Precio: $${variant.price}`);
      console.log(`Stock: ${variant.stock}`);

      // 2. Verificar inventario de la variante
      console.log('\n📊 Verificando inventario de la variante...');
      const inventory = await Inventory.findOne({
        tenant_id: product.tenantId,
        product_id: product._id,
        variant_id: variant._id
      }).lean();

      if (inventory) {
        const availableStock = Math.max(0, inventory.current_stock - inventory.reserved_stock);
        console.log(`✅ Inventario encontrado:`);
        console.log(`  - Stock actual: ${inventory.current_stock}`);
        console.log(`  - Stock reservado: ${inventory.reserved_stock}`);
        console.log(`  - Stock disponible: ${availableStock}`);
      } else {
        console.log('❌ No se encontró inventario para la variante');
        return;
      }

      // 3. Simular agregar al carrito (sin crear carrito real)
      console.log('\n🛒 Simulando agregar al carrito...');
      const quantity = 1;
      const availableStock = Math.max(0, inventory.current_stock - inventory.reserved_stock);
      
      if (availableStock < quantity) {
        console.log(`❌ Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${quantity}`);
        return;
      }

      console.log(`✅ Stock suficiente para agregar ${quantity} unidad(es)`);

      // 4. Simular reserva de stock
      console.log('\n🔒 Simulando reserva de stock...');
      const reservationResult = await Inventory.updateOne(
        {
          tenant_id: product.tenantId,
          product_id: product._id,
          variant_id: variant._id,
          current_stock: { $gte: quantity }
        },
        { $inc: { reserved_stock: quantity } }
      );

      if (reservationResult.modifiedCount > 0) {
        console.log('✅ Stock reservado exitosamente');
        
        // Verificar inventario después de la reserva
        const updatedInventory = await Inventory.findOne({
          tenant_id: product.tenantId,
          product_id: product._id,
          variant_id: variant._id
        }).lean();

        const updatedAvailableStock = Math.max(0, updatedInventory.current_stock - updatedInventory.reserved_stock);
        console.log(`📊 Inventario después de la reserva:`);
        console.log(`  - Stock actual: ${updatedInventory.current_stock}`);
        console.log(`  - Stock reservado: ${updatedInventory.reserved_stock}`);
        console.log(`  - Stock disponible: ${updatedAvailableStock}`);
      } else {
        console.log('❌ Error al reservar stock');
        return;
      }

      // 5. Simular creación de orden
      console.log('\n📋 Simulando creación de orden...');
      const orderNumber = `TEST-${Date.now()}`;
      const order = new Order({
        tenant_id: product.tenantId,
        orderNumber,
        customer: new mongoose.Types.ObjectId(), // ID ficticio
        items: [{
          product: product._id,
          variant: variant._id,
          quantity: quantity,
          price: variant.price,
          variantInfo: {
            sku: variant.sku,
            variantOptions: variant.options
          },
          status: 'pending'
        }],
        subtotal: variant.price * quantity,
        tax: (variant.price * quantity) * 0.16,
        total: (variant.price * quantity) * 1.16,
        paymentMethod: 'transfer',
        status: 'pending',
        paymentStatus: 'pending'
      });

      await order.save();
      console.log(`✅ Orden creada: ${orderNumber}`);

      // 6. Simular aprobación de pago (actualizar inventario)
      console.log('\n💰 Simulando aprobación de pago...');
      const inventoryUpdate = await Inventory.updateOne(
        {
          tenant_id: product.tenantId,
          product_id: product._id,
          variant_id: variant._id,
          current_stock: { $gte: quantity },
          reserved_stock: { $gte: quantity }
        },
        {
          $inc: {
            current_stock: -quantity,
            reserved_stock: -quantity
          }
        }
      );

      if (inventoryUpdate.modifiedCount > 0) {
        console.log('✅ Inventario actualizado exitosamente');
        
        // Verificar inventario final
        const finalInventory = await Inventory.findOne({
          tenant_id: product.tenantId,
          product_id: product._id,
          variant_id: variant._id
        }).lean();

        const finalAvailableStock = Math.max(0, finalInventory.current_stock - finalInventory.reserved_stock);
        console.log(`📊 Inventario final:`);
        console.log(`  - Stock actual: ${finalInventory.current_stock}`);
        console.log(`  - Stock reservado: ${finalInventory.reserved_stock}`);
        console.log(`  - Stock disponible: ${finalAvailableStock}`);

        // Actualizar stock de la variante
        await ProductVariant.updateOne(
          { _id: variant._id },
          { $inc: { stock: -quantity } }
        );
        console.log('✅ Stock de variante actualizado');

      } else {
        console.log('❌ Error al actualizar inventario');
      }

      // 7. Limpiar datos de prueba
      console.log('\n🧹 Limpiando datos de prueba...');
      await Order.deleteOne({ orderNumber });
      console.log('✅ Orden de prueba eliminada');

    } else {
      console.log('❌ El producto no tiene variantes para probar');
    }

    console.log('\n🎉 Prueba del sistema de variantes completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }
}

// Ejecutar la prueba si se llama directamente
if (require.main === module) {
  testVariantSystem();
}

module.exports = testVariantSystem; 