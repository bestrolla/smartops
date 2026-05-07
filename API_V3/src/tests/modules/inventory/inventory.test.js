const mongoose = require('mongoose');
const Product = require('../../../features/products/models/Product');
const ProductVariant = require('../../../features/products/models/ProductVariant');
const Inventory = require('../../../features/inventory/models/Inventory');

describe('Inventory Module Tests', () => {
  let testTenantId, testProduct, testVariant;

  beforeEach(async () => {
    testTenantId = 'test-tenant-123';
    
    // Crear producto de prueba sin variantes para evitar creación automática de inventario
    testProduct = new Product({
      tenantId: testTenantId,
      name: 'Test Product',
      description: 'Product for testing inventory',
      sku: 'INVENTORY-PRODUCT-001',
      basePrice: 50.00,
      baseCost: 25.00,
      hasVariants: false, // Cambiado a false para evitar creación automática de inventario
      isActive: true
    });
    await testProduct.save();

    // No crear variante automáticamente - se creará solo cuando sea necesario en tests específicos
  });

  describe('Inventory Creation and Management', () => {
    test('should create inventory for product with variant', async () => {
      // Crear variante explícitamente para este test
      testVariant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 20,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await testVariant.save();

      const inventoryData = {
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id,
        current_stock: 25,
        reserved_stock: 5,
        low_stock_threshold: 10,
        high_stock_threshold: 100,
        location: 'Warehouse A',
        metadata: {
          supplier: 'Supplier A',
          last_restock_date: new Date()
        }
      };

      const inventory = new Inventory(inventoryData);
      await inventory.save();

      expect(inventory._id).toBeDefined();
      expect(inventory.tenant_id).toBe(testTenantId);
      expect(inventory.product_id.toString()).toBe(testProduct._id.toString());
      expect(inventory.variant_id.toString()).toBe(testVariant._id.toString());
      expect(inventory.current_stock).toBe(25);
      expect(inventory.reserved_stock).toBe(5);
      expect(inventory.low_stock_threshold).toBe(10);
      expect(inventory.high_stock_threshold).toBe(100);
      expect(inventory.location).toBe('Warehouse A');
    });

    test('should create inventory for product without variant', async () => {
      // Crear producto sin variantes
      const simpleProduct = new Product({
        tenantId: testTenantId,
        name: 'Simple Product',
        sku: 'SIMPLE-001',
        basePrice: 30.00,
        hasVariants: false,
        isActive: true
      });
      await simpleProduct.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: simpleProduct._id,
        variant_id: null,
        current_stock: 50,
        reserved_stock: 0,
        location: 'Main Warehouse'
      });
      await inventory.save();

      expect(inventory.variant_id).toBeNull();
      expect(inventory.current_stock).toBe(50);
    });

    test('should not create duplicate inventory for same product-variant combination', async () => {
      // Crear variante explícitamente para este test
      testVariant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-002',
        options: [{ name: 'Size', value: 'M' }],
        price: 60.00,
        stock: 15,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await testVariant.save();

      const inventory1 = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id,
        current_stock: 20,
        reserved_stock: 0
      });
      await inventory1.save();

      const inventory2 = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id,
        current_stock: 30,
        reserved_stock: 0
      });

      await expect(inventory2.save()).rejects.toThrow();
    });

    test('should allow same product-variant in different tenants', async () => {
      const tenant2Id = 'test-tenant-456';
      
      // Crear producto y variante para el segundo tenant
      const product2 = new Product({
        tenantId: tenant2Id,
        name: 'Test Product 2',
        description: 'Product for second tenant',
        sku: 'INVENTORY-PRODUCT-002',
        basePrice: 60.00,
        baseCost: 30.00,
        hasVariants: false,
        isActive: true
      });
      await product2.save();

      // Crear variante para el segundo tenant
      const variant2 = new ProductVariant({
        tenantId: tenant2Id,
        productId: product2._id,
        sku: 'INVENTORY-VARIANT-003',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 65.00,
        stock: 25,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant2.save();

      // Crear variante para el primer tenant (usando el producto existente)
      testVariant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-004',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 20,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await testVariant.save();
      
      const inventory1 = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id,
        current_stock: 20,
        reserved_stock: 0
      });
      await inventory1.save();

      const inventory2 = new Inventory({
        tenant_id: tenant2Id,
        product_id: product2._id,
        variant_id: variant2._id,
        current_stock: 30,
        reserved_stock: 0
      });
      await inventory2.save();

      expect(inventory1._id).not.toBe(inventory2._id);
    });
  });

  describe('Inventory Queries', () => {
    beforeEach(async () => {
      // Crear variantes explícitamente para estos tests
      const variant1 = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-QUERIES-1',
        options: [{ name: 'Color', value: 'Green' }],
        price: 70.00,
        stock: 30,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant1.save();

      const variant2 = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-QUERIES-2',
        options: [{ name: 'Size', value: 'L' }],
        price: 75.00,
        stock: 25,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant2.save();

      // Crear inventarios de prueba
      const inventories = [
        {
          tenant_id: testTenantId,
          product_id: testProduct._id,
          variant_id: variant1._id,
          current_stock: 25,
          reserved_stock: 5,
          location: 'Warehouse A'
        },
        {
          tenant_id: testTenantId,
          product_id: testProduct._id,
          variant_id: null,
          current_stock: 50,
          reserved_stock: 10,
          location: 'Warehouse B'
        },
        {
          tenant_id: testTenantId,
          product_id: testProduct._id,
          variant_id: variant2._id,
          current_stock: 5,
          reserved_stock: 0,
          location: 'Warehouse C'
        }
      ];

      for (const inventoryData of inventories) {
        const inventory = new Inventory(inventoryData);
        await inventory.save();
      }

      // Guardar referencia a la primera variante para los tests
      testVariant = variant1;
    });

    test('should find inventory by product and variant', async () => {
      const inventory = await Inventory.findOne({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id
      });

      expect(inventory).toBeDefined();
      expect(inventory.current_stock).toBe(25);
      expect(inventory.reserved_stock).toBe(5);
    });

    test('should find inventory by location', async () => {
      const warehouseAInventory = await Inventory.find({
        tenant_id: testTenantId,
        location: 'Warehouse A'
      });

      expect(warehouseAInventory).toHaveLength(1);
      expect(warehouseAInventory[0].location).toBe('Warehouse A');
    });

    test('should find low stock inventory', async () => {
      const lowStockInventory = await Inventory.find({
        tenant_id: testTenantId,
        current_stock: { $lte: 10 }
      });

      expect(lowStockInventory).toHaveLength(1);
      expect(lowStockInventory[0].current_stock).toBe(5);
    });

    test('should update inventory successfully', async () => {
      const inventory = await Inventory.findOne({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: testVariant._id
      });
      
      inventory.current_stock = 40;
      inventory.reserved_stock = 8;
      inventory.location = 'Updated Warehouse';
      await inventory.save();

      const updatedInventory = await Inventory.findById(inventory._id);
      expect(updatedInventory.current_stock).toBe(40);
      expect(updatedInventory.reserved_stock).toBe(8);
      expect(updatedInventory.location).toBe('Updated Warehouse');
    });
  });

  describe('Inventory Validation', () => {
    test('should require tenant_id field', async () => {
      const inventory = new Inventory({
        product_id: testProduct._id,
        variant_id: null,
        current_stock: 20,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow();
    });

    test('should require product_id field', async () => {
      const inventory = new Inventory({
        tenant_id: testTenantId,
        variant_id: null,
        current_stock: 20,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow();
    });

    test('should validate current_stock is not negative', async () => {
      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: null,
        current_stock: -5,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow();
    });

    test('should validate reserved_stock is not negative', async () => {
      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: null,
        current_stock: 20,
        reserved_stock: -3
      });

      await expect(inventory.save()).rejects.toThrow();
    });

    test('should validate stock values are integers', async () => {
      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: null,
        current_stock: 20.5,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow();
    });

    test('should validate thresholds are integers', async () => {
      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: null,
        current_stock: 20,
        reserved_stock: 0,
        low_stock_threshold: 5.5
      });

      await expect(inventory.save()).rejects.toThrow();
    });
  });

  describe('Inventory Virtuals', () => {
    test('should calculate available_stock correctly', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-VIRTUALS-1',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 20,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 5
      });
      await inventory.save();

      expect(inventory.available_stock).toBe(20);
    });

    test('should calculate available_stock when reserved exceeds current', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-VIRTUALS-2',
        options: [{ name: 'Size', value: 'L' }],
        price: 60.00,
        stock: 15,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 10,
        reserved_stock: 15
      });
      await inventory.save();

      expect(inventory.available_stock).toBe(0);
    });

    test('should determine stock_status as low', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-VIRTUALS-3',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 65.00,
        stock: 10,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 3,
        reserved_stock: 0,
        low_stock_threshold: 5
      });
      await inventory.save();

      expect(inventory.stock_status).toBe('low');
    });

    test('should determine stock_status as high', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-VIRTUALS-4',
        options: [{ name: 'Size', value: 'XL' }],
        price: 70.00,
        stock: 25,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 150,
        reserved_stock: 0,
        high_stock_threshold: 100
      });
      await inventory.save();

      expect(inventory.stock_status).toBe('high');
    });

    test('should determine stock_status as normal', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-VIRTUALS-5',
        options: [{ name: 'Color', value: 'Green' }],
        price: 75.00,
        stock: 30,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 50,
        reserved_stock: 0,
        low_stock_threshold: 5,
        high_stock_threshold: 100
      });
      await inventory.save();

      expect(inventory.stock_status).toBe('normal');
    });
  });

  describe('Inventory Methods', () => {
    test('should reserve stock successfully', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-METHODS-1',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 20,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 5
      });
      await inventory.save();

      const availableStock = await inventory.reserveStock(10);

      expect(inventory.reserved_stock).toBe(15);
      expect(availableStock).toBe(10);
    });

    test('should fail to reserve more than available stock', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-METHODS-2',
        options: [{ name: 'Size', value: 'M' }],
        price: 60.00,
        stock: 15,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 5
      });
      await inventory.save();

      await expect(inventory.reserveStock(25)).rejects.toThrow('No hay suficiente stock disponible');
    });

    test('should release reserved stock successfully', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-METHODS-3',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 65.00,
        stock: 10,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 10
      });
      await inventory.save();

      const availableStock = await inventory.releaseReservedStock(5);

      expect(inventory.reserved_stock).toBe(5);
      expect(availableStock).toBe(20);
    });

    test('should fail to release more than reserved stock', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-METHODS-4',
        options: [{ name: 'Size', value: 'L' }],
        price: 70.00,
        stock: 25,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 10
      });
      await inventory.save();

      await expect(inventory.releaseReservedStock(15)).rejects.toThrow('La cantidad a liberar excede el stock reservado');
    });

    test('should confirm reserved stock successfully', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-METHODS-5',
        options: [{ name: 'Color', value: 'Green' }],
        price: 75.00,
        stock: 30,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 10
      });
      await inventory.save();

      const availableStock = await inventory.confirmReservedStock(5);

      expect(inventory.current_stock).toBe(20);
      expect(inventory.reserved_stock).toBe(5);
      expect(availableStock).toBe(15);
      expect(inventory.last_movement_date).toBeInstanceOf(Date);
    });

    test('should fail to confirm more than reserved stock', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-METHODS-6',
        options: [{ name: 'Size', value: 'XL' }],
        price: 80.00,
        stock: 35,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id,
        current_stock: 25,
        reserved_stock: 10
      });
      await inventory.save();

      await expect(inventory.confirmReservedStock(15)).rejects.toThrow('La cantidad a confirmar excede el stock reservado');
    });
  });

  describe('Inventory Integration with Products', () => {
    test('should validate product exists when creating inventory', async () => {
      // Crear variante explícitamente para este test
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-VARIANT-INTEGRATION-1',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 20,
        isActive: true,
        skipInventoryCreation: true // Evitar creación automática de inventario
      });
      await variant.save();

      const nonExistentProductId = new mongoose.Types.ObjectId();
      
      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: nonExistentProductId,
        variant_id: variant._id,
        current_stock: 20,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow('El producto no existe');
    });

    test('should validate variant exists when creating inventory with variant', async () => {
      const nonExistentVariantId = new mongoose.Types.ObjectId();
      
      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: nonExistentVariantId,
        current_stock: 20,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow('La variante no existe');
    });

    test('should require variant_id for products with variants', async () => {
      // Cambiar el producto a hasVariants: true para este test
      testProduct.hasVariants = true;
      await testProduct.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: null,
        current_stock: 20,
        reserved_stock: 0
      });

      await expect(inventory.save()).rejects.toThrow('Los productos con variantes deben tener un variant_id especificado');
    });

    test('should allow null variant_id for products without variants', async () => {
      const simpleProduct = new Product({
        tenantId: testTenantId,
        name: 'Simple Product',
        sku: 'SIMPLE-002',
        basePrice: 30.00,
        hasVariants: false,
        isActive: true
      });
      await simpleProduct.save();

      const inventory = new Inventory({
        tenant_id: testTenantId,
        product_id: simpleProduct._id,
        variant_id: null,
        current_stock: 20,
        reserved_stock: 0
      });
      await inventory.save();

      expect(inventory.variant_id).toBeNull();
    });
  });
}); 