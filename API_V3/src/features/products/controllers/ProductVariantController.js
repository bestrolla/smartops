const mongoose = require('mongoose');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const AppError = require('../../../shared/errors.utils');
const ProductVariantService = require('../services/productVariantService');
const logger = require('../../../shared/logger');

// Validador reutilizable
const validateIds = (productId, variantId = null) => {
  if (!productId) throw new AppError('ID de producto no proporcionado', 400);
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('ID de producto no válido', 400);
  }
  
  if (variantId && !mongoose.Types.ObjectId.isValid(variantId)) {
    throw new AppError('ID de variante no válido', 400);
  }
  
  return {
    productId: new mongoose.Types.ObjectId(productId),
    variantId: variantId ? new mongoose.Types.ObjectId(variantId) : null
  };
};

exports.createVariant = async (req, res, next) => {
  try {
    logger.debug('Iniciando createVariant', {
      body: req.body,
      productId: req.params.productId,
      tenantId: req.user?.tenantId
    });

    if (!req.user?.tenantId) {
      throw new AppError('Tenant no identificado', 400);
    }

    const { productId } = validateIds(req.params.productId);
    const variantService = new ProductVariantService(req.user.tenantId);
    
    const variant = await variantService.createVariant(productId, req.body);

    logger.debug('Variante creada exitosamente', {
      variantId: variant._id,
      productId
    });

    res.status(201).json({
      status: 'success',
      data: variant
    });
  } catch (err) {
    logger.error('Error en createVariant', {
      error: err.message,
      stack: err.stack
    });
    next(err);
  }
};

exports.getVariant = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) throw new AppError('Tenant no identificado', 400);

    const { productId, variantId } = validateIds(
      req.params.productId,
      req.params.variantId
    );

    const variantService = new ProductVariantService(req.user.tenantId);
    const variant = await variantService.getVariantById(productId, variantId);

    res.status(200).json({
      status: 'success',
      data: variant
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVariant = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) throw new AppError('Tenant no identificado', 400);

    const { productId, variantId } = validateIds(
      req.params.productId,
      req.params.variantId
    );

    const variantService = new ProductVariantService(req.user.tenantId);
    const variant = await variantService.updateVariant(
      productId,
      variantId,
      req.body
    );

    res.status(200).json({
      status: 'success',
      data: variant
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteVariant = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) throw new AppError('Tenant no identificado', 400);

    const { productId, variantId } = validateIds(
      req.params.productId,
      req.params.variantId
    );

    const variantService = new ProductVariantService(req.user.tenantId);
    await variantService.deleteVariant(productId, variantId);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductVariants = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) throw new AppError('Tenant no identificado', 400);

    const { productId } = validateIds(req.params.productId);
    
    const variantService = new ProductVariantService(req.user.tenantId);
    const variants = await variantService.getProductVariants(productId, req.query);

    res.status(200).json({
      status: 'success',
      results: variants.length,
      data: variants
    });
  } catch (err) {
    next(err);
  }
};

exports.bulkCreateVariants = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) throw new AppError('Tenant no identificado', 400);
    
    if (!Array.isArray(req.body.variants)) {
      throw new AppError('Se requiere un array de variantes', 400);
    }

    const { productId } = validateIds(req.params.productId);
    
    const variantService = new ProductVariantService(req.user.tenantId);
    const variants = await variantService.bulkCreateVariants(
      productId,
      req.body.variants
    );

    res.status(201).json({
      status: 'success',
      results: variants.length,
      data: variants
    });
  } catch (err) {
    next(err);
  }
};

exports.updateVariantStock = async (req, res, next) => {
  try {
    if (!req.user?.tenantId) throw new AppError('Tenant no identificado', 400);

    const { productId, variantId } = validateIds(
      req.params.productId,
      req.params.variantId
    );

    if (typeof req.body.stock !== 'number') {
      throw new AppError('Stock debe ser un número', 400);
    }

    const variantService = new ProductVariantService(req.user.tenantId);
    const variant = await variantService.updateVariantStock(
      productId,
      variantId,
      req.body.stock
    );

    res.status(200).json({
      status: 'success',
      data: variant
    });
  } catch (err) {
    next(err);
  }
}; 