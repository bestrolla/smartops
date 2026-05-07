const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

// Crear producto (simple o con variantes)
exports.createProduct = async (req, res, next) => {
  try {
    logger.debug('Creando nuevo producto', { body: req.body });
    
    const productData = {
      ...req.body,
      tenantId: req.user.tenantId
    };

    // Crear el producto base
    const product = await Product.create(productData);
    logger.debug('Producto base creado', { productId: product._id });

    // Si tiene variantes, crearlas
    if (product.hasVariants && req.body.variants && req.body.variants.length > 0) {
      const variants = [];
      
      for (const variantData of req.body.variants) {
        try {
          const variant = await ProductVariant.create({
            tenantId: req.user.tenantId,
            productId: product._id,
            sku: variantData.sku,
            attributes: new Map(Object.entries(variantData.attributes)),
            price: variantData.price,
            stock: variantData.stock || 0,
            isActive: variantData.isActive !== false,
            images: variantData.images || []
          });
          variants.push(variant);
        } catch (variantError) {
          logger.error('Error creando variante:', variantError);
          // Continuar con las siguientes variantes
        }
      }
      
      logger.debug('Variantes creadas', { count: variants.length });
    }

    // Retornar el producto con sus variantes
    const productWithVariants = await Product.findById(product._id)
      .populate('variants')
      .populate('category');

    res.status(201).json({
      status: 'success',
      message: 'Producto creado exitosamente',
      data: productWithVariants
    });
  } catch (error) {
    logger.error('Error creando producto:', error);
    next(error);
  }
};

// Obtener todos los productos con información simplificada
exports.getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      isActive, 
      hasVariants,
      search,
      includeVariants = false 
    } = req.query;

    const query = { tenantId: req.user.tenantId };

    // Aplicar filtros
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (hasVariants !== undefined) query.hasVariants = hasVariants === 'true';

    // Búsqueda por texto
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let productsQuery = Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Incluir variantes si se solicita
    if (includeVariants === 'true') {
      productsQuery = productsQuery.populate('variants');
    }

    const products = await productsQuery.exec();
    const total = await Product.countDocuments(query);

    // Agregar información calculada
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        
        if (product.hasVariants) {
          productObj.priceRange = await product.getPriceRange();
          productObj.totalStock = await product.getTotalStock();
        } else {
          productObj.priceRange = { min: product.price, max: product.price };
          productObj.totalStock = product.stock;
        }

        return productObj;
      })
    );

    res.status(200).json({
      status: 'success',
      results: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: enrichedProducts
    });
  } catch (error) {
    logger.error('Error obteniendo productos:', error);
    next(error);
  }
};

// Obtener un producto por ID con toda su información
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, 'ID de producto no válido');
    }

    const product = await Product.findOne({
      _id: id,
      tenantId: req.user.tenantId
    })
    .populate('category', 'name')
    .populate('variants');

    if (!product) {
      throw createError(404, 'Producto no encontrado');
    }

    const productObj = product.toObject();
    
    // Agregar información calculada
    if (product.hasVariants) {
      productObj.priceRange = await product.getPriceRange();
      productObj.totalStock = await product.getTotalStock();
    } else {
      productObj.priceRange = { min: product.price, max: product.price };
      productObj.totalStock = product.stock;
    }

    res.status(200).json({
      status: 'success',
      data: productObj
    });
  } catch (error) {
    logger.error('Error obteniendo producto:', error);
    next(error);
  }
};

// Actualizar producto
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, 'ID de producto no válido');
    }

    logger.debug('Actualizando producto', { id, body: req.body });

    // Actualizar el producto base
    const product = await Product.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createError(404, 'Producto no encontrado');
    }

    // Si el producto cambió a tener variantes, manejar las variantes
    if (product.hasVariants && req.body.variants) {
      // Obtener variantes existentes
      const existingVariants = await ProductVariant.find({ 
        productId: id,
        tenantId: req.user.tenantId 
      });

      // Actualizar o crear variantes
      const variantPromises = req.body.variants.map(async (variantData) => {
        const attributesMap = new Map(Object.entries(variantData.attributes));
        
        // Buscar variante existente por SKU
        const existingVariant = existingVariants.find(v => v.sku === variantData.sku);
        
        if (existingVariant) {
          // Actualizar variante existente
          return ProductVariant.findByIdAndUpdate(
            existingVariant._id,
            {
              attributes: attributesMap,
              price: variantData.price,
              stock: variantData.stock || 0,
              isActive: variantData.isActive !== false,
              images: variantData.images || []
            },
            { new: true }
          );
        } else {
          // Crear nueva variante
          return ProductVariant.create({
            tenantId: req.user.tenantId,
            productId: id,
            sku: variantData.sku,
            attributes: attributesMap,
            price: variantData.price,
            stock: variantData.stock || 0,
            isActive: variantData.isActive !== false,
            images: variantData.images || []
          });
        }
      });

      await Promise.all(variantPromises);

      // Desactivar variantes que ya no están en la lista
      const newSkus = req.body.variants.map(v => v.sku);
      await ProductVariant.updateMany(
        { 
          productId: id,
          tenantId: req.user.tenantId,
          sku: { $nin: newSkus }
        },
        { isActive: false }
      );
    } else if (!product.hasVariants) {
      // Si el producto ya no tiene variantes, desactivar todas las variantes existentes
      await ProductVariant.updateMany(
        { productId: id, tenantId: req.user.tenantId },
        { isActive: false }
      );
    }

    // Retornar el producto actualizado con sus variantes
    const updatedProduct = await Product.findById(id)
      .populate('category', 'name')
      .populate('variants');

    res.status(200).json({
      status: 'success',
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Error actualizando producto:', error);
    next(error);
  }
};

// Eliminar producto (soft delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, 'ID de producto no válido');
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, tenantId: req.user.tenantId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      throw createError(404, 'Producto no encontrado');
    }

    // También desactivar todas las variantes
    await ProductVariant.updateMany(
      { productId: id, tenantId: req.user.tenantId },
      { isActive: false }
    );

    res.status(200).json({
      status: 'success',
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error eliminando producto:', error);
    next(error);
  }
};

// Obtener variantes de un producto
exports.getProductVariants = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, 'ID de producto no válido');
    }

    const variants = await ProductVariant.find({
      productId: id,
      tenantId: req.user.tenantId
    }).sort({ sortOrder: 1, createdAt: 1 });

    res.status(200).json({
      status: 'success',
      results: variants.length,
      data: variants
    });
  } catch (error) {
    logger.error('Error obteniendo variantes:', error);
    next(error);
  }
};

// Buscar productos
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      throw createError(400, 'Término de búsqueda requerido');
    }

    const searchQuery = {
      tenantId: req.user.tenantId,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    const products = await Product.find(searchQuery)
      .populate('category', 'name')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: products
    });
  } catch (error) {
    logger.error('Error buscando productos:', error);
    next(error);
  }
};
