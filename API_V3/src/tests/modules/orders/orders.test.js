const mongoose = require('mongoose');
const Product = require('../../../features/products/models/Product');
const ProductVariant = require('../../../features/products/models/ProductVariant');
const Inventory = require('../../../features/inventory/models/Inventory');
const Order = require('../../../features/orders/models/Order');
const User = require('../../../core/auth/users/models/user.model');
const Role = require('../../../core/auth/roles/models/role.model');
const Tenant = require('../../../core/tenant/models/tenant.model');

describe('Orders Module Tests', () => {
  let testTenantId, testProduct, testVariant, testUser, testRole, testTenant;

  beforeEach(async () => {
    // Crear tenant de prueba
    testTenant = new Tenant({
      name: 'Test Tenant Orders',
      isActive: true,
      publicProfile: {
        displayName: 'Test Tenant Orders Display',
        description: 'Test tenant for orders',
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
    
    // Crear producto de prueba
    testProduct = new Product({
      tenantId: testTenantId.toString(),
      name: 'Test Product',
      description: 'Product for testing orders',
      sku: 'ORDER-PRODUCT-001',
      basePrice: 50.00,
      baseCost: 25.00,
      hasVariants: true,
      isActive: true
    });
    await testProduct.save();

    // Crear variante de prueba
    testVariant = new ProductVariant({
      tenantId: testTenantId.toString(),
      productId: testProduct._id,
      sku: 'ORDER-VARIANT-001',
      options: [{ name: 'Color', value: 'Red' }],
      price: 55.00,
      stock: 20,
      isActive: true
    });
    await testVariant.save();

    // El inventario se crea automáticamente por el post-save hook de ProductVariant
  });

  describe('Order Creation and Management', () => {
    test('should create a new order successfully', async () => {
      const orderData = {
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00,
            options: [{ name: 'Color', value: 'Red' }],
            variantInfo: {
              sku: 'ORDER-VARIANT-001',
              variantOptions: [{ name: 'Color', value: 'Red' }]
            }
          }
        ],
        subtotal: 110.00,
        tax: 17.60,
        total: 127.60,
        paymentMethod: 'credit_card',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        }
      };

      const order = new Order(orderData);
      await order.save();

      expect(order._id).toBeDefined();
      expect(order.orderNumber).toBeDefined();
      expect(order.orderNumber).toMatch(/^ORD\d{6}$/);
      expect(order.tenant_id).toBe(testTenantId.toString());
      expect(order.customer.toString()).toBe(testUser._id.toString());
      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(2);
      expect(order.items[0].price).toBe(55.00);
      expect(order.subtotal).toBe(110.00);
      expect(order.tax).toBe(17.60);
      expect(order.total).toBe(127.60);
      expect(order.status).toBe('draft');
      expect(order.paymentStatus).toBe('pending');
    });

    test('should create order with multiple items', async () => {
      // Crear segundo producto y variante
      const product2 = new Product({
        tenantId: testTenantId.toString(),
        name: 'Test Product 2',
        sku: 'ORDER-PRODUCT-002',
        basePrice: 30.00,
        hasVariants: false,
        isActive: true
      });
      await product2.save();

      const variant2 = new ProductVariant({
        tenantId: testTenantId.toString(),
        productId: product2._id,
        sku: 'ORDER-VARIANT-002',
        options: [{ name: 'Size', value: 'M' }],
        price: 35.00,
        stock: 15,
        isActive: true
      });
      await variant2.save();

      // El inventario se crea automáticamente por el post-save hook de ProductVariant

      const order = new Order({
        tenant_id: testTenantId.toString(),
        customer: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00,
            options: [{ name: 'Color', value: 'Red' }]
          },
          {
            product: product2._id,
            variant: variant2._id,
            quantity: 3,
            price: 35.00,
            options: [{ name: 'Size', value: 'M' }]
          }
        ],
        subtotal: 160.00,
        tax: 25.60,
        total: 185.60,
        paymentMethod: 'debit_card'
      });
      await order.save();

      expect(order.items).toHaveLength(2);
      expect(order.subtotal).toBe(160.00);
      expect(order.total).toBe(185.60);
    });

    test('should generate unique order numbers', async () => {
      const order1 = new Order({
        tenant_id: testTenantId.toString(),
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });
      await order1.save();

      const order2 = new Order({
        tenant_id: testTenantId.toString(),
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });
      await order2.save();

      expect(order1.orderNumber).not.toBe(order2.orderNumber);
      expect(order1.orderNumber).toMatch(/^ORD\d{6}$/);
      expect(order2.orderNumber).toMatch(/^ORD\d{6}$/);
    });

    test('should calculate totals automatically when items change', async () => {
      const order = new Order({
        tenant_id: testTenantId.toString(),
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });
      await order.save();

      // Agregar un item
      order.items.push({
        product: testProduct._id,
        variant: testVariant._id,
        quantity: 2,
        price: 55.00
      });
      await order.save();

      expect(order.subtotal).toBe(165.00); // 55 + (55 * 2)
      expect(order.tax).toBeCloseTo(26.40, 2); // 165 * 0.16
      expect(order.total).toBeCloseTo(191.40, 2); // 165 + 26.40
    });
  });

  describe('Order Queries', () => {
    beforeEach(async () => {
      // Crear órdenes de prueba
      const orders = [
        {
          tenant_id: testTenantId.toString(),
          customer: testUser._id,
          items: [{
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }],
          subtotal: 55.00,
          tax: 8.80,
          total: 63.80,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: 'credit_card'
        },
        {
          tenant_id: testTenantId.toString(),
          customer: testUser._id,
          items: [{
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00
          }],
          subtotal: 110.00,
          tax: 17.60,
          total: 127.60,
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod: 'debit_card'
        },
        {
          tenant_id: testTenantId.toString(),
          customer: testUser._id,
          items: [{
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }],
          subtotal: 55.00,
          tax: 8.80,
          total: 63.80,
          status: 'cancelled',
          paymentStatus: 'failed',
          paymentMethod: 'cash'
        }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }
    });

    test('should find orders by status', async () => {
      const pendingOrders = await Order.find({
        tenant_id: testTenantId.toString(),
        status: 'pending'
      });

      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].status).toBe('pending');
    });

    test('should find orders by payment status', async () => {
      const paidOrders = await Order.find({
        tenant_id: testTenantId.toString(),
        paymentStatus: 'paid'
      });

      expect(paidOrders).toHaveLength(1);
      expect(paidOrders[0].paymentStatus).toBe('paid');
    });

    test('should find orders by customer', async () => {
      const customerOrders = await Order.find({
        tenant_id: testTenantId.toString(),
        customer: testUser._id
      });

      expect(customerOrders).toHaveLength(3);
    });

    test('should find orders by product', async () => {
      const productOrders = await Order.find({
        tenant_id: testTenantId.toString(),
        'items.product': testProduct._id
      });

      expect(productOrders).toHaveLength(3);
    });

    test('should update order successfully', async () => {
      const order = await Order.findOne({
        tenant_id: testTenantId.toString(),
        status: 'pending'
      });
      
      order.status = 'processing';
      order.paymentStatus = 'paid';
      await order.save();

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.status).toBe('processing');
      expect(updatedOrder.paymentStatus).toBe('paid');
    });
  });

  describe('Order Validation', () => {
    test('should require tenant_id field', async () => {
      const order = new Order({
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('should require customer field', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('should require items array', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'credit_card'
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('should require payment method', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('should validate item quantity is positive', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 0, // Inválido
          price: 55.00
        }],
        subtotal: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'credit_card'
      });

      await expect(order.save()).rejects.toThrow();
    });

    test('should validate item price is not negative', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: -10.00 // Inválido
        }],
        subtotal: -10.00,
        tax: 0,
        total: -10.00,
        paymentMethod: 'credit_card'
      });

      await expect(order.save()).rejects.toThrow();
    });
  });

  describe('Order Methods', () => {
    test('should reserve products successfully', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 5,
          price: 55.00
        }],
        subtotal: 275.00,
        tax: 44.00,
        total: 319.00,
        paymentMethod: 'credit_card'
      });
      await order.save();

      const result = await order.reserveProducts();

      expect(result).toBe(true);
      expect(order.status).toBe('processing');
      expect(order.items[0].status).toBe('reserved');
      expect(order.items[0].reservationId).toBeDefined();

      // Verificar que el inventario se actualizó
      const inventory = await Inventory.findOne({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id
      });

      expect(inventory.reserved_stock).toBe(5);
    });

    test('should fail to reserve when insufficient stock', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 25, // Más del stock disponible (20)
          price: 55.00
        }],
        subtotal: 1375.00,
        tax: 220.00,
        total: 1595.00,
        paymentMethod: 'credit_card'
      });
      await order.save();

      await expect(order.reserveProducts()).rejects.toThrow('Stock insuficiente');
    });

    test('should fail to reserve when inventory not found', async () => {
      // Crear producto sin inventario
      const productWithoutInventory = new Product({
        tenantId: testTenantId,
        name: 'Product Without Inventory',
        sku: 'NO-INVENTORY-001',
        basePrice: 30.00,
        hasVariants: false,
        isActive: true
      });
      await productWithoutInventory.save();

      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: productWithoutInventory._id,
          quantity: 1,
          price: 30.00
        }],
        subtotal: 30.00,
        tax: 4.80,
        total: 34.80,
        paymentMethod: 'credit_card'
      });
      await order.save();

      await expect(order.reserveProducts()).rejects.toThrow('Inventario no encontrado');
    });
  });

  describe('Order Item Status Management', () => {
    test('should track item status changes', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 2,
          price: 55.00,
          status: 'pending'
        }],
        subtotal: 110.00,
        tax: 17.60,
        total: 127.60,
        paymentMethod: 'credit_card'
      });
      await order.save();

      expect(order.items[0].status).toBe('pending');

      // Simular reserva
      order.items[0].status = 'reserved';
      await order.save();

      expect(order.items[0].status).toBe('reserved');
    });

    test('should generate unique reservation IDs', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          },
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00
          }
        ],
        subtotal: 165.00,
        tax: 26.40,
        total: 191.40,
        paymentMethod: 'credit_card'
      });
      await order.save();

      await order.reserveProducts();

      expect(order.items[0].reservationId).toBeDefined();
      expect(order.items[1].reservationId).toBeDefined();
      expect(order.items[0].reservationId).not.toBe(order.items[1].reservationId);
    });
  });

  describe('Order Payment Integration', () => {
    test('should handle payment status updates', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });
      await order.save();

      // Simular pago exitoso
      order.paymentStatus = 'paid';
      order.status = 'completed';
      await order.save();

      expect(order.paymentStatus).toBe('paid');
      expect(order.status).toBe('completed');
    });

    test('should handle payment failure', async () => {
      const order = new Order({
        tenant_id: testTenantId,
        customer: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        subtotal: 55.00,
        tax: 8.80,
        total: 63.80,
        paymentMethod: 'credit_card'
      });
      await order.save();

      // Simular fallo de pago
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();

      expect(order.paymentStatus).toBe('failed');
      expect(order.status).toBe('cancelled');
    });
  });
}); 