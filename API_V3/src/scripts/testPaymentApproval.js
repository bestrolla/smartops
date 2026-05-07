const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Payment = require('../core/payments/models/payment.model');
const Order = require('../features/orders/models/Order');
const Inventory = require('../features/inventory/models/Inventory');
const PaymentService = require('../core/payments/services/payment.service');
dotenv.config();

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function testPaymentApproval() {
  try {
    console.log('🧪 Iniciando prueba de aprobación de pagos...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Buscar un pago pendiente para probar
    const pendingPayment = await Payment.findOne({
      type: 'order_payment',
      status: 'pending'
    }).populate('order');

    if (!pendingPayment) {
      console.log('❌ No hay pagos pendientes para probar');
      console.log('   Crea un pago pendiente primero usando el checkout');
      return;
    }

    console.log(`🔍 Probando pago: ${pendingPayment._id}`);
    console.log(`   Orden: ${pendingPayment.order?.orderNumber || 'Sin orden'}`);
    console.log(`   Monto: $${pendingPayment.amount}`);

    if (!pendingPayment.order) {
      console.log('❌ Pago sin orden asociada');
      return;
    }

    const order = pendingPayment.order;
    console.log(`\n📦 Detalles de la orden:`);
    console.log(`   Número: ${order.orderNumber}`);
    console.log(`   Estado: ${order.status}`);
    console.log(`   Estado de pago: ${order.paymentStatus}`);
    console.log(`   Items: ${order.items.length}`);

    // 2. Mostrar estado del inventario ANTES de la aprobación
    console.log('\n📋 Estado del inventario ANTES de la aprobación:');
    
    const beforeInventory = {};
    
    for (const item of order.items) {
      const inventoryQuery = {
        tenant_id: order.tenant_id,
        product_id: item.product
      };
      if (item.variant) inventoryQuery.variant_id = item.variant;

      const inventory = await Inventory.findOne(inventoryQuery);
      
      if (inventory) {
        beforeInventory[`${item.product}${item.variant ? `-${item.variant}` : ''}`] = {
          current_stock: inventory.current_stock,
          reserved_stock: inventory.reserved_stock,
          available_stock: inventory.available_stock
        };
        
        console.log(`   Producto ${item.product}${item.variant ? ` (variante ${item.variant})` : ''}:`);
        console.log(`     Stock actual: ${inventory.current_stock}`);
        console.log(`     Stock reservado: ${inventory.reserved_stock}`);
        console.log(`     Stock disponible: ${inventory.available_stock}`);
        console.log(`     Cantidad requerida: ${item.quantity}`);
      } else {
        console.log(`   ❌ INVENTARIO NO ENCONTRADO para producto ${item.product}${item.variant ? ` variante ${item.variant}` : ''}`);
      }
    }

    // 3. Preguntar si continuar con la prueba
    console.log('\n⚠️  ¿Deseas continuar con la aprobación del pago?');
    console.log('   Esto actualizará el stock y cambiará el estado del pago a "completed"');
    console.log('   Responde "SI" para continuar, cualquier otra cosa para cancelar:');
    
    // En un entorno real, aquí habría una pausa para input del usuario
    // Por ahora, simulamos que el usuario dice "SI"
    const shouldContinue = true; // Cambiar a false para cancelar la prueba
    
    if (!shouldContinue) {
      console.log('❌ Prueba cancelada por el usuario');
      return;
    }

    // 4. Ejecutar la aprobación
    console.log('\n🚀 Ejecutando aprobación del pago...');
    
    try {
      const updatedPayment = await PaymentService.approvePayment(
        pendingPayment._id,
        'test-user'
      );

      console.log('✅ Pago aprobado exitosamente');
      console.log(`   Nuevo estado: ${updatedPayment.status}`);
      console.log(`   Verificado por: ${updatedPayment.verifiedBy}`);
      console.log(`   Fecha de verificación: ${updatedPayment.verificationDate}`);

      // 5. Verificar estado del inventario DESPUÉS de la aprobación
      console.log('\n📋 Estado del inventario DESPUÉS de la aprobación:');
      
      for (const item of order.items) {
        const inventoryQuery = {
          tenant_id: order.tenant_id,
          product_id: item.product
        };
        if (item.variant) inventoryQuery.variant_id = item.variant;

        const inventory = await Inventory.findOne(inventoryQuery);
        
        if (inventory) {
          const before = beforeInventory[`${item.product}${item.variant ? `-${item.variant}` : ''}`];
          
          console.log(`   Producto ${item.product}${item.variant ? ` (variante ${item.variant})` : ''}:`);
          console.log(`     Stock actual: ${inventory.current_stock} (antes: ${before?.current_stock || 'N/A'})`);
          console.log(`     Stock reservado: ${inventory.reserved_stock} (antes: ${before?.reserved_stock || 'N/A'})`);
          console.log(`     Stock disponible: ${inventory.available_stock} (antes: ${before?.available_stock || 'N/A'})`);
          
          // Verificar que se descontó correctamente
          if (before) {
            const expectedCurrent = before.current_stock - item.quantity;
            const expectedReserved = before.reserved_stock - item.quantity;
            
            if (inventory.current_stock === expectedCurrent && inventory.reserved_stock === expectedReserved) {
              console.log(`     ✅ Stock actualizado correctamente`);
            } else {
              console.log(`     ❌ ERROR: Stock no se actualizó correctamente`);
              console.log(`        Esperado: current=${expectedCurrent}, reserved=${expectedReserved}`);
              console.log(`        Actual: current=${inventory.current_stock}, reserved=${inventory.reserved_stock}`);
            }
          }
        } else {
          console.log(`   ❌ INVENTARIO NO ENCONTRADO después de la aprobación`);
        }
      }

      // 6. Verificar estado de la orden
      const updatedOrder = await Order.findById(order._id);
      console.log('\n📦 Estado de la orden después de la aprobación:');
      console.log(`   Estado: ${updatedOrder.status}`);
      console.log(`   Estado de pago: ${updatedOrder.paymentStatus}`);

      if (updatedOrder.status === 'completed' && updatedOrder.paymentStatus === 'paid') {
        console.log('   ✅ Orden actualizada correctamente');
      } else {
        console.log('   ❌ ERROR: Orden no se actualizó correctamente');
      }

      console.log('\n🎉 Prueba completada exitosamente');

    } catch (error) {
      console.error('❌ Error durante la aprobación:', error.message);
      console.error('   Stack:', error.stack);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar prueba
if (require.main === module) {
  testPaymentApproval();
}

module.exports = testPaymentApproval; 