const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const Product = require('../../products/models/Product');
const { createError } = require('../../../shared/errors.utils');
const mongoose = require('mongoose');
const ProductVariant = require('../../products/models/ProductVariant');

class InventoryService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async isValidProductId(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw createError(400, 'ID de producto no válido');
    }
    
    const productExists = await Product.exists({
      _id: productId,
      tenantId: this.tenantId
    });
    
    if (!productExists) {
      throw createError(404, 'Producto no encontrado');
    }
    
    return true;
  }

  async validateStock(productId, quantity, session = null) {
    // Verificar si es una variante
    let inventory;
    const variant = await ProductVariant.findById(productId);
    if (variant) {
      // Es una variante: buscar inventario por product_id y variant_id
      inventory = await Inventory.findOne(
        {
          tenant_id: this.tenantId,
          product_id: variant.productId,
          variant_id: variant._id
        },
        null,
        { session }
      );
    } else {
      // Producto simple: buscar por product_id
      inventory = await Inventory.findOne(
        {
          tenant_id: this.tenantId,
          product_id: productId
        },
        null,
        { session }
      );
    }

    if (!inventory) {
      throw createError(404, `No existe inventario para el producto ${productId}`);
    }

    const availableStock = inventory.current_stock - inventory.reserved_stock;
    if (availableStock < quantity) {
      throw createError(400, `Stock insuficiente para el producto ${productId}. Disponible: ${availableStock}`);
    }

    return inventory;
  }

  async createInventory(productId, initialStock = 0) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verificar si el producto existe
      const product = await Product.findOne({
        _id: productId,
        tenantId: this.tenantId
      }).session(session);
      
      if (!product) {
        throw createError(404, 'Producto no encontrado');
      }

      // Verificar si ya existe un inventario
      const existingInventory = await Inventory.findOne({
        tenant_id: this.tenantId,
        product_id: productId
      }).session(session);

      if (existingInventory) {
        throw createError(400, 'Ya existe un inventario para este producto');
      }
    
      // Crear registro de inventario
      const inventory = await Inventory.create([{
        tenant_id: this.tenantId,
        product_id: productId,
        current_stock: initialStock,
        reserved_stock: 0,
        low_stock_threshold: 5 // Valor por defecto
      }], { session });

      // Actualizar stock en producto
      await Product.findByIdAndUpdate(
        productId,
        { stock: initialStock },
        { session }
      );

      // Registrar movimiento inicial
      if (initialStock > 0) {
        await StockMovement.create([{
          tenant_id: this.tenantId,
          product_id: productId,
          type: 'adjustment',
          quantity: initialStock,
          metadata: {
            reason: 'Inventario inicial',
            adjustedBy: 'system'
          }
        }], { session });
      }

      await session.commitTransaction();
      return inventory[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getInventory({ page = 1, limit = 50, lowStockOnly = false }) {
    const query = { tenant_id: this.tenantId };
    
    if (lowStockOnly) {
      query.$expr = { $lte: ['$current_stock', '$low_stock_threshold'] };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: {
        path: 'product_id',
        select: 'name sku price stock' // Agregamos stock para referencia
      },
      lean: true
    };

    return await Inventory.paginate(query, options);
  }

  async adjustStock(productId, delta, movementData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Verificar producto existe
      const product = await Product.findOne({
        _id: productId,
        tenantId: this.tenantId
      }).session(session);

      if (!product) {
        throw createError(404, 'Producto no encontrado');
      }

      // 2. Actualizar inventario
      const inventory = await Inventory.findOneAndUpdate(
        { 
          tenant_id: this.tenantId,
          product_id: productId,
          current_stock: { $gte: -delta } // Previene stock negativo
        },
        { 
          $inc: { current_stock: delta },
          $set: { last_updated: new Date() }
        },
        { new: true, session }
      );

      if (!inventory) {
        throw createError(400, 'No se puede ajustar el stock');
      }

      // 3. Actualizar stock en Producto
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: delta } },
        { session }
      );

      // 4. Registrar movimiento
      await StockMovement.create([{
        tenant_id: this.tenantId,
        product_id: productId,
        type: movementData.type,
        quantity: Math.abs(delta),
        reference_id: movementData.reference_id,
        metadata: movementData.metadata
      }], { session });

      await session.commitTransaction();
      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getProductHistory(productId, { startDate, endDate, type } = {}) {

      // Validar el ID primero
      await this.isValidProductId(productId);

    // Validar que el producto pertenezca al tenant
    const productExists = await Product.exists({
      _id: productId,
      tenantId: this.tenantId
    });
    
    if (!productExists) {
      throw createError(404, 'Producto no encontrado');
    }
  
    const query = { 
      tenant_id: this.tenantId,
      product_id: productId 
    };
  
    // Filtros opcionales
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
  
    if (type) {
      query.type = type;
    }
  
    return await StockMovement.find(query)
      .sort({ createdAt: -1 })
      .populate('reference_id', 'name email') // Opcional: info de quién hizo el movimiento
      .lean();
  }

  async reserveForOrder(items, options = {}) {
    const session = options.session || await mongoose.startSession();
    const shouldManageSession = !options.session;
    
    if (shouldManageSession) {
      session.startTransaction();
    }

    try {
      // Incluir variant si existe
      const validItems = items.map(item => ({
        product: item.product || item.productId,
        variant: item.variant || null,
        quantity: parseInt(item.quantity)
      }));

      // Validar todos los productos primero
      for (const item of validItems) {
        // Si hay variant, validar stock de la variante
        if (item.variant) {
          const variant = await ProductVariant.findById(item.variant);
          if (!variant) throw createError(404, `Variante no encontrada: ${item.variant}`);
          await this.validateStock(item.variant, item.quantity, session);
        } else {
          await this.validateStock(item.product, item.quantity, session);
        }
      }

      const updateOperations = [];
      
      for (const item of validItems) {
        let inventoryFilter;
        let productIdForUpdate;
        if (item.variant) {
          // Es una variante
          const variant = await ProductVariant.findById(item.variant);
          if (!variant) throw createError(404, `Variante no encontrada: ${item.variant}`);
          inventoryFilter = {
            tenant_id: this.tenantId,
            product_id: variant.productId,
            variant_id: variant._id,
            current_stock: { $gte: item.quantity }
          };
          productIdForUpdate = variant.productId;
        } else {
          // Producto simple
          inventoryFilter = {
            tenant_id: this.tenantId,
            product_id: item.product,
            current_stock: { $gte: item.quantity }
          };
          productIdForUpdate = item.product;
        }

        const [updatedInventory, updatedProduct] = await Promise.all([
          // Actualizar inventario
          Inventory.findOneAndUpdate(
            inventoryFilter,
            {
              $inc: {
                current_stock: -item.quantity,
                reserved_stock: item.quantity
              }
            },
            { new: true, session }
          ),
          // Actualizar producto
          Product.findByIdAndUpdate(
            productIdForUpdate,
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          )
        ]);

        if (!updatedInventory || !updatedProduct) {
          throw createError(500, `Error al reservar producto ${item.product}`);
        }

        // Registrar movimiento
        await StockMovement.create([{
          tenant_id: this.tenantId,
          product_id: productIdForUpdate,
          type: 'sale',
          quantity: item.quantity,
          metadata: {
            orderId: options.orderId,
            type: 'reservation'
          }
        }], { session });

        updateOperations.push({
          product: item.product,
          variant: item.variant || null,
          quantity: item.quantity,
          newStock: updatedInventory.current_stock,
          newReservedStock: updatedInventory.reserved_stock
        });
      }

      if (shouldManageSession) {
        await session.commitTransaction();
      }
      
      return {
        success: true,
        reservedItems: updateOperations.length,
        details: updateOperations
      };
    } catch (error) {
      if (shouldManageSession) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (shouldManageSession) {
        session.endSession();
      }
    }
  }

  async releaseReservation(items, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const validItems = items.map(item => ({
        product: item.product || item.productId,
        quantity: parseInt(item.quantity)
      }));

      const updateOperations = [];

      for (const item of validItems) {
        const [updatedInventory, updatedProduct] = await Promise.all([
          // Actualizar inventario
          Inventory.findOneAndUpdate(
            {
              tenant_id: this.tenantId,
              product_id: item.product,
              reserved_stock: { $gte: item.quantity }
            },
            {
              $inc: {
                current_stock: item.quantity,
                reserved_stock: -item.quantity
              }
            },
            { new: true, session }
          ),
          // Actualizar producto
          Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { new: true, session }
          )
        ]);

        if (!updatedInventory || !updatedProduct) {
          throw createError(500, `Error al liberar reserva del producto ${item.product}`);
        }

        // Registrar movimiento
        await StockMovement.create([{
          tenant_id: this.tenantId,
          product_id: item.product,
          type: 'adjustment',
          quantity: item.quantity,
          metadata: {
            orderId: options.orderId,
            type: 'reservation_release',
            reason: options.reason || 'Liberación de reserva'
          }
        }], { session });

        updateOperations.push({
          product: item.product,
          quantity: item.quantity,
          newStock: updatedInventory.current_stock,
          newReservedStock: updatedInventory.reserved_stock
        });
      }

      await session.commitTransaction();
      
      return {
        success: true,
        releasedItems: updateOperations.length,
        details: updateOperations
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async releaseStock(items, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // Validar items
      if (!Array.isArray(items)) {
        throw createError(400, 'Los items deben ser un array');
      }
  
      const validItems = items.filter(item => 
        item && 
        item.product && 
        mongoose.Types.ObjectId.isValid(item.product) && 
        typeof item.quantity === 'number' && 
        item.quantity > 0
      );
  
      if (validItems.length !== items.length) {
        throw createError(400, 'Algunos items no tienen la estructura correcta');
      }

      const inventoryItems = await Inventory.find({
        tenant_id: this.tenantId,
        product_id: { $in: validItems.map(i => i.product) }
      }).session(session);
      
      const invalidReleases = validItems.filter(item => {
        const inventoryItem = inventoryItems.find(i => i.product_id.equals(item.product));
        return !inventoryItem || inventoryItem.reserved_stock < item.quantity;
      });
      
      if (invalidReleases.length > 0) {
        throw createError(400, `No hay suficiente stock reservado para: ${invalidReleases.map(i => i.product).join(', ')}`);
      }
  
      // Liberar stock
      const bulkOps = validItems.map(item => ({
        updateOne: {
          filter: { 
            tenant_id: this.tenantId,
            product_id: item.product
          },
          update: { 
            $inc: { 
              current_stock: item.quantity,
              reserved_stock: -item.quantity
            }
          },
          ...options
        }
      }));
  
      await Inventory.bulkWrite(bulkOps, { session });
      
      // Actualizar productos
      await Product.bulkWrite(validItems.map(item => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } }
        }
      })), { session });
  
      await session.commitTransaction();
      
      return {
        success: true,
        releasedItems: validItems.length,
        details: validItems
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async confirmSale(productId, quantity, options = {}) {
    const session = options.session || await mongoose.startSession();
    const startedTransaction = !options.session;
    
    if (startedTransaction) {
      session.startTransaction();
    }

    try {
      // Verificar que el producto existe y tiene suficiente stock reservado
      const inventory = await Inventory.findOne({
        tenant_id: this.tenantId,
        product_id: productId,
        reserved_stock: { $gte: quantity }
      }).session(session);

      if (!inventory) {
        throw createError(400, 'No hay suficiente stock reservado para este producto');
      }

      // Actualizar el inventario
      const updatedInventory = await Inventory.findOneAndUpdate(
        {
          _id: inventory._id,
          reserved_stock: { $gte: quantity }
        },
        {
          $inc: { reserved_stock: -quantity },
          last_movement_date: new Date()
        },
        { 
          new: true,
          session
        }
      );

      if (!updatedInventory) {
        throw createError(500, 'Error al actualizar el inventario');
      }

      // Registrar el movimiento
      await StockMovement.create([{
        tenant_id: this.tenantId,
        product_id: productId,
        type: 'sale',
        quantity: quantity,
        metadata: {
          orderId: options.orderId,
          type: 'sale_confirmation'
        }
      }], { session });

      if (startedTransaction) {
        await session.commitTransaction();
      }

      return updatedInventory;
    } catch (error) {
      if (startedTransaction) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (startedTransaction) {
        session.endSession();
      }
    }
  }

  async initializeInventory(productId, initialStock = 0) {
    console.log('Inicializando inventario:', {
      tenant: this.tenantId,
      productId,
      initialStock
    });

    // Verificar que el producto existe
    const product = await Product.findOne({
      _id: productId,
      tenantId: this.tenantId
    });

    if (!product) {
      throw createError(404, `Producto no encontrado: ${productId}`);
    }

    // Crear o actualizar el inventario
    const inventory = await Inventory.findOneAndUpdate(
      { 
        tenant: this.tenantId,
        product: productId
      },
      {
        $setOnInsert: {
          currentStock: initialStock,
          reservedStock: 0,
          minStock: 0,
          maxStock: 0,
          location: 'default'
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    console.log('Inventario inicializado:', {
      inventoryId: inventory._id,
      currentStock: inventory.currentStock,
      reservedStock: inventory.reservedStock
    });

    return inventory;
  }

  async updateStock(productId, quantity) {
    console.log('Actualizando stock:', {
      tenant: this.tenantId,
      productId,
      quantity
    });

    const inventory = await Inventory.findOneAndUpdate(
      {
        tenant: this.tenantId,
        product: productId,
        currentStock: { $gte: -quantity } // Prevenir stock negativo
      },
      {
        $inc: { currentStock: quantity }
      },
      { new: true }
    );

    if (!inventory) {
      throw createError(400, 'No hay suficiente stock o el producto no existe');
    }

    console.log('Stock actualizado:', {
      inventoryId: inventory._id,
      newStock: inventory.currentStock,
      reservedStock: inventory.reservedStock
    });

    return inventory;
  }

  async getInventoryByProduct(productId) {
    return await Inventory.findOne({
      tenant: this.tenantId,
      product: productId
    });
  }

  async adjustStock(productId, adjustmentData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { delta, reason } = adjustmentData;

      // Verificar si es una variante
      const variant = await ProductVariant.findById(productId);
      let inventoryFilter;
      let productIdForUpdate;

      if (variant) {
        // Es una variante
        inventoryFilter = {
          tenant_id: this.tenantId,
          product_id: variant.productId,
          variant_id: variant._id
        };
        productIdForUpdate = variant.productId;
      } else {
        // Producto simple
        inventoryFilter = {
          tenant_id: this.tenantId,
          product_id: productId
        };
        productIdForUpdate = productId;
      }

      // Buscar o crear inventario
      let inventory = await Inventory.findOne(inventoryFilter, null, { session });
      
      if (!inventory) {
        // Crear inventario si no existe
        inventory = await Inventory.create([{
          tenant_id: this.tenantId,
          product_id: productIdForUpdate,
          variant_id: variant ? variant._id : null,
          current_stock: 0,
          reserved_stock: 0,
          low_stock_threshold: 0
        }], { session });
        inventory = inventory[0];
      }

      // Verificar que el ajuste no resulte en stock negativo
      const newStock = inventory.current_stock + delta;
      if (newStock < 0) {
        throw createError(400, 'No se puede ajustar el stock a un valor negativo');
      }

      // Actualizar stock
      inventory.current_stock = newStock;
      inventory.last_updated = new Date();
      await inventory.save({ session });

      // Registrar movimiento de stock
      await StockMovement.create([{
        tenant_id: this.tenantId,
        product_id: productIdForUpdate,
        variant_id: variant ? variant._id : null,
        type: 'adjustment',
        quantity: delta,
        previous_stock: inventory.current_stock - delta,
        new_stock: inventory.current_stock,
        reason: reason,
        metadata: {
          adjustedBy: 'user', // Aquí podrías pasar el ID del usuario
          reason: reason
        }
      }], { session });

      await session.commitTransaction();
      
      return inventory;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = InventoryService;