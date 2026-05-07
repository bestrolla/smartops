const Cart = require('../models/Cart');
const Product = require('../../products/models/Product');
const ProductVariant = require('../../products/models/ProductVariant');
const Inventory = require('../../inventory/models/Inventory');
const AppError = require('../../../shared/errors.utils');
const mongoose = require('mongoose');

class CartService {
  constructor(tenantId, userId) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  async getCart() {
    return await Cart.findOne({ 
      tenantId: this.tenantId, 
      user: this.userId 
    }).populate('items.product').populate('items.variant');
  }

  async addItem(productId, quantity = 1) {
    // Validación básica de parámetros
    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError('ID de producto inválido', 400);
    }

    if (quantity < 1) {
      throw new AppError('La cantidad debe ser al menos 1', 400);
    }

    console.log(`[DEBUG] Añadiendo producto ${productId}, cantidad: ${quantity}`);

    // 1. Verificar producto
    const product = await Product.findOne({
      _id: productId,
      tenantId: this.tenantId,
      isActive: true
    }).lean();

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Si el producto tiene variantes, requerir variantId
    if (product.hasVariants) {
      throw new AppError('Este producto requiere seleccionar una variante. Use addItemWithVariant()', 400);
    }

    // 2. Reservar stock atómicamente (producto sin variantes)
    const inventoryUpdate = await Inventory.updateOne(
      {
        product_id: productId,
        tenant_id: this.tenantId,
        variant_id: null,
        current_stock: { $gte: quantity }
      },
      { $inc: { reserved_stock: quantity } }
    );

    if (inventoryUpdate.modifiedCount === 0) {
      const inventory = await Inventory.findOne({
        product_id: productId,
        tenant_id: this.tenantId,
        variant_id: null
      }).lean();
      
      const available = inventory ? inventory.current_stock - inventory.reserved_stock : 0;
      throw new AppError(
        `Stock insuficiente. Disponible: ${available}`,
        400,
        { availableStock: available }
      );
    }

    // 3. Buscar o crear carrito
    let cart = await Cart.findOne({ 
      tenantId: this.tenantId,
      user: this.userId
    });

    if (!cart) {
      cart = new Cart({
        tenantId: this.tenantId,
        user: this.userId,
        items: []
      });
    }

    // 4. Actualizar o añadir ítem
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId.toString() && !item.variant
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variant: null,
        quantity,
        price: product.basePrice,
        variantInfo: {
          sku: product.sku,
          variantOptions: []
        }
      });
    }

    // 5. Guardar carrito
    try {
      const savedCart = await cart.save();
      console.log('[SUCCESS] Carrito actualizado:', savedCart);
      return savedCart;
    } catch (saveError) {
      // Si falla, liberamos el stock reservado
      await this.releaseStock(productId, null, quantity);
      console.error('[ERROR] Fallo al guardar carrito:', saveError);
      throw new AppError('Error al actualizar el carrito', 500);
    }
  }

  async addItemWithVariant(productId, variantId, quantity = 1) {
    // Validación básica de parámetros
    if (!mongoose.isValidObjectId(productId)) {
      throw new AppError('ID de producto inválido', 400);
    }

    if (!mongoose.isValidObjectId(variantId)) {
      throw new AppError('ID de variante inválido', 400);
    }

    if (quantity < 1) {
      throw new AppError('La cantidad debe ser al menos 1', 400);
    }

    console.log(`[DEBUG] Añadiendo producto ${productId} con variante ${variantId}, cantidad: ${quantity}`);

    // 1. Verificar producto y variante
    const product = await Product.findOne({
      _id: productId,
      tenantId: this.tenantId,
      isActive: true
    }).lean();

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    if (!product.hasVariants) {
      throw new AppError('Este producto no tiene variantes. Use addItem()', 400);
    }

    const variant = await ProductVariant.findOne({
      _id: variantId,
      productId: productId,
      tenantId: this.tenantId,
      isActive: true
    }).lean();

    if (!variant) {
      throw new AppError('Variante no encontrada', 404);
    }

    // 2. Reservar stock atómicamente (producto con variantes)
    const inventoryUpdate = await Inventory.updateOne(
      {
        product_id: productId,
        tenant_id: this.tenantId,
        variant_id: variantId,
        current_stock: { $gte: quantity }
      },
      { $inc: { reserved_stock: quantity } }
    );

    if (inventoryUpdate.modifiedCount === 0) {
      const inventory = await Inventory.findOne({
        product_id: productId,
        tenant_id: this.tenantId,
        variant_id: variantId
      }).lean();
      
      const available = inventory ? inventory.current_stock - inventory.reserved_stock : 0;
      throw new AppError(
        `Stock insuficiente para la variante ${variant.sku}. Disponible: ${available}`,
        400,
        { availableStock: available }
      );
    }

    // 3. Buscar o crear carrito
    let cart = await Cart.findOne({ 
      tenantId: this.tenantId,
      user: this.userId
    });

    if (!cart) {
      cart = new Cart({
        tenantId: this.tenantId,
        user: this.userId,
        items: []
      });
    }

    // 4. Actualizar o añadir ítem
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId.toString() && 
              item.variant && item.variant.toString() === variantId.toString()
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId,
        quantity,
        price: variant.price,
        options: variant.options,
        variantInfo: {
          sku: variant.sku,
          variantOptions: variant.options
        }
      });
    }

    // 5. Guardar carrito
    try {
      const savedCart = await cart.save();
      console.log('[SUCCESS] Carrito actualizado con variante:', savedCart);
      return savedCart;
    } catch (saveError) {
      // Si falla, liberamos el stock reservado
      await this.releaseStock(productId, variantId, quantity);
      console.error('[ERROR] Fallo al guardar carrito:', saveError);
      throw new AppError('Error al actualizar el carrito', 500);
    }
  }

  async releaseStock(productId, variantId, quantity) {
    const filter = {
      product_id: productId,
      tenant_id: this.tenantId
    };

    if (variantId) {
      filter.variant_id = variantId;
    } else {
      filter.variant_id = null;
    }

    await Inventory.updateOne(
      filter,
      { $inc: { reserved_stock: -quantity } }
    );
    console.log(`[STOCK] Liberadas ${quantity} unidades de ${productId}${variantId ? ` (variante: ${variantId})` : ''}`);
  }

  async removeItem(productId, removeAll = false) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Encontrar el carrito
      const cart = await Cart.findOne({
        tenantId: this.tenantId,
        user: this.userId
      }).session(session);
  
      if (!cart) throw new AppError('Carrito no encontrado', 404);
  
      // 2. Encontrar el ítem (producto sin variantes)
      const itemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId.toString() && !item.variant
      );
      if (itemIndex === -1) throw new AppError('Ítem no encontrado', 404);
  
      const item = cart.items[itemIndex];
      const quantityToRemove = removeAll ? item.quantity : 1;
  
      // 3. Actualizar inventario (liberar stock reservado)
      await Inventory.updateOne(
        {
          product_id: productId,
          tenant_id: this.tenantId,
          variant_id: null
        },
        { $inc: { reserved_stock: -quantityToRemove } },
        { session }
      );
  
      // 4. Actualizar carrito
      if (removeAll || item.quantity <= 1) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity -= 1;
      }
  
      await cart.save({ session });
      await session.commitTransaction();
      
      return cart;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error en removeItem:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async removeItemWithVariant(productId, variantId, removeAll = false) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Encontrar el carrito
      const cart = await Cart.findOne({
        tenantId: this.tenantId,
        user: this.userId
      }).session(session);
  
      if (!cart) throw new AppError('Carrito no encontrado', 404);
  
      // 2. Encontrar el ítem (producto con variante específica)
      const itemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId.toString() && 
        item.variant && item.variant.toString() === variantId.toString()
      );
      if (itemIndex === -1) throw new AppError('Ítem no encontrado', 404);
  
      const item = cart.items[itemIndex];
      const quantityToRemove = removeAll ? item.quantity : 1;
  
      // 3. Actualizar inventario (liberar stock reservado)
      await Inventory.updateOne(
        {
          product_id: productId,
          tenant_id: this.tenantId,
          variant_id: variantId
        },
        { $inc: { reserved_stock: -quantityToRemove } },
        { session }
      );
  
      // 4. Actualizar carrito
      if (removeAll || item.quantity <= 1) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity -= 1;
      }
  
      await cart.save({ session });
      await session.commitTransaction();
      
      return cart;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error en removeItemWithVariant:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async clearCart() {
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      // 1. Encontrar y eliminar carrito
      const cart = await Cart.findOneAndDelete({
        tenantId: this.tenantId,
        user: this.userId
      }).session(session);
  
      if (!cart) throw new AppError('Carrito no encontrado', 404);
  
      // 2. Liberar todo el stock reservado
      const bulkOps = cart.items.map(item => ({
        updateOne: {
          filter: {
            product_id: item.product,
            tenant_id: this.tenantId,
            variant_id: item.variant || null
          },
          update: { $inc: { reserved_stock: -item.quantity } }
        }
      }));
  
      if (bulkOps.length > 0) {
        await Inventory.bulkWrite(bulkOps, { session });
      }
  
      await session.commitTransaction();
      return cart;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error en clearCart:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = CartService;