const mongoose = require('mongoose');
const Product = require('../../../features/products/models/Product');
const ProductVariant = require('../../../features/products/models/ProductVariant');
const Inventory = require('../../../features/inventory/models/Inventory');
const Cart = require('../../../features/ecommerce/models/Cart');
const Order = require('../../../features/orders/models/Order');
const Payment = require('../../../core/payments/models/payment.model');
const User = require('../../../core/auth/users/models/user.model');
const Role = require('../../../core/auth/roles/models/role.model');
const Tenant = require('../../../core/tenant/models/tenant.model');
const PaymentService = require('../../../core/payments/services/payment.service');

describe('Checkout Integration Tests', () => {
  let testTenantId, testProduct, testVariant, testUser, testRole, testTenant;
  let simpleProduct, simpleInventory;

  beforeEach(async () => {
    // Crear tenant de prueba
    const timestamp = Date.now();
    testTenant = new Tenant({
      name: `Test Tenant Checkout ${timestamp}`,
      isActive: true,
      publicProfile: {
        displayName: `Test Tenant Checkout Display ${timestamp}`,
        description: 'Test tenant for checkout',
        contactEmail: 'test@example.com'
      }
    });
    await testTenant.save();
    testTenantId = testTenant._id;
    
    // Crear rol de prueba
    testRole = new Role({
      name: 'Customer',
      displayName: 'Customer',
      description: 'Customer role',
      type: 'custom',
      permissions: [],
      tenantId: testTenantId,
      isActive: true,
      level: 1
    });
    await testRole.save();

    // Crear usuario de prueba
    testUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
      tenantId: testTenantId,
      roles: [testRole._id],
      isActive: true
    });
    await testUser.save();
    
    // Crear producto con variantes
    testProduct = new Product({
      tenantId: testTenantId.toString(),
      name: 'Test Product with Variants',
      description: 'Product for testing checkout with variants',
      sku: 'CHECKOUT-PRODUCT-001',
      basePrice: 50.00,
      baseCost: 25.00,
      hasVariants: true,
      isActive: true
    });
    await testProduct.save();

    // Crear variante
    testVariant = new ProductVariant({
      tenantId: testTenantId.toString(),
      productId: testProduct._id,
      sku: 'CHECKOUT-VARIANT-001',
      options: [{ name: 'Color', value: 'Red' }],
      price: 55.00,
      stock: 20,
      isActive: true,
      skipInventoryCreation: true
    });
    await testVariant.save();

    // Crear inventario para la variante
    const inventory = new Inventory({
      tenant_id: testTenantId.toString(),
      product_id: testProduct._id,
      variant_id: testVariant._id,
      current_stock: 20,
      reserved_stock: 0
    });
    await inventory.save();

    // Crear producto simple sin variantes
    simpleProduct = new Product({
      tenantId: testTenantId.toString(),
      name: 'Simple Product',
      description: 'Simple product for testing checkout',
      sku: 'CHECKOUT-SIMPLE-001',
      basePrice: 30.00,
      baseCost: 15.00,
      hasVariants: false,
      isActive: true
    });
    await simpleProduct.save();

    // Crear inventario para producto simple
    simpleInventory = new Inventory({
      tenant_id: testTenantId.toString(),
      product_id: simpleProduct._id,
      variant_id: null,
      current_stock: 15,
      reserved_stock: 0
    });
    await simpleInventory.save();
  });

  describe('Complete Checkout Flow', () => {
    test('should complete full checkout flow with variants and simple products', async () => {
      // 1. Crear carrito con múltiples items
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00,
            options: [{ name: 'Color', value: 'Red' }],
            variantInfo: {
              sku: 'CHECKOUT-VARIANT-001',
              variantOptions: [{ name: 'Color', value: 'Red' }]
            }
          },
          {
            product: simpleProduct._id,
            quantity: 3,
            price: 30.00
          }
        ],
        discount: 10.00
      });
      await cart.save();

      // Verificar carrito creado
      expect(cart.items).toHaveLength(2);
      expect(cart.subtotal).toBe(200.00); // (55 * 2) + (30 * 3)
      expect(cart.total).toBe(190.00); // 200 - 10

      // 2. Simular checkout (crear orden y pago)
      const subtotal = cart.subtotal;
      const tax = subtotal * 0.16; // 16% de impuesto
      const total = subtotal + tax;

      // Generar número de orden
      const lastOrder = await Order.findOne(
        { tenant_id: testTenantId.toString() },
        {},
        { sort: { orderNumber: -1 } }
      );
      const lastNumber = lastOrder ? parseInt(lastOrder.orderNumber.slice(3)) : 0;
      const orderNumber = `ORD${String(lastNumber + 1).padStart(6, '0')}`;

      // Crear orden
      const order = new Order({
        tenant_id: testTenantId.toString(),
        orderNumber,
        customer: testUser._id,
        items: cart.items.map(item => ({
          product: item.product,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
          status: 'pending',
          variantInfo: item.variantInfo || null
        })),
        subtotal,
        tax,
        total,
        paymentMethod: 'transfer',
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: {
          street: "Test Street",
          city: "Test City",
          state: "Test State",
          country: "Test Country",
          zipCode: "12345"
        }
      });
      await order.save();

      // Verificar orden creada
      expect(order.orderNumber).toBe(orderNumber);
      expect(order.total).toBe(total);
      expect(order.items).toHaveLength(2);
      expect(order.status).toBe('pending');
      expect(order.paymentStatus).toBe('pending');

      // 3. Crear pago directamente
      const payment = new Payment({
        tenant: testTenantId.toString(),
        user: testUser._id,
        order: order._id,
        amount: order.total,
        currency: 'USD',
        type: 'order_payment',
        method: 'transfer',
        transactionId: `TEST-${Date.now()}`,
        status: 'pending',
        metadata: {
          items: cart.items,
          cartTotal: order.total
        }
      });
      await payment.save();

      // Verificar pago creado
      expect(payment.status).toBe('pending');
      expect(payment.amount).toBe(order.total);
      expect(payment.order.toString()).toBe(order._id.toString());

      // 4. Verificar inventario antes de la aprobación
      const variantInventoryBefore = await Inventory.findOne({
        tenant_id: testTenantId.toString(),
        product_id: testProduct._id,
        variant_id: testVariant._id
      });
      const simpleInventoryBefore = await Inventory.findOne({
        tenant_id: testTenantId.toString(),
        product_id: simpleProduct._id,
        variant_id: null
      });

      expect(variantInventoryBefore.current_stock).toBe(20);
      expect(variantInventoryBefore.reserved_stock).toBe(0);
      expect(simpleInventoryBefore.current_stock).toBe(15);
      expect(simpleInventoryBefore.reserved_stock).toBe(0);

      // 4.1. Simular reserva de stock (esto normalmente se hace al crear la orden)
      await Inventory.updateOne(
        {
          tenant_id: testTenantId.toString(),
          product_id: testProduct._id,
          variant_id: testVariant._id
        },
        { $inc: { reserved_stock: 2 } }
      );
      await Inventory.updateOne(
        {
          tenant_id: testTenantId.toString(),
          product_id: simpleProduct._id,
          variant_id: null
        },
        { $inc: { reserved_stock: 3 } }
      );

      // 5. Aprobar pago (esto debería actualizar inventario)
      const PaymentServiceClass = require('../../../core/payments/services/payment.service').constructor;
      const approvedPayment = await PaymentServiceClass.approvePayment(
        payment._id,
        testUser._id
      );

      // Verificar pago aprobado
      expect(approvedPayment.status).toBe('completed');

      // 6. Verificar orden actualizada
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.status).toBe('completed');
      expect(updatedOrder.paymentStatus).toBe('paid');

      // 7. Verificar inventario actualizado
      const variantInventoryAfter = await Inventory.findOne({
        tenant_id: testTenantId.toString(),
        product_id: testProduct._id,
        variant_id: testVariant._id
      });
      const simpleInventoryAfter = await Inventory.findOne({
        tenant_id: testTenantId.toString(),
        product_id: simpleProduct._id,
        variant_id: null
      });

      // Verificar descuento en inventario de variante
      expect(variantInventoryAfter.current_stock).toBe(18); // 20 - 2
      expect(variantInventoryAfter.reserved_stock).toBe(0);

      // Verificar descuento en inventario simple
      expect(simpleInventoryAfter.current_stock).toBe(12); // 15 - 3
      expect(simpleInventoryAfter.reserved_stock).toBe(0);

      // 8. Verificar stock de variante actualizado
      const updatedVariant = await ProductVariant.findById(testVariant._id);
      expect(updatedVariant.stock).toBe(18); // 20 - 2

      // 9. Limpiar carrito manualmente (esto normalmente se hace en el controlador de checkout)
      await Cart.findByIdAndUpdate(cart._id, { items: [], total: 0 });

      // 10. Verificar carrito limpiado
      const updatedCart = await Cart.findById(cart._id);
      expect(updatedCart.items).toHaveLength(0);
      expect(updatedCart.total).toBe(0);
    });

    test('should handle checkout with insufficient stock', async () => {
      // Crear carrito con cantidad mayor al stock disponible
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 25, // Más del stock disponible (20)
            price: 55.00,
            options: [{ name: 'Color', value: 'Red' }]
          }
        ]
      });

      // Debería fallar al guardar el carrito
      await expect(cart.save()).rejects.toThrow('Stock insuficiente');
    });

    test('should handle checkout with inactive product', async () => {
      // Desactivar producto
      await Product.findByIdAndUpdate(testProduct._id, { isActive: false });

      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }
        ]
      });

      // Debería fallar al guardar el carrito
      await expect(cart.save()).rejects.toThrow('no está disponible');
    });

    test('should handle checkout with inactive variant', async () => {
      // Desactivar variante
      await ProductVariant.findByIdAndUpdate(testVariant._id, { isActive: false });

      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }
        ]
      });

      // Debería fallar al guardar el carrito
      await expect(cart.save()).rejects.toThrow('no está disponible');
    });

    test('should handle payment approval with insufficient reserved stock', async () => {
      // Crear carrito y orden normalmente
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00
          }
        ]
      });
      await cart.save();

      const order = new Order({
        tenant_id: testTenantId.toString(),
        orderNumber: 'ORD000001',
        customer: testUser._id,
        items: cart.items,
        subtotal: 110.00,
        tax: 17.60,
        total: 127.60,
        paymentMethod: 'transfer',
        status: 'pending',
        paymentStatus: 'pending'
      });
      await order.save();

      const payment = new Payment({
        tenant: testTenantId.toString(),
        user: testUser._id,
        order: order._id,
        amount: order.total,
        currency: 'USD',
        type: 'order_payment',
        method: 'transfer',
        transactionId: `TEST-${Date.now()}`,
        status: 'pending',
        metadata: {
          items: cart.items,
          cartTotal: order.total
        }
      });
      await payment.save();

      // Consumir todo el stock disponible antes de aprobar
      await Inventory.updateOne(
        {
          tenant_id: testTenantId.toString(),
          product_id: testProduct._id,
          variant_id: testVariant._id
        },
        { current_stock: 0 }
      );

      // Intentar aprobar el pago debería fallar
      const PaymentServiceClass = require('../../../core/payments/services/payment.service').constructor;
      await expect(
        PaymentServiceClass.approvePayment(payment._id, testUser._id)
      ).rejects.toThrow('Stock insuficiente');
    });
  });

  describe('Checkout Edge Cases', () => {
    test('should handle checkout with zero discount', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: simpleProduct._id,
            quantity: 1,
            price: 30.00
          }
        ],
        discount: 0
      });
      await cart.save();

      expect(cart.subtotal).toBe(30.00);
      expect(cart.total).toBe(30.00);
    });

    test('should handle checkout with maximum discount', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: simpleProduct._id,
            quantity: 1,
            price: 30.00
          }
        ],
        discount: 30.00 // Descuento igual al subtotal
      });
      await cart.save();

      expect(cart.subtotal).toBe(30.00);
      expect(cart.total).toBe(0); // Math.max(0, 30 - 30)
    });

    test('should handle checkout with coupon code', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }
        ],
        coupon: 'SAVE10',
        discount: 10.00
      });
      await cart.save();

      expect(cart.coupon).toBe('SAVE10');
      expect(cart.discount).toBe(10.00);
      expect(cart.subtotal).toBe(55.00);
      expect(cart.total).toBe(45.00);
    });
  });

  describe('Manual Order Flow', () => {
    test('should create manual order, approve payment, and discount inventory for variant and simple product', async () => {
      // Crear producto con variante y producto simple ya está hecho en beforeEach

      // 1. Crear orden manualmente
      const manualOrder = new Order({
        tenant_id: testTenantId.toString(),
        orderNumber: 'ORDMANUAL001',
        customer: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 4,
            price: 55.00,
            status: 'pending',
            variantInfo: {
              sku: 'CHECKOUT-VARIANT-001',
              variantOptions: [{ name: 'Color', value: 'Red' }]
            }
          },
          {
            product: simpleProduct._id,
            quantity: 2,
            price: 30.00,
            status: 'pending',
            variantInfo: {
              sku: 'CHECKOUT-SIMPLE-001',
              variantOptions: []
            }
          }
        ],
        subtotal: 220.00, // (55*4)+(30*2)
        tax: 35.20, // 16%
        total: 255.20,
        paymentMethod: 'transfer',
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress: {
          street: 'Manual St',
          city: 'Manual City',
          state: 'Manual State',
          country: 'Manual Country',
          zipCode: '99999'
        }
      });
      await manualOrder.save();

      // 2. Crear pago para la orden
      const payment = new Payment({
        tenant: testTenantId.toString(),
        user: testUser._id,
        order: manualOrder._id,
        amount: manualOrder.total,
        currency: 'USD',
        type: 'order_payment',
        method: 'transfer',
        transactionId: `MANUAL-${Date.now()}`,
        status: 'pending',
        metadata: {
          items: manualOrder.items,
          cartTotal: manualOrder.total
        }
      });
      await payment.save();

      // 3. Simular reserva de stock
      await Inventory.updateOne(
        {
          tenant_id: testTenantId.toString(),
          product_id: testProduct._id,
          variant_id: testVariant._id
        },
        { $inc: { reserved_stock: 4 } }
      );
      await Inventory.updateOne(
        {
          tenant_id: testTenantId.toString(),
          product_id: simpleProduct._id,
          variant_id: null
        },
        { $inc: { reserved_stock: 2 } }
      );

      // 4. Aprobar el pago
      const PaymentServiceClass = require('../../../core/payments/services/payment.service').constructor;
      const approvedPayment = await PaymentServiceClass.approvePayment(
        payment._id,
        testUser._id
      );
      expect(approvedPayment.status).toBe('completed');

      // 5. Verificar inventario y stock
      const variantInventory = await Inventory.findOne({
        tenant_id: testTenantId.toString(),
        product_id: testProduct._id,
        variant_id: testVariant._id
      });
      const simpleInventoryCheck = await Inventory.findOne({
        tenant_id: testTenantId.toString(),
        product_id: simpleProduct._id,
        variant_id: null
      });
      expect(variantInventory.current_stock).toBe(16); // 20 - 4
      expect(variantInventory.reserved_stock).toBe(0);
      expect(simpleInventoryCheck.current_stock).toBe(13); // 15 - 2
      expect(simpleInventoryCheck.reserved_stock).toBe(0);

      // 6. Verificar stock de la variante
      const updatedVariant = await ProductVariant.findById(testVariant._id);
      expect(updatedVariant.stock).toBe(16); // 20 - 4
    });
  });
}); 