const CartService = require('../services/CartService');
const AppError = require('../../../shared/errors.utils');

class CartController {
  async getCart(req, res, next) {
    try {
      // Obtén el tenantId correctamente del objeto tenant
      const tenantId = req.user.tenantId;
      const userId = req.user.userId;
      const cartService = new CartService(tenantId, userId);
      
      const cart = await cartService.getCart();
      res.json({
        success: true,
        data: cart || { items: [], total: 0 }
      });
    } catch (err) {
      next(err);
    }
  }

  async addItem(req, res, next) {
    try {
      // Obtén el tenantId correctamente del objeto tenant
      const tenantId = req.user.tenantId;
      const userId = req.user.userId;
      
      
      if (!tenantId) throw new AppError('tenantId no disponible', 500);
      if (!userId) throw new AppError('Usuario no autenticado', 401);
  
      const { productId, variantId, quantity } = req.body;
      const cartService = new CartService(tenantId, userId);
      
      // Validar que se proporcione variantId si el producto lo requiere
      if (variantId) {
        const cart = await cartService.addItemWithVariant(productId, variantId, quantity);
        res.json({ success: true, data: cart });
      } else {
        const cart = await cartService.addItem(productId, quantity);
        res.json({ success: true, data: cart });
      }
    } catch (err) {
      next(err);
    }
  }

  async removeItem(req, res, next) {
    try {
      // Obtén el tenantId correctamente del objeto tenant
      const tenantId = req.user.tenantId;
      const userId = req.user.userId;
      const { productId, variantId } = req.params;
      const { removeAll } = req.query;
      
      const cartService = new CartService(tenantId, userId);
      
      // Si se proporciona variantId, remover item específico de la variante
      if (variantId) {
        const cart = await cartService.removeItemWithVariant(productId, variantId, removeAll === 'true');
        res.json({
          success: true,
          data: cart
        });
      } else {
        const cart = await cartService.removeItem(productId, removeAll === 'true');
        res.json({
          success: true,
          data: cart
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async clearCart(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.userId;
      const cartService = new CartService(tenantId, userId);
      
      await cartService.clearCart();
      res.json({ success: true, message: 'Carrito vaciado' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CartController();