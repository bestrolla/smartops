const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { createError } = require('../../../shared/errors.utils');
const ProductVariantService = require('../services/productVariantService');
const logger = require('../../../shared/logger');

// Validación de ID de producto
const validateProductId = (id) => {
  if (!id) throw createError(400, 'ID de producto no proporcionado');
  if (!/^[0-9a-fA-F]{24}$/.test(id)) throw createError(400, 'ID de producto no válido');
};

// Función auxiliar para generar combinaciones de variantes
function generateVariantCombinations(options) {
  if (!options || options.length === 0) return [];
  const result = [];
  const current = [];
  function generate(index) {
    if (index === options.length) {
      result.push([...current]);
      return;
    }
    const option = options[index];
    for (const value of option.values) {
      current.push({ name: option.name, value });
      generate(index + 1);
      current.pop();
    }
  }
  generate(0);
  return result;
}

// Obtener un producto por ID
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    validateProductId(id);

    const product = await Product.findById(id).lean();
    if (!product) throw createError(404, 'Producto no encontrado');

    const variants = await ProductVariant.find({ productId: id }).lean();

    res.status(200).json({
      status: 'success',
      data: {
        ...product,
        price: Number(product.price),
        baseCost: Number(product.baseCost),
        variants
      }
    });
  } catch (error) {
    logger.error('Error al obtener producto:', error);
    next(error);
  }
};

// Obtener todos los productos (con variantes y baseCost)
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, isActive, hasVariants } = req.query;
    const query = { tenantId: req.user.tenantId };
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (hasVariants !== undefined) query.hasVariants = hasVariants === 'true';

    const count = await Product.countDocuments(query);

    const productsWithVariants = await Product.aggregate([
      { $match: query },
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 },
      {
        $lookup: {
          from: 'productvariants',
          localField: '_id',
          foreignField: 'productId',
          as: 'variants'
        }
      },
      {
        $addFields: {
          price: { $ifNull: ['$price', 0] },
          baseCost: { $ifNull: ['$baseCost', 0] }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      results: productsWithVariants.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: productsWithVariants
    });
  } catch (error) {
    logger.error('Error al obtener productos:', error);
    next(error);
  }
};

// Crear un nuevo producto
exports.createProduct = async (req, res, next) => {
  try {
    logger.debug('Creando nuevo producto', { body: req.body });

    if (!req.body.name || typeof req.body.name !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Product name is required and must be a string.'
      });
    }

    if (req.body.price !== undefined && isNaN(Number(req.body.price))) {
      return res.status(400).json({
        status: 'error',
        message: 'Price must be a valid number.'
      });
    }

    if (req.body.baseCost !== undefined && isNaN(Number(req.body.baseCost))) {
      return res.status(400).json({
        status: 'error',
        message: 'Base cost must be a valid number.'
      });
    }

    const productData = {
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : 0,
      baseCost: req.body.baseCost !== undefined ? Number(req.body.baseCost) : 0,
      tenantId: req.user.tenantId
    };

    const product = await Product.create(productData);

    let variants = [];
    if (product.hasVariants && product.variantOptions) {
      const variantService = new ProductVariantService(req.user.tenantId);
      const combinations = generateVariantCombinations(product.variantOptions);

      variants = await variantService.bulkCreateVariants(
        product._id,
        combinations.map(combo => ({
          sku: `${product.sku}-${combo.map(opt => opt.value).join('-')}`,
          options: combo,
          price: Number(product.price),
          baseCost: Number(product.baseCost),
          stock: 0,
          isActive: true
        }))
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'Producto creado exitosamente',
      data: {
        ...product.toObject(),
        price: Number(product.price),
        baseCost: Number(product.baseCost),
        variants
      }
    });
  } catch (error) {
    logger.error('Error al crear producto:', error);
    next(error);
  }
};

// Actualizar un producto
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    validateProductId(id);

    const updateData = { ...req.body };
    if (req.body.price !== undefined) updateData.price = Number(req.body.price);
    if (req.body.baseCost !== undefined) updateData.baseCost = Number(req.body.baseCost);

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) throw createError(404, 'Producto no encontrado');

    let updatedVariants = [];
    if (product.hasVariants && req.body.variantOptions) {
      const variantService = new ProductVariantService(req.user.tenantId);
      const combinations = generateVariantCombinations(product.variantOptions);
      const existingVariants = await ProductVariant.find({ productId: id });

      const variantsToUpdate = combinations.map(combo => {
        const sku = `${product.sku}-${combo.map(opt => opt.value).join('-')}`;
        const existingVariant = existingVariants.find(v => v.sku === sku);
        return {
          sku,
          options: combo,
          price: Number(product.price),
          baseCost: Number(product.baseCost),
          stock: existingVariant ? existingVariant.stock : 0,
          isActive: true
        };
      });

      for (const variantData of variantsToUpdate) {
        const existingVariant = existingVariants.find(v => v.sku === variantData.sku);
        if (existingVariant) {
          const updatedVariant = await ProductVariant.findByIdAndUpdate(
            existingVariant._id,
            { ...variantData, tenantId: req.user.tenantId, productId: id },
            { new: true, runValidators: true }
          );
          updatedVariants.push(updatedVariant);
        } else {
          const newVariant = await ProductVariant.create({
            ...variantData,
            tenantId: req.user.tenantId,
            productId: id
          });
          updatedVariants.push(newVariant);
        }
      }

      const validSkus = variantsToUpdate.map(v => v.sku);
      await ProductVariant.updateMany(
        { productId: id, sku: { $nin: validSkus } },
        { isActive: false }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Producto actualizado exitosamente',
      data: {
        ...product.toObject(),
        price: Number(product.price),
        baseCost: Number(product.baseCost),
        variants: updatedVariants.length ? updatedVariants : undefined
      }
    });
  } catch (error) {
    logger.error('Error al actualizar producto:', error);
    next(error);
  }
};

// Eliminar un producto (soft delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    validateProductId(id);

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) throw createError(404, 'Producto no encontrado');

    res.status(204).send();
  } catch (error) {
    logger.error('Error al eliminar producto:', error);
    next(error);
  }
};

// Buscar productos
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, fields } = req.query;
    if (!q) throw createError(400, 'Término de búsqueda requerido');

    const searchFields = fields ? fields.split(',') : ['name', 'description', 'sku'];
    const query = {
      $or: searchFields.map(field => ({ [field]: { $regex: q, $options: 'i' } }))
    };

    const productsWithVariants = await Product.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'productvariants',
          localField: '_id',
          foreignField: 'productId',
          as: 'variants'
        }
      },
      {
        $addFields: {
          price: { $ifNull: ['$price', 0] },
          baseCost: { $ifNull: ['$baseCost', 0] }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      results: productsWithVariants.length,
      data: productsWithVariants
    });
  } catch (error) {
    logger.error('Error al buscar productos:', error);
    next(error);
  }
};

// Uso interno para endpoints públicos: retorna lista de productos según filtros (sin Express req/res)
exports.getPublicProducts = async (filters = {}) => {
  const query = { ...filters };
  if (typeof query.isActive === 'undefined') {
    query.isActive = true;
  }
  const products = await Product.find(query)
    .populate('category', 'name')
    .lean();
  return products;
};