const mongoose = require('mongoose');
const Product = require('../../../features/products/models/Product');
const ProductVariant = require('../../../features/products/models/ProductVariant');
const Category = require('../../../features/products/models/Category');
const Tenant = require('../../../core/tenant/models/tenant.model');

describe('Products Module Tests', () => {
  let testTenantId, testTenant, testCategory;

  beforeEach(async () => {
    // Crear tenant de prueba
    testTenant = new Tenant({
      name: 'Test Tenant',
      isActive: true,
      publicProfile: {
        displayName: 'Test Tenant Display',
        description: 'Test tenant for products',
        contactEmail: 'test@example.com'
      }
    });
    await testTenant.save();
    testTenantId = testTenant._id;

    // Crear categoría de prueba
    testCategory = new Category({
      name: 'Test Category',
      description: 'Test category for products',
      tenantId: testTenantId,
      isActive: true
    });
    await testCategory.save();
  });

  afterEach(async () => {
    // Limpiar datos de prueba
    await Product.deleteMany({});
    await ProductVariant.deleteMany({});
    await Category.deleteMany({});
    await Tenant.deleteMany({});
  });

  describe('Product Creation and Management', () => {
    test('should create a new product successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        sku: 'TEST-001',
        basePrice: 29.99,
        baseCost: 15.00,
        tenantId: testTenantId,
        categories: [testCategory._id],
        isActive: true
      };

      const product = new Product(productData);
      await product.save();

      expect(product._id).toBeDefined();
      expect(product.name).toBe('Test Product');
      expect(product.sku).toBe('TEST-001');
      expect(product.basePrice).toBe(29.99);
      expect(product.tenantId.toString()).toBe(testTenantId.toString());
      expect(product.isActive).toBe(true);
    });

    test('should create product with variants', async () => {
      const product = new Product({
        name: 'Product with Variants',
        description: 'A product with multiple variants',
        sku: 'VARIANT-001',
        basePrice: 50.00,
        hasVariants: true,
        variantOptions: [
          { name: 'Color', values: ['Red', 'Blue', 'Green'] },
          { name: 'Size', values: ['S', 'M', 'L'] }
        ],
        tenantId: testTenantId
      });
      await product.save();

      // Crear variantes
      const variant1 = new ProductVariant({
        productId: product._id,
        sku: 'VARIANT-001-RED-S',
        name: 'Red Small',
        price: 50.00,
        attributes: { Color: 'Red', Size: 'S' },
        tenantId: testTenantId
      });
      await variant1.save();

      const variant2 = new ProductVariant({
        productId: product._id,
        sku: 'VARIANT-001-BLUE-M',
        name: 'Blue Medium',
        price: 55.00,
        attributes: { Color: 'Blue', Size: 'M' },
        tenantId: testTenantId
      });
      await variant2.save();

      expect(product.hasVariants).toBe(true);
      expect(product.variantOptions).toHaveLength(2);
    });

    test('should not create product with duplicate SKU in same tenant', async () => {
      const product1 = new Product({
        name: 'Product 1',
        sku: 'DUPLICATE-001',
        basePrice: 25.00,
        tenantId: testTenantId
      });
      await product1.save();

      const product2 = new Product({
        name: 'Product 2',
        sku: 'DUPLICATE-001',
        basePrice: 30.00,
        tenantId: testTenantId
      });

      await expect(product2.save()).rejects.toThrow();
    });

    test('should allow same SKU in different tenants', async () => {
      // Crear segundo tenant con nombre único
      const tenant2 = new Tenant({
        name: 'Test Tenant 2 Unique',
        isActive: true,
        publicProfile: {
          displayName: 'Test Tenant 2 Display',
          description: 'Second test tenant',
          contactEmail: 'test2@example.com'
        }
      });
      await tenant2.save();

      const product1 = new Product({
        name: 'Product 1',
        sku: 'SAME-SKU-001',
        basePrice: 25.00,
        tenantId: testTenantId
      });
      await product1.save();

      const product2 = new Product({
        name: 'Product 2',
        sku: 'SAME-SKU-001',
        basePrice: 30.00,
        tenantId: tenant2._id
      });
      await product2.save();

      expect(product1._id).not.toEqual(product2._id);
      expect(product1.sku).toBe(product2.sku);
    });

    test('should create digital product with required fields', async () => {
      const product = new Product({
        name: 'Digital Product',
        description: 'A digital download product',
        sku: 'DIGITAL-001',
        basePrice: 9.99,
        isDigital: true,
        digitalDetails: {
          downloadUrl: 'https://example.com/download/file.pdf',
          fileSize: '2.5MB',
          fileType: 'PDF'
        },
        tenantId: testTenantId
      });
      await product.save();

      expect(product.isDigital).toBe(true);
      expect(product.digitalDetails.downloadUrl).toBe('https://example.com/download/file.pdf');
    });
  });

  describe('Product Queries', () => {
    beforeEach(async () => {
      // Crear productos de prueba
      const products = [
        {
          name: 'Active Product 1',
          sku: 'ACTIVE-001',
          basePrice: 25.00,
          tenantId: testTenantId,
          isActive: true
        },
        {
          name: 'Active Product 2',
          sku: 'ACTIVE-002',
          basePrice: 35.00,
          tenantId: testTenantId,
          isActive: true
        },
        {
          name: 'Inactive Product',
          sku: 'INACTIVE-001',
          basePrice: 45.00,
          tenantId: testTenantId,
          isActive: false
        }
      ];

      for (const productData of products) {
        const product = new Product(productData);
        await product.save();
      }
    });

    test('should find all active products for tenant', async () => {
      const activeProducts = await Product.find({
        tenantId: testTenantId,
        isActive: true
      });

      expect(activeProducts).toHaveLength(2);
      expect(activeProducts.every(p => p.isActive)).toBe(true);
    });

    test('should find product by SKU', async () => {
      const product = await Product.findBySku(testTenantId, 'ACTIVE-001');
      
      expect(product).toBeDefined();
      expect(product.sku).toBe('ACTIVE-001');
      expect(product.name).toBe('Active Product 1');
    });

    test('should update product successfully', async () => {
      const product = await Product.findOne({ sku: 'ACTIVE-001' });
      product.name = 'Updated Product Name';
      product.basePrice = 30.00;
      await product.save();

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.name).toBe('Updated Product Name');
      expect(updatedProduct.basePrice).toBe(30.00);
    });

    test('should delete product successfully', async () => {
      const product = await Product.findOne({ sku: 'ACTIVE-001' });
      await Product.findByIdAndDelete(product._id);

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('Product Validation', () => {
    test('should require tenantId field', async () => {
      const product = new Product({
        name: 'Test Product',
        sku: 'TEST-001',
        basePrice: 25.00
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should require name field', async () => {
      const product = new Product({
        sku: 'TEST-001',
        basePrice: 25.00,
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should require sku field', async () => {
      const product = new Product({
        name: 'Test Product',
        basePrice: 25.00,
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should require basePrice field', async () => {
      const product = new Product({
        name: 'Test Product',
        sku: 'TEST-001',
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should validate name length', async () => {
      const product = new Product({
        name: 'A', // Too short
        sku: 'TEST-001',
        basePrice: 25.00,
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should validate sku length', async () => {
      const product = new Product({
        name: 'Test Product',
        sku: 'AB', // Too short
        basePrice: 25.00,
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should validate basePrice is not negative', async () => {
      const product = new Product({
        name: 'Test Product',
        sku: 'TEST-001',
        basePrice: -10.00,
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });

    test('should validate digital product has downloadUrl', async () => {
      const product = new Product({
        name: 'Digital Product',
        sku: 'DIGITAL-001',
        basePrice: 9.99,
        isDigital: true,
        // Missing downloadUrl
        tenantId: testTenantId
      });

      await expect(product.save()).rejects.toThrow();
    });
  });

  describe('Product Methods', () => {
    test('should calculate base profit margin correctly', async () => {
      const product = new Product({
        name: 'Test Product',
        sku: 'TEST-001',
        basePrice: 100.00,
        baseCost: 60.00,
        tenantId: testTenantId
      });
      await product.save();

      expect(product.baseProfitMargin).toBe(40); // (100-60)/100 * 100 = 40%
    });

    test('should deactivate product and its variants', async () => {
      const product = new Product({
        name: 'Product with Variants',
        sku: 'VARIANT-001',
        basePrice: 50.00,
        hasVariants: true,
        tenantId: testTenantId
      });
      await product.save();

      // Crear variantes
      const variant1 = new ProductVariant({
        productId: product._id,
        sku: 'VARIANT-001-A',
        name: 'Variant A',
        price: 50.00,
        tenantId: testTenantId
      });
      await variant1.save();

      const variant2 = new ProductVariant({
        productId: product._id,
        sku: 'VARIANT-001-B',
        name: 'Variant B',
        price: 55.00,
        tenantId: testTenantId
      });
      await variant2.save();

      await product.deactivate();

      expect(product.isActive).toBe(false);
      
      const updatedVariant1 = await ProductVariant.findById(variant1._id);
      const updatedVariant2 = await ProductVariant.findById(variant2._id);
      expect(updatedVariant1.isActive).toBe(false);
      expect(updatedVariant2.isActive).toBe(false);
    });

    test('should get current price for product without variants', async () => {
      const product = new Product({
        name: 'Simple Product',
        sku: 'SIMPLE-001',
        basePrice: 25.00,
        tenantId: testTenantId
      });
      await product.save();

      const currentPrice = await product.getCurrentPrice();
      expect(currentPrice).toBe(25.00);
    });

    test('should get current price for product with default variant', async () => {
      const product = new Product({
        name: 'Product with Default Variant',
        sku: 'DEFAULT-001',
        basePrice: 50.00,
        hasVariants: true,
        tenantId: testTenantId
      });
      await product.save();

      const variant = new ProductVariant({
        productId: product._id,
        sku: 'DEFAULT-001-V1',
        name: 'Default Variant',
        price: 55.00,
        tenantId: testTenantId
      });
      await variant.save();

      product.defaultVariantId = variant._id;
      await product.save();

      const currentPrice = await product.getCurrentPrice();
      expect(currentPrice).toBe(55.00);
    });
  });

  describe('Product Virtuals', () => {
    test('should populate variants virtual', async () => {
      const product = new Product({
        name: 'Product with Variants',
        sku: 'VIRTUAL-001',
        basePrice: 50.00,
        hasVariants: true,
        tenantId: testTenantId
      });
      await product.save();

      const variant1 = new ProductVariant({
        productId: product._id,
        sku: 'VIRTUAL-001-A',
        name: 'Variant A',
        price: 50.00,
        tenantId: testTenantId
      });
      await variant1.save();

      const variant2 = new ProductVariant({
        productId: product._id,
        sku: 'VIRTUAL-001-B',
        name: 'Variant B',
        price: 55.00,
        tenantId: testTenantId
      });
      await variant2.save();

      const populatedProduct = await Product.findById(product._id).populate('variants');
      
      expect(populatedProduct.variants).toHaveLength(2);
      expect(populatedProduct.variants[0].sku).toBe('VIRTUAL-001-A');
      expect(populatedProduct.variants[1].sku).toBe('VIRTUAL-001-B');
    });
  });
}); 