const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const Product = require('../../products/models/Product');
const AppError = require('../../../shared/errors.utils');
const mongoose = require('mongoose');

class InventoryService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async isValidProductId(productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('ID de producto no válido', 400);
    }
    
    const productExists = await Product.exists({
      _id: productId,
      tenantId: this.tenantId
    });
    
    if (!productExists) {
      throw new AppError('Producto no encontrado', 404);
    }
    
    return true;
  }

  async createInventory(productId, initialStock = 0) {
    // Verificar si el producto existe
    const product = await Product.findOne({
      _id: productId,
      tenantId: this.tenantId
    });
    
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }
  
    // Crear registro de inventario
    const inventory = await Inventory.create({
      tenant_id: this.tenantId,
      product_id: productId,
      current_stock: initialStock,
      reserved_stock: 0,
      low_stock_threshold: 5 // Valor por defecto
    });
  
    return inventory;
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
        throw new AppError('Producto no encontrado', 404);
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
        throw new AppError('No se puede ajustar el stock', 400);
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
      throw new AppError('Producto no encontrado', 404);
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
    //console.log('Items recibidos:', JSON.stringify(items, null, 2));
    // 1. Validar estructura de los items
    if (!Array.isArray(items)) {
      throw new AppError('Los items deben ser un array', 400);
    }
  
    const validItems = items.filter(item => 
      item && 
      item.product &&  // Ahora siempre usamos product
      mongoose.Types.ObjectId.isValid(item.product) && 
      typeof item.quantity === 'number' && 
      item.quantity > 0
    );
    
    if (validItems.length !== items.length) {
      const invalidItems = items.filter(item => 
        !item || 
        !item.product || 
        !mongoose.Types.ObjectId.isValid(item.product) || 
        typeof item.quantity !== 'number' || 
        item.quantity <= 0
      );
      
      console.log('Items inválidos:', invalidItems);
      throw new AppError('Algunos items no tienen la estructura correcta. Cada item debe tener {product: ObjectId, quantity: number > 0}', 400);
    }
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // 2. Verificar que todos los productos existen
      const productIds = validItems.map(item => item.product);
      const products = await Product.find({
        _id: { $in: productIds },
        tenantId: this.tenantId
      }).session(session);
  
      const foundIds = products.map(p => p._id.toString());
      const missingIds = productIds.filter(id => {
        try {
          return !foundIds.includes(id.toString());
        } catch (e) {
          return true;
        }
      });
  
      if (missingIds.length > 0) {
        throw new AppError(`Productos no encontrados: ${missingIds.join(', ')}`, 404);
      }
  
      // 3. Verificar stock disponible
      const inventoryItems = await Inventory.find({
        tenant_id: this.tenantId,
        product_id: { $in: productIds }
      }).session(session);
  
      const stockErrors = [];
      
      validItems.forEach(item => {
        const inventoryItem = inventoryItems.find(i => i.product_id.equals(item.product));
        if (!inventoryItem) {
          stockErrors.push(`Producto ${item.product} no existe en inventario`);
        } else if (inventoryItem.current_stock < item.quantity) {
          stockErrors.push(`Stock insuficiente para producto ${item.product} (solicitado: ${item.quantity}, disponible: ${inventoryItem.current_stock})`);
        }
      });
  
      if (stockErrors.length > 0) {
        throw new AppError(stockErrors.join('; '), 400);
      }
  
      // 4. Realizar las actualizaciones
      const updateOperations = [];
      
      for (const item of validItems) {
        const updatedInventory = await Inventory.findOneAndUpdate(
          {
            tenant_id: this.tenantId,
            product_id: item.product,
            current_stock: { $gte: item.quantity }
          },
          {
            $inc: {
              current_stock: -item.quantity,
              reserved_stock: item.quantity
            }
          },
          { new: true, session }
        );
  
        if (!updatedInventory) {
          throw new AppError(`Error al reservar producto ${item.product}`, 500);
        }
  
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: -item.quantity } },
          { session }
        );
  
        updateOperations.push({
          product: item.product,
          quantity: item.quantity,
          newStock: updatedInventory.current_stock
        });
      }
  
      await session.commitTransaction();
      
      return {
        success: true,
        reservedItems: updateOperations.length,
        details: updateOperations
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  async releaseReservation(orderId, options = {}) {
    const order = await Order.findOne({ _id: orderId }).lean();
    
    if (!order) {
      throw new AppError('Orden no encontrada', 404);
    }

    const bulkOps = order.items.map(item => ({
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

    await Inventory.bulkWrite(bulkOps, options);
    
    // Revertir en productos
    await Product.bulkWrite(order.items.map(item => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } }
      }
    })), options);
  }

  async releaseStock(items, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // Validar items
      if (!Array.isArray(items)) {
        throw new AppError('Los items deben ser un array', 400);
      }
  
      const validItems = items.filter(item => 
        item && 
        item.product && 
        mongoose.Types.ObjectId.isValid(item.product) && 
        typeof item.quantity === 'number' && 
        item.quantity > 0
      );
  
      if (validItems.length !== items.length) {
        throw new AppError('Algunos items no tienen la estructura correcta', 400);
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
        throw new AppError(`No hay suficiente stock reservado para: ${invalidReleases.map(i => i.product).join(', ')}`, 400);
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
}

module.exports = InventoryService;