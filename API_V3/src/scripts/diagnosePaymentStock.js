const mongoose = require('mongoose');
const Payment = require('../core/payments/models/payment.model');
const Order = require('../features/orders/models/Order');
const Inventory = require('../features/inventory/models/Inventory');
const PaymentService = require('../core/payments/services/payment.service');
const dotenv = require('dotenv');
dotenv.config();

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI;

async function diagnosePaymentStock() {
  try {
    console.log('🔍 Iniciando diagnóstico de actualización de stock en pagos...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    // 1. Buscar pagos de órdenes pendientes
    const pendingPayments = await Payment.find({
      type: 'order_payment',
      status: 'pending'
    }).populate('order');

    console.log(`📊 Encontrados ${pendingPayments.length} pagos pendientes de órdenes\n`);

    if (pendingPayments.length === 0) {
      console.log('❌ No hay pagos pendientes para diagnosticar');
      return;
    }

    // 2. Analizar cada pago pendiente
    for (const payment of pendingPayments) {
      console.log(`\n🔍 Analizando pago: ${payment._id}`);
      console.log(`   Orden: ${payment.order?._id || 'Sin orden'}`);
      console.log(`   Monto: $${payment.amount}`);
      console.log(`   Estado: ${payment.status}`);

      if (!payment.order) {
        console.log('   ❌ Pago sin orden asociada');
        continue;
      }

      const order = payment.order;
      console.log(`   📦 Orden: ${order.orderNumber}`);
      console.log(`   Estado de orden: ${order.status}`);
      console.log(`   Estado de pago de orden: ${order.paymentStatus}`);

      // 3. Verificar inventario para cada item
      console.log('   📋 Verificando inventario de items:');
      
      for (const item of order.items) {
        console.log(`     Producto: ${item.product}`);
        console.log(`     Variante: ${item.variant || 'Sin variante'}`);
        console.log(`     Cantidad: ${item.quantity}`);

        // Buscar inventario
        const inventoryQuery = {
          tenant_id: order.tenant_id,
          product_id: item.product
        };

        if (item.variant) {
          inventoryQuery.variant_id = item.variant;
        }

        const inventory = await Inventory.findOne(inventoryQuery);
        
        if (!inventory) {
          console.log(`     ❌ INVENTARIO NO ENCONTRADO`);
          console.log(`        Query: ${JSON.stringify(inventoryQuery)}`);
        } else {
          console.log(`     ✅ Inventario encontrado:`);
          console.log(`        Stock actual: ${inventory.current_stock}`);
          console.log(`        Stock reservado: ${inventory.reserved_stock}`);
          console.log(`        Stock disponible: ${inventory.available_stock}`);
          
          const hasEnoughStock = inventory.current_stock >= item.quantity;
          const hasEnoughReserved = inventory.reserved_stock >= item.quantity;
          
          console.log(`        ¿Suficiente stock actual? ${hasEnoughStock ? '✅' : '❌'}`);
          console.log(`        ¿Suficiente stock reservado? ${hasEnoughReserved ? '✅' : '❌'}`);
          
          if (!hasEnoughStock || !hasEnoughReserved) {
            console.log(`        ⚠️  PROBLEMA: No hay suficiente stock para aprobar el pago`);
          }
        }
      }

      // 4. Simular aprobación para ver qué pasaría
      console.log('   🧪 Simulando aprobación...');
      try {
        // Crear una sesión para simular
        const session = await mongoose.startSession();
        session.startTransaction();

        // Verificar inventario antes de actualizar (como lo hace el método real)
        const inventoryChecks = await Promise.all(order.items.map(async item => {
          const query = {
            tenant_id: order.tenant_id,
            product_id: item.product,
          };
          if (item.variant) query.variant_id = item.variant;
          const inventory = await Inventory.findOne(query).session(session);
          return {
            productId: item.product ? item.product.toString() : 'null',
            variantId: item.variant ? item.variant.toString() : '',
            required: item.quantity,
            available: inventory?.current_stock ?? 0,
            reserved: inventory?.reserved_stock ?? 0,
            hasStock: inventory && inventory.current_stock >= item.quantity && inventory.reserved_stock >= item.quantity,
            found: !!inventory
          };
        }));

        const insufficientStock = inventoryChecks.filter(check => !check.hasStock);
        
        if (insufficientStock.length > 0) {
          console.log('     ❌ SIMULACIÓN FALLIDA: Stock insuficiente');
          insufficientStock.forEach(item => {
            console.log(`        Producto ${item.productId}: necesita ${item.required}, disponible ${item.available}, reservado ${item.reserved}`);
          });
        } else {
          console.log('     ✅ SIMULACIÓN EXITOSA: Hay suficiente stock para aprobar');
        }

        await session.abortTransaction();
        session.endSession();
      } catch (error) {
        console.log(`     ❌ ERROR en simulación: ${error.message}`);
      }
    }

    // 5. Verificar pagos recientemente aprobados
    console.log('\n📊 Verificando pagos aprobados recientemente...');
    
    const recentCompletedPayments = await Payment.find({
      type: 'order_payment',
      status: 'completed',
      verificationDate: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
    }).populate('order');

    console.log(`Encontrados ${recentCompletedPayments.length} pagos completados en las últimas 24 horas`);

    for (const payment of recentCompletedPayments) {
      if (!payment.order) continue;
      
      console.log(`\n✅ Pago completado: ${payment._id}`);
      console.log(`   Orden: ${payment.order.orderNumber}`);
      console.log(`   Verificado por: ${payment.verifiedBy}`);
      console.log(`   Fecha: ${payment.verificationDate}`);
      
      // Verificar si el inventario se actualizó correctamente
      for (const item of payment.order.items) {
        const inventoryQuery = {
          tenant_id: payment.order.tenant_id,
          product_id: item.product
        };
        if (item.variant) inventoryQuery.variant_id = item.variant;
        
        const inventory = await Inventory.findOne(inventoryQuery);
        if (inventory) {
          console.log(`   📦 Producto ${item.product}: stock actual ${inventory.current_stock}, reservado ${inventory.reserved_stock}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar diagnóstico
if (require.main === module) {
  diagnosePaymentStock();
}

module.exports = diagnosePaymentStock; 