// features/products/services/productService.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const AppError = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

class ProductService {
  constructor(tenantId) {
    if (!tenantId) throw new AppError('Tenant ID es requerido', 400);
    this.tenantId = tenantId;
    logger.debug('ProductService inicializado', { tenantId });
  }

  async createProduct(productData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validar opciones de variantes si es necesario
      if (productData.hasVariants) {
        if (!Array.isArray(productData.variantOptions) || productData.variantOptions.length === 0) {
          throw new AppError('Se requieren opciones de variantes', 400);
        }

        // Validar estructura de las opciones
        productData.variantOptions.forEach(option => {
          if (!option.name || !Array.isArray(option.values) || option.values.length === 0) {
            throw new AppError('Formato inválido de opciones de variantes', 400);
          }
        });

        // Eliminar campos que no aplican a productos con variantes
        delete productData.stock;
      }

      // Crear el producto dentro de la transacción
      const product = await Product.create([{
        ...productData,
        tenantId: this.tenantId
      }], { session });

      await session.commitTransaction();
      return product[0];
    } catch (err) {
      await session.abortTransaction();
      
      if (err.code === 11000) {
        throw new AppError('El SKU ya existe', 400);
      }
      
      logger.error('Error al crear producto:', {
        error: err.message,
        stack: err.stack,
        productData
      });
      
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getProductById(productId, includeVariants = false) {
    logger.debug('Buscando producto por ID', { 
      productId: productId.toString(),
      tenantId: this.tenantId,
      includeVariants
    });

    const query = Product.findOne({
      _id: productId,
      tenantId: this.tenantId
    });

    if (includeVariants) {
      query.populate('variants');
    }

    const product = await query.lean();

    if (!product) {
      logger.debug('Producto no encontrado', { 
        productId: productId.toString(),
        tenantId: this.tenantId 
      });
      throw new AppError('Producto no encontrado', 404);
    }

    logger.debug('Producto encontrado', { productId: productId.toString() });
    return product;
  }

  async getAllProducts(filter = {}, options = {}) {
    logger.debug('Obteniendo todos los productos', { filter, options });
    
    const { page = 1, limit = 10, sort = '-createdAt', includeVariants = false } = options;
    const skip = (page - 1) * limit;
  
    const query = { tenantId: this.tenantId };
    
    // Campos de filtro válidos
    const validFilters = ['name', 'sku', 'isActive', 'categories', 'hasVariants'];
    validFilters.forEach(field => {
      if (filter[field] !== undefined) query[field] = filter[field];
    });

    // Filtros de precio
    if (filter.minPrice) {
      query.basePrice = { $gte: parseFloat(filter.minPrice) };
    }
    if (filter.maxPrice) {
      query.basePrice = { ...query.basePrice, $lte: parseFloat(filter.maxPrice) };
    }

    logger.debug('Query construida', { query });

    const productsQuery = Product.find(query)
      .maxTimeMS(10000)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    if (includeVariants) {
      productsQuery.populate('variants');
    }
  
    const products = await productsQuery.lean();

    logger.debug('Productos encontrados', { count: products.length });
    return products;
  }

  async updateProduct(productId, updateData) {
    logger.debug('Actualizando producto', { 
      productId: productId.toString(),
      updateData 
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Si se está cambiando hasVariants, validar
      if (updateData.hasVariants !== undefined) {
        const product = await Product.findOne({
          _id: productId,
          tenantId: this.tenantId
        }).session(session);

        if (!product) {
          throw new AppError('Producto no encontrado', 404);
        }

        // Si se está activando variantes
        if (updateData.hasVariants && !product.hasVariants) {
          if (!Array.isArray(updateData.variantOptions) || updateData.variantOptions.length === 0) {
            throw new AppError('Se requieren opciones de variantes', 400);
          }
          delete updateData.stock;
        }

        // Si se están desactivando variantes
        if (!updateData.hasVariants && product.hasVariants) {
          // Verificar si hay variantes
          const variantCount = await ProductVariant.countDocuments({
            productId,
            tenantId: this.tenantId
          }).session(session);

          if (variantCount > 0) {
            throw new AppError(
              'No se pueden desactivar las variantes mientras existan variantes del producto',
              400
            );
          }
        }
      }

      const updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: productId,
          tenantId: this.tenantId 
        },
        updateData,
        { 
          new: true,
          runValidators: true,
          session
        }
      ).lean();
      
      if (!updatedProduct) {
        throw new AppError('Producto no encontrado', 404);
      }

      await session.commitTransaction();
      return updatedProduct;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async deleteProduct(productId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verificar si hay variantes
      const variantCount = await ProductVariant.countDocuments({
        productId,
        tenantId: this.tenantId
      }).session(session);

      if (variantCount > 0) {
        // Eliminar todas las variantes primero
        await ProductVariant.deleteMany({
          productId,
          tenantId: this.tenantId
        }).session(session);
      }

      const result = await Product.deleteOne({
        _id: productId,
        tenantId: this.tenantId
      }).session(session);
      
      if (result.deletedCount === 0) {
        throw new AppError('Producto no encontrado', 404);
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async searchProducts(query, options = {}) {
    logger.debug('Buscando productos', { query, options });

    const { page = 1, limit = 10, sort = '-createdAt', includeVariants = false } = options;
    const skip = (page - 1) * limit;

    const searchQuery = {
      tenantId: this.tenantId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { sku: { $regex: query, $options: 'i' } }
      ]
    };

    logger.debug('Query de búsqueda construida', { searchQuery });

    const productsQuery = Product.find(searchQuery)
      .maxTimeMS(10000)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    if (includeVariants) {
      productsQuery.populate('variants');
    }

    const [products, total] = await Promise.all([
      productsQuery.lean(),
      Product.countDocuments(searchQuery).maxTimeMS(10000)
    ]);

    // Si se incluyen variantes, también buscar en SKUs de variantes
    let variantResults = [];
    if (includeVariants) {
      const variantQuery = {
        tenantId: this.tenantId,
        sku: { $regex: query, $options: 'i' }
      };

      const variants = await ProductVariant.find(variantQuery)
        .populate('productId')
        .lean();

      // Agregar productos con variantes coincidentes que no estén ya en los resultados
      const productIds = new Set(products.map(p => p._id.toString()));
      variantResults = variants
        .filter(v => v.productId && !productIds.has(v.productId._id.toString()))
        .map(v => v.productId);
    }

    const allProducts = [...products, ...variantResults];

    logger.debug('Resultados de búsqueda', { 
      found: allProducts.length,
      total 
    });

    return {
      products: allProducts,
      total: total + variantResults.length,
      pages: Math.ceil((total + variantResults.length) / limit),
      currentPage: page
    };
  }
}

module.exports = ProductService;