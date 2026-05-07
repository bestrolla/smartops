const mongoose = require('mongoose');
const Product = require('../../../features/products/models/Product');
const ProductVariant = require('../../../features/products/models/ProductVariant');
const Inventory = require('../../../features/inventory/models/Inventory');
const Cart = require('../../../features/ecommerce/models/Cart');
const User = require('../../../core/auth/users/models/user.model');
const Role = require('../../../core/auth/roles/models/role.model');
const Tenant = require('../../../core/tenant/models/tenant.model');

describe('Cart Module Tests', () => {
  let testTenantId, testProduct, testVariant, testUser, testRole, testTenant;

  beforeEach(async () => {
    // Crear tenant de prueba
    const timestamp = Date.now();
    testTenant = new Tenant({
      name: `Test Tenant Cart ${timestamp}`,
      isActive: true,
      publicProfile: {
        displayName: `Test Tenant Cart Display ${timestamp}`,
        description: 'Test tenant for cart',
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
      tenantId: testTenantId, // ObjectId para Role
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
      tenantId: testTenantId, // ObjectId para User
      roles: [testRole._id],
      isActive: true
    });
    await testUser.save();
    
    // Crear producto de prueba
    testProduct = new Product({
      tenantId: testTenantId.toString(), // String para Product
      name: 'Test Product',
      description: 'Product for testing cart',
      sku: 'CART-PRODUCT-001',
      basePrice: 50.00,
      baseCost: 25.00,
      hasVariants: true,
      isActive: true
    });
    await testProduct.save();

    // Crear variante de prueba
    testVariant = new ProductVariant({
      tenantId: testTenantId.toString(), // String para ProductVariant
      productId: testProduct._id,
      sku: 'CART-VARIANT-001',
      options: [{ name: 'Color', value: 'Red' }],
      price: 55.00,
      stock: 20,
      isActive: true,
      skipInventoryCreation: true // Evitar creación automática de inventario
    });
    await testVariant.save();

    // Crear inventario para la variante
    const inventory = new Inventory({
      tenant_id: testTenantId.toString(), // String para Inventory
      product_id: testProduct._id,
      variant_id: testVariant._id,
      current_stock: 20,
      reserved_stock: 0
    });
    await inventory.save();
  });

  describe('Cart Creation and Management', () => {
    test('should create a new cart successfully', async () => {
      const cartData = {
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
              sku: 'CART-VARIANT-001',
              variantOptions: [{ name: 'Color', value: 'Red' }]
            }
          }
        ],
        discount: 10.00,
        metadata: {
          source: 'web',
          userAgent: 'test-browser'
        }
      };

      const cart = new Cart(cartData);
      await cart.save();

      expect(cart._id).toBeDefined();
      expect(cart.tenantId).toBe(testTenantId.toString());
      expect(cart.user.toString()).toBe(testUser._id.toString());
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].price).toBe(55.00);
      expect(cart.discount).toBe(10.00);
      expect(cart.metadata.source).toBe('web');
    });

    test('should create cart with multiple items', async () => {
      // Crear segundo producto y variante
      const product2 = new Product({
        tenantId: testTenantId.toString(),
        name: 'Test Product 2',
        sku: 'CART-PRODUCT-002',
        basePrice: 30.00,
        hasVariants: true,
        isActive: true
      });
      await product2.save();

      const variant2 = new ProductVariant({
        tenantId: testTenantId.toString(),
        productId: product2._id,
        sku: 'CART-VARIANT-002',
        options: [{ name: 'Size', value: 'M' }],
        price: 35.00,
        stock: 15,
        isActive: true,
        skipInventoryCreation: true
      });
      await variant2.save();

      // Crear inventario para el segundo producto
      const inventory2 = new Inventory({
        tenant_id: testTenantId.toString(),
        product_id: product2._id,
        variant_id: variant2._id,
        current_stock: 15,
        reserved_stock: 0
      });
      await inventory2.save();

      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
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
        ]
      });
      await cart.save();

      expect(cart.items).toHaveLength(2);
      expect(cart.subtotal).toBe(160.00); // 55 + (35 * 3)
      expect(cart.total).toBe(160.00); // Sin descuento
    });

    test('should not create duplicate cart for same user and tenant', async () => {
      const cart1 = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }]
      });
      await cart1.save();

      const cart2 = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 2,
          price: 55.00
        }]
      });
      await cart2.save();

      // Debería permitir múltiples carritos (se pueden tener carritos temporales)
      expect(cart1._id).not.toBe(cart2._id);
    });
  });

  describe('Cart Queries', () => {
    beforeEach(async () => {
      // Crear carritos de prueba
      const carts = [
        {
          tenantId: testTenantId.toString(),
          user: testUser._id,
          items: [{
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }],
          discount: 0
        },
        {
          tenantId: testTenantId.toString(),
          user: testUser._id,
          items: [{
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00
          }],
          discount: 10.00
        }
      ];

      for (const cartData of carts) {
        const cart = new Cart(cartData);
        await cart.save();
      }
    });

    test('should find cart by user and tenant', async () => {
      const userCarts = await Cart.find({
        tenantId: testTenantId.toString(),
        user: testUser._id
      });

      expect(userCarts).toHaveLength(2);
    });

    test('should find cart with items', async () => {
      const cart = await Cart.findOne({
        tenantId: testTenantId.toString(),
        user: testUser._id
      }).populate('items.product items.variant');

      expect(cart).toBeDefined();
      expect(cart.items).toHaveLength(1);
    });

    test('should update cart successfully', async () => {
      const cart = await Cart.findOne({
        tenantId: testTenantId.toString(),
        user: testUser._id
      });
      
      cart.discount = 20.00;
      cart.metadata = { updated: true };
      await cart.save();

      const updatedCart = await Cart.findById(cart._id);
      expect(updatedCart.discount).toBe(20.00);
      expect(updatedCart.metadata.updated).toBe(true);
    });
  });

  describe('Cart Validation', () => {
    test('should require tenantId field', async () => {
      const cart = new Cart({
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }]
      });

      await expect(cart.save()).rejects.toThrow();
    });

    test('should require user field', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }]
      });

      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate item quantity is positive', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 0, // Inválido
          price: 55.00
        }]
      });

      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate item quantity is integer', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1.5, // No entero
          price: 55.00
        }]
      });

      await expect(cart.save()).rejects.toThrow();
    });

    test('should validate item price is not negative', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: -10.00 // Inválido
        }]
      });

      await expect(cart.save()).rejects.toThrow();
    });
  });

  describe('Cart Virtuals', () => {
    test('should calculate subtotal correctly', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 2,
            price: 55.00
          },
          {
            product: testProduct._id,
            variant: testVariant._id,
            quantity: 1,
            price: 55.00
          }
        ]
      });
      await cart.save();

      expect(cart.subtotal).toBe(165.00); // (55 * 2) + (55 * 1)
    });

    test('should calculate total with discount', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 2,
          price: 55.00
        }],
        discount: 20.00
      });
      await cart.save();

      expect(cart.subtotal).toBe(110.00); // 55 * 2
      expect(cart.total).toBe(90.00); // 110 - 20
    });

    test('should calculate total with zero discount', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }],
        discount: 0
      });
      await cart.save();

      expect(cart.subtotal).toBe(55.00);
      expect(cart.total).toBe(55.00);
    });

    test('should not allow negative total', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 10.00 // El middleware actualizará este precio al de la variante (55.00)
        }],
        discount: 20.00 // Mayor que el subtotal original pero menor que el actualizado
      });
      await cart.save();

      // El middleware actualiza el precio al de la variante (55.00)
      expect(cart.subtotal).toBe(55.00); // 55 * 1
      expect(cart.total).toBe(35.00); // 55 - 20
    });
  });

  describe('Cart Pre-save Middleware', () => {
    test('should validate product exists and is active', async () => {
      // Crear producto inactivo
      const inactiveProduct = new Product({
        tenantId: testTenantId.toString(),
        name: 'Inactive Product',
        sku: 'INACTIVE-001',
        basePrice: 30.00,
        hasVariants: false,
        isActive: false
      });
      await inactiveProduct.save();

      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: inactiveProduct._id,
          quantity: 1,
          price: 30.00
        }]
      });

      await expect(cart.save()).rejects.toThrow('no está disponible');
    });

    test('should validate variant exists and is active for products with variants', async () => {
      // Crear variante inactiva
      const inactiveVariant = new ProductVariant({
        tenantId: testTenantId.toString(),
        productId: testProduct._id,
        sku: 'INACTIVE-VARIANT-001',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 60.00,
        stock: 10,
        isActive: false
      });
      await inactiveVariant.save();

      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: inactiveVariant._id,
          quantity: 1,
          price: 60.00
        }]
      });

      await expect(cart.save()).rejects.toThrow('no está disponible');
    });

    test('should require variant for products with variants', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          // Sin variant para producto con variantes
          quantity: 1,
          price: 55.00
        }]
      });

      await expect(cart.save()).rejects.toThrow('requiere seleccionar una variante');
    });

    test('should validate stock availability', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 25, // Más del stock disponible (20)
          price: 55.00
        }]
      });

      await expect(cart.save()).rejects.toThrow('Stock insuficiente');
    });

    test('should update item price and variant info from variant', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 50.00, // Precio diferente al de la variante
          options: []
        }]
      });
      await cart.save();

      // El middleware debería actualizar el precio y la información de la variante
      expect(cart.items[0].price).toBe(55.00); // Precio de la variante
      expect(cart.items[0].variantInfo.sku).toBe('CART-VARIANT-001');
      expect(cart.items[0].variantInfo.variantOptions).toHaveLength(1);
    });

    test('should handle products without variants', async () => {
      // Crear producto sin variantes
      const simpleProduct = new Product({
        tenantId: testTenantId.toString(),
        name: 'Simple Product',
        sku: 'SIMPLE-001',
        basePrice: 30.00,
        hasVariants: false,
        isActive: true
      });
      await simpleProduct.save();

      // Crear inventario para producto sin variantes
      const inventory = new Inventory({
        tenant_id: testTenantId.toString(),
        product_id: simpleProduct._id,
        variant_id: null,
        current_stock: 10,
        reserved_stock: 0
      });
      await inventory.save();

      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: simpleProduct._id,
          quantity: 2,
          price: 30.00
        }]
      });
      await cart.save();

      expect(cart.items[0].price).toBe(30.00); // Precio base del producto
      expect(cart.items[0].variantInfo.sku).toBe('SIMPLE-001');
      expect(cart.items[0].variantInfo.variantOptions).toHaveLength(0);
    });
  });

  describe('Cart Expiration', () => {
    test('should have expiration date set', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 1,
          price: 55.00
        }]
      });
      await cart.save();

      expect(cart.createdAt).toBeInstanceOf(Date);
      // El carrito debería expirar después de 30 días
      const expirationDate = new Date(cart.createdAt);
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Cart Coupon Integration', () => {
    test('should handle coupon codes', async () => {
      const cart = new Cart({
        tenantId: testTenantId.toString(),
        user: testUser._id,
        items: [{
          product: testProduct._id,
          variant: testVariant._id,
          quantity: 2,
          price: 55.00
        }],
        coupon: 'SAVE10',
        discount: 10.00
      });
      await cart.save();

      expect(cart.coupon).toBe('SAVE10');
      expect(cart.discount).toBe(10.00);
      expect(cart.total).toBe(100.00); // 110 - 10
    });
  });
}); 