const mongoose = require('mongoose');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

class ProductVariantService {
  constructor(tenantId) {
    if (!tenantId) throw createError(400, 'Tenant ID es requerido');
    this.tenantId = tenantId;
    logger.debug('ProductVariantService inicializado', { tenantId });
  }

  async validateProduct(productId) {
    const product = await Product.findOne({
      _id: productId,
      tenantId: this.tenantId
    });

    if (!product) {
      throw createError(404, 'Producto no encontrado o no pertenece al tenant especificado');
    }

    if (!product.hasVariants) {
      throw createError(400, 'Este producto no soporta variantes');
    }

    return product;
  }

  async createVariant(productId, variantData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await this.validateProduct(productId);

      // Validar que las opciones coincidan con las definidas en el producto
      this.validateVariantOptions(product.variantOptions, variantData.options);

      // Crear la variante
      const variant = await ProductVariant.create([{
        ...variantData,
        productId,
        tenantId: this.tenantId
      }], { session });

      // Si es la primera variante, establecerla como default
      if (!product.defaultVariantId) {
        product.defaultVariantId = variant[0]._id;
        await product.save({ session });
      }

      await session.commitTransaction();
      return variant[0];
    } catch (err) {
      await session.abortTransaction();
      
      if (err.code === 11000) {
        throw createError(400, 'El SKU ya existe');
      }
      
      logger.error('Error al crear variante:', {
        error: err.message,
        stack: err.stack,
        productId,
        variantData
      });
      
      throw err;
    } finally {
      session.endSession();
    }
  }

  validateVariantOptions(productOptions, variantOptions) {
    if (!Array.isArray(variantOptions)) {
      throw createError(400, 'Las opciones de la variante deben ser un array');
    }

    // Verificar que todas las opciones requeridas estén presentes
    const requiredOptions = productOptions.map(po => po.name);
    const providedOptions = new Set(variantOptions.map(vo => vo.name));

    for (const required of requiredOptions) {
      if (!providedOptions.has(required)) {
        throw createError(400, `Falta la opción requerida: ${required}`);
      }
    }

    // Verificar que los valores sean válidos
    for (const variantOpt of variantOptions) {
      const productOpt = productOptions.find(po => po.name === variantOpt.name);
      if (!productOpt) {
        throw createError(400, `Opción no válida: ${variantOpt.name}`);
      }

      if (!productOpt.values.includes(variantOpt.value)) {
        throw createError(
          400,
          `Valor no válido para ${variantOpt.name}: ${variantOpt.value}`
        );
      }
    }
  }

  async getVariantById(productId, variantId) {
    await this.validateProduct(productId);

    const variant = await ProductVariant.findOne({
      _id: variantId,
      productId,
      tenantId: this.tenantId
    }).lean();

    if (!variant) {
      throw createError(404, 'Variante no encontrada');
    }

    return variant;
  }

  async updateVariant(productId, variantId, updateData) {
    const product = await this.validateProduct(productId);

    if (updateData.options) {
      this.validateVariantOptions(product.variantOptions, updateData.options);
    }

    const variant = await ProductVariant.findOneAndUpdate(
      {
        _id: variantId,
        productId,
        tenantId: this.tenantId
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).lean();

    if (!variant) {
      throw createError(404, 'Variante no encontrada');
    }

    // Si se actualizó el stock, actualizar también el inventario
    if (updateData.stock !== undefined) {
      const Inventory = mongoose.model('Inventory');
      const inventory = await Inventory.findOne({
        tenant_id: this.tenantId,
        product_id: productId,
        variant_id: variantId
      });

      if (inventory) {
        inventory.current_stock = updateData.stock;
        inventory.last_movement_date = new Date();
        await inventory.save();
        logger.debug('Inventario actualizado para la variante', { 
          variantId, 
          newStock: updateData.stock 
        });
      } else {
        logger.warn('No se encontró inventario para actualizar', { variantId });
      }
    }

    return variant;
  }

  async deleteVariant(productId, variantId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await this.validateProduct(productId);

      // Si es la variante por defecto, no permitir eliminarla si es la única
      if (product.defaultVariantId?.toString() === variantId.toString()) {
        const variantCount = await ProductVariant.countDocuments({
          productId,
          tenantId: this.tenantId
        });

        if (variantCount === 1) {
          throw createError(
            400,
            'No se puede eliminar la única variante del producto'
          );
        }
      }

      const result = await ProductVariant.deleteOne({
        _id: variantId,
        productId,
        tenantId: this.tenantId
      }).session(session);

      if (result.deletedCount === 0) {
        throw createError(404, 'Variante no encontrada');
      }

      // Si era la variante por defecto, establecer otra como default
      if (product.defaultVariantId?.toString() === variantId.toString()) {
        const newDefault = await ProductVariant.findOne({
          productId,
          tenantId: this.tenantId
        }).session(session);

        if (newDefault) {
          product.defaultVariantId = newDefault._id;
          await product.save({ session });
        }
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async getProductVariants(productId, options = {}) {
    await this.validateProduct(productId);

    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const variants = await ProductVariant.find({
      productId,
      tenantId: this.tenantId
    })
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();

    return variants;
  }

  async bulkCreateVariants(productId, variants) {
    try {
      const product = await this.validateProduct(productId);

      // Validar todas las variantes antes de crear
      variants.forEach(variant => {
        this.validateVariantOptions(product.variantOptions, variant.options);
      });

      // Preparar las variantes con información de inventario
      const preparedVariants = variants.map(variant => {
        const cardType = variant.options.find(opt => opt.name === 'Tipo')?.value || 'Standard';
        const capacity = variant.options.find(opt => opt.name === 'Capacidad')?.value || '1GB';
        
        return {
          ...variant,
          productId,
          tenantId: this.tenantId,
          stock: variant.stock || 0,
          metadata: {
            ...variant.metadata,
            card_type: cardType,
            capacity: capacity,
            type: 'nfc_card'
          }
        };
      });

      // Crear todas las variantes
      const createdVariants = await ProductVariant.create(preparedVariants);

      // Si no hay variante por defecto, establecer la primera
      if (!product.defaultVariantId) {
        product.defaultVariantId = createdVariants[0]._id;
        await product.save();
      }

      return createdVariants;
    } catch (err) {
      logger.error('Error al crear variantes en bulk:', {
        error: err.message,
        stack: err.stack,
        productId,
        variants
      });
      throw err;
    }
  }

  async updateVariantStock(productId, variantId, newStock) {
    const variant = await ProductVariant.findOneAndUpdate(
      {
        _id: variantId,
        productId,
        tenantId: this.tenantId
      },
      { stock: newStock },
      { new: true, runValidators: true }
    ).lean();

    if (!variant) {
      throw createError(404, 'Variante no encontrada');
    }

    // Actualizar también el inventario
    const Inventory = mongoose.model('Inventory');
    const inventory = await Inventory.findOne({
      tenant_id: this.tenantId,
      product_id: productId,
      variant_id: variantId
    });

    if (inventory) {
      inventory.current_stock = newStock;
      inventory.last_movement_date = new Date();
      await inventory.save();
    }

    return variant;
  }
}

module.exports = ProductVariantService; 