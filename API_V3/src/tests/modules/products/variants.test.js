const mongoose = require('mongoose');
const Product = require('../../../features/products/models/Product');
const ProductVariant = require('../../../features/products/models/ProductVariant');
const Inventory = require('../../../features/inventory/models/Inventory');

describe('Product Variants Module Tests', () => {
  let testTenantId, testProduct;

  beforeEach(async () => {
    testTenantId = 'test-tenant-123';
    
    // Crear producto de prueba con variantes
    testProduct = new Product({
      tenantId: testTenantId,
      name: 'Test Product with Variants',
      description: 'Product for testing variants',
      sku: 'VARIANT-PRODUCT-001',
      basePrice: 50.00,
      baseCost: 25.00,
      hasVariants: true,
      variantOptions: [
        {
          name: 'Color',
          values: ['Red', 'Blue', 'Green']
        },
        {
          name: 'Size',
          values: ['S', 'M', 'L']
        }
      ],
      isActive: true
    });
    await testProduct.save();
  });

  describe('Variant Creation and Management', () => {
    test('should create a new variant successfully', async () => {
      const variantData = {
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'VARIANT-001-RED-S',
        options: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'S' }
        ],
        price: 55.00,
        cost: 27.50,
        stock: 10,
        isActive: true
      };

      const variant = new ProductVariant(variantData);
      await variant.save();

      expect(variant._id).toBeDefined();
      expect(variant.sku).toBe('VARIANT-001-RED-S');
      expect(variant.price).toBe(55.00);
      expect(variant.cost).toBe(27.50);
      expect(variant.stock).toBe(10);
      expect(variant.tenantId).toBe(testTenantId);
      expect(variant.productId.toString()).toBe(testProduct._id.toString());
      expect(variant.isActive).toBe(true);
    });

    test('should create variant with images', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'VARIANT-002-RED-M',
        options: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'M' }
        ],
        price: 60.00,
        stock: 15,
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ],
        isActive: true
      });
      await variant.save();

      expect(variant.images).toHaveLength(2);
      expect(variant.images[0]).toBe('https://example.com/image1.jpg');
    });

    test('should not create variant with duplicate SKU', async () => {
      const variant1 = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'DUPLICATE-SKU',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10
      });
      await variant1.save();

      const variant2 = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'DUPLICATE-SKU',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 60.00,
        stock: 15
      });

      await expect(variant2.save()).rejects.toThrow();
    });

    test('should allow same SKU in different tenants', async () => {
      const tenant2Id = 'test-tenant-456';
      
      const variant1 = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'SAME-SKU',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10
      });
      await variant1.save();

      const variant2 = new ProductVariant({
        tenantId: tenant2Id,
        productId: testProduct._id,
        sku: 'SAME-SKU',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 60.00,
        stock: 15
      });
      await variant2.save();

      expect(variant1._id).not.toBe(variant2._id);
    });

    test('should create variant with metadata', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'VARIANT-003-RED-L',
        options: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'L' }
        ],
        price: 65.00,
        stock: 20,
        metadata: {
          weight: '200g',
          material: 'Cotton',
          supplier: 'Supplier A'
        },
        isActive: true
      });
      await variant.save();

      expect(variant.metadata.weight).toBe('200g');
      expect(variant.metadata.material).toBe('Cotton');
      expect(variant.metadata.supplier).toBe('Supplier A');
    });
  });

  describe('Variant Queries', () => {
    beforeEach(async () => {
      // Crear variantes de prueba
      const variants = [
        {
          tenantId: testTenantId,
          productId: testProduct._id,
          sku: 'QUERY-001-RED',
          options: [{ name: 'Color', value: 'Red' }],
          price: 55.00,
          stock: 10,
          isActive: true
        },
        {
          tenantId: testTenantId,
          productId: testProduct._id,
          sku: 'QUERY-002-BLUE',
          options: [{ name: 'Color', value: 'Blue' }],
          price: 60.00,
          stock: 15,
          isActive: true
        },
        {
          tenantId: testTenantId,
          productId: testProduct._id,
          sku: 'QUERY-003-GREEN',
          options: [{ name: 'Color', value: 'Green' }],
          price: 65.00,
          stock: 0,
          isActive: false
        }
      ];

      for (const variantData of variants) {
        const variant = new ProductVariant(variantData);
        await variant.save();
      }
    });

    test('should find all active variants for product', async () => {
      const activeVariants = await ProductVariant.find({
        productId: testProduct._id,
        isActive: true
      });

      expect(activeVariants).toHaveLength(2);
      expect(activeVariants.every(variant => variant.isActive)).toBe(true);
    });

    test('should find variant by SKU and tenant', async () => {
      const variant = await ProductVariant.findOne({
        sku: 'QUERY-001-RED',
        tenantId: testTenantId
      });

      expect(variant).toBeDefined();
      expect(variant.sku).toBe('QUERY-001-RED');
    });

    test('should find variants by option value', async () => {
      const redVariants = await ProductVariant.find({
        'options.value': 'Red',
        tenantId: testTenantId
      });

      expect(redVariants).toHaveLength(1);
      expect(redVariants[0].options[0].value).toBe('Red');
    });

    test('should update variant successfully', async () => {
      const variant = await ProductVariant.findOne({ 
        sku: 'QUERY-001-RED', 
        tenantId: testTenantId 
      });
      
      variant.price = 70.00;
      variant.stock = 25;
      variant.isActive = false;
      await variant.save();

      const updatedVariant = await ProductVariant.findById(variant._id);
      expect(updatedVariant.price).toBe(70.00);
      expect(updatedVariant.stock).toBe(25);
      expect(updatedVariant.isActive).toBe(false);
    });

    test('should delete variant successfully', async () => {
      const variant = await ProductVariant.findOne({ 
        sku: 'QUERY-003-GREEN', 
        tenantId: testTenantId 
      });
      await ProductVariant.findByIdAndDelete(variant._id);

      const deletedVariant = await ProductVariant.findById(variant._id);
      expect(deletedVariant).toBeNull();
    });
  });

  describe('Variant Validation', () => {
    test('should require tenantId field', async () => {
      const variant = new ProductVariant({
        productId: testProduct._id,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should require productId field', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should require sku field', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should require price field', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should validate price is not negative', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: -10.00,
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should validate stock is not negative', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: -5
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should validate stock is integer', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10.5 // No entero
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should validate image URLs', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'TEST-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 10,
        images: ['invalid-url', 'https://example.com/valid.jpg']
      });

      await expect(variant.save()).rejects.toThrow();
    });
  });

  describe('Variant Methods', () => {
    test('should calculate profit margin correctly', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'MARGIN-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 100.00,
        cost: 60.00,
        stock: 10
      });
      await variant.save();

      expect(variant.profitMargin).toBe(40); // (100-60)/100 * 100 = 40%
    });

    test('should calculate profit margin with zero cost', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'MARGIN-002',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 100.00,
        cost: 0,
        stock: 10
      });
      await variant.save();

      expect(variant.profitMargin).toBe(100); // (100-0)/100 * 100 = 100%
    });
  });

  describe('Variant Inventory Integration', () => {
    test('should create inventory automatically when variant is created', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-001',
        options: [{ name: 'Color', value: 'Red' }],
        price: 55.00,
        stock: 25,
        isActive: true
      });
      await variant.save();

      // Verificar que se creó el inventario automáticamente
      const inventory = await Inventory.findOne({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id
      });

      expect(inventory).toBeDefined();
      expect(inventory.current_stock).toBe(25);
      expect(inventory.reserved_stock).toBe(0);
      expect(inventory.metadata.created_from).toBe('variant_creation');
    });

    test('should update inventory when variant stock changes', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-002',
        options: [{ name: 'Color', value: 'Blue' }],
        price: 60.00,
        stock: 10,
        isActive: true
      });
      await variant.save();

      // Actualizar stock de la variante
      variant.stock = 50;
      await variant.save();

      // Verificar que se actualizó el inventario
      const inventory = await Inventory.findOne({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id
      });

      expect(inventory.current_stock).toBe(50);
    });

    test('should include variant options in inventory metadata', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'INVENTORY-003',
        options: [
          { name: 'Color', value: 'Green' },
          { name: 'Size', value: 'L' }
        ],
        price: 65.00,
        stock: 15,
        isActive: true
      });
      await variant.save();

      const inventory = await Inventory.findOne({
        tenant_id: testTenantId,
        product_id: testProduct._id,
        variant_id: variant._id
      });

      expect(inventory.metadata.variant_options.Color).toBe('Green');
      expect(inventory.metadata.variant_options.Size).toBe('L');
    });
  });

  describe('Variant Options', () => {
    test('should handle multiple options correctly', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'OPTIONS-001',
        options: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'M' },
          { name: 'Material', value: 'Cotton' }
        ],
        price: 70.00,
        stock: 20,
        isActive: true
      });
      await variant.save();

      expect(variant.options).toHaveLength(3);
      expect(variant.options.find(opt => opt.name === 'Color').value).toBe('Red');
      expect(variant.options.find(opt => opt.name === 'Size').value).toBe('M');
      expect(variant.options.find(opt => opt.name === 'Material').value).toBe('Cotton');
    });

    test('should validate option name is required', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'OPTIONS-002',
        options: [
          { value: 'Red' } // Sin name
        ],
        price: 55.00,
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });

    test('should validate option value is required', async () => {
      const variant = new ProductVariant({
        tenantId: testTenantId,
        productId: testProduct._id,
        sku: 'OPTIONS-003',
        options: [
          { name: 'Color' } // Sin value
        ],
        price: 55.00,
        stock: 10
      });

      await expect(variant.save()).rejects.toThrow();
    });
  });
}); 