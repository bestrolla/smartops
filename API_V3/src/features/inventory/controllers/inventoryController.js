const InventoryService = require('../services/inventoryService');
const { validateAdjustment } = require('../validations/invetoryValidations');
const AppError = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');
const InventoryPolicy = require('../policies/inventoryPolicy');
const Product = require('../../products/models/Product');
const Inventory = require('../models/Inventory');

class InventoryController {
  static async initializeInventory(req, res, next) {
    try {
      const { productId } = req.params;
      const { initialStock = 0 } = req.body;
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      logger.debug('Inicializando inventario:', {
        productId,
        initialStock,
        tenantId
      });

      const inventoryService = new InventoryService(tenantId);
      const inventory = await inventoryService.initializeInventory(productId, initialStock);

      res.json({
        success: true,
        data: inventory,
        message: 'Inventario inicializado correctamente'
      });
    } catch (err) {
      logger.error('Error inicializando inventario:', err);
      next(err);
    }
  }

  static async updateStock(req, res, next) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      if (typeof quantity !== 'number') {
        throw new AppError('La cantidad debe ser un número', 400);
      }

      logger.debug('Actualizando stock:', {
        productId,
        quantity,
        tenantId
      });

      const inventoryService = new InventoryService(tenantId);
      const inventory = await inventoryService.updateStock(productId, quantity);

      res.json({
        success: true,
        data: inventory,
        message: 'Stock actualizado correctamente'
      });
    } catch (err) {
      logger.error('Error actualizando stock:', err);
      next(err);
    }
  }

  static async getInventoryByProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      const inventoryService = new InventoryService(tenantId);
      const inventory = await inventoryService.getInventoryByProduct(productId);

      if (!inventory) {
        return res.json({
          success: true,
          data: {
            tenant: tenantId,
            product: productId,
            currentStock: 0,
            reservedStock: 0
          },
          message: 'Producto sin inventario inicializado'
        });
      }

      res.json({
        success: true,
        data: inventory
      });
    } catch (err) {
      logger.error('Error obteniendo inventario:', err);
      next(err);
    }
  }

  static async getStockMovements(req, res, next) {
    try {
      const { tenantId } = req.user;
      
      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      const { productId } = req.params;
      const { startDate, endDate, type } = req.query;

      const inventoryService = new InventoryService(tenantId);
      const movements = await inventoryService.getProductHistory(productId, {
        startDate,
        endDate,
        type
      });

      res.status(200).json({
        status: 'success',
        data: movements
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllInventory(req, res, next) {
    try {
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      logger.debug('Obteniendo inventario', {
        tenantId,
        query: req.query
      });

      const inventoryService = new InventoryService(tenantId);
      const result = await inventoryService.getInventory({
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        lowStockOnly: req.query.lowStockOnly === 'true'
      });

      res.status(200).json({
        status: 'success',
        data: {
          inventory: result.docs,
          total: result.totalDocs,
          pages: result.totalPages,
          page: result.page
        }
      });
    } catch (error) {
      logger.error('Error al obtener inventario', {
        error: error.message,
        stack: error.stack,
        tenantId: req.user.tenantId
      });
      next(error);
    }
  }

  static async adjustStock(req, res, next) {
    try {
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      const { productId } = req.params;
      const adjustmentData = validateAdjustment(req.body);
      
      const inventoryService = new InventoryService(tenantId);
      const result = await inventoryService.adjustStock(productId, adjustmentData);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async reserveStock(req, res, next) {
    try {
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      const inventoryService = new InventoryService(tenantId);
      const result = await inventoryService.reserveForOrder(req.body.items, {
        orderId: req.body.orderId,
        userId: req.user.id
      });

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async releaseReservation(req, res, next) {
    try {
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      const inventoryService = new InventoryService(tenantId);
      const result = await inventoryService.releaseReservation(req.body.items, {
        orderId: req.body.orderId,
        reason: req.body.reason
      });

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async syncProductStock(req, res, next) {
    try {
      const { tenantId } = req.user;

      if (!tenantId) {
        throw new AppError('Tenant no configurado', 400);
      }

      const inventoryService = new InventoryService(tenantId);
      const { productId } = req.params;
      
      const product = await Product.findOne({
        _id: productId,
        tenantId
      });

      if (!product) {
        throw new AppError('Producto no encontrado', 404);
      }

      await inventoryService.updateStock(
        productId,
        product.stock,
        'adjustment',
        {
          reason: 'Sincronización manual',
          adjustedBy: req.user.email
        }
      );
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventoryController; 