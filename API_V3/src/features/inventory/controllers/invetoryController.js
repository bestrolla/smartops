const InventoryService = require('../services/invetoryService');
const { validateAdjustment } = require('../validations/invetoryValidations');
const AppError = require('../../../shared/errors.utils');
const InventoryPolicy = require('../policies/inventoryPolicy');
const Product = require('../../products/models/Product');
const Inventory = require('../models/Inventory');

class InventoryController {

  async createInventory(req, res, next) {
    try {
      const { productId, initialStock = 0 } = req.body;
      
      const inventoryService = new InventoryService(req.tenant.id);
      const inventory = await inventoryService.createInventory(productId, initialStock);
      
      res.status(201).json({
        status: 'success',
        data: inventory
      });
    } catch (error) {
      next(error);
    }
  }

  async getStockMovements(req, res, next) {
    try {
      if (!req.tenant?.id) {
        throw new AppError('Tenant no configurado', 500);
      }
  
      const inventoryService = new InventoryService(req.tenant.id);
      const movements = await inventoryService.getProductHistory(
        req.params.productId,
        {
          startDate: req.query.startDate,
          endDate: req.query.endDate,
          type: req.query.type
        }
      );
  
      res.status(200).json({
        status: 'success',
        data: movements
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventory(req, res, next) {
    try {
      if (!req.tenant?.id) {
        throw new Error('Tenant no configurado');
      }

      const inventoryService = new InventoryService(req.tenant.id);
      const result = await inventoryService.getInventory({
        page: req.query.page || 1,
        limit: req.query.limit || 50,
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
      next(error);
    }
  }

  async adjustStock(req, res, next) {
    try {
      if (!req.tenant?.id) {
        throw new AppError('Tenant no configurado', 500);
      }
  
      // 1. Instanciar el servicio con el tenant
      const inventoryService = new InventoryService(req.tenant.id);
  
      // 2. Validar permisos
      if (!InventoryPolicy.checkPermission(req.user, 'adjust')) {
        throw new AppError('No autorizado para ajustar inventario', 403);
      }
  
      // 3. Validar datos
      const { error } = validateAdjustment(req.body);
      if (error) throw new AppError('Datos inválidos', 400, error.details);
  
      // 4. Llamar al método de la instancia
      const result = await inventoryService.adjustStock(
        req.body.productId,
        req.body.delta,
        {
          type: 'adjustment',
          reference_id: req.user._id,
          metadata: {
            reason: req.body.reason,
            adjustedBy: req.user.email
          }
        }
      );
  
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveStock(req, res, next) {
    try {
      //console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
      
      if (!req.body.items || !Array.isArray(req.body.items)) {
        throw new AppError('Se requiere un array de items', 400);
      }
      
      // Normalizar los items
      const normalizedItems = req.body.items.map(item => {
        if (!item.productId && !item.product) {
          throw new AppError('Cada item debe tener productId o product', 400);
        }
        
        return {
          product: item.productId || item.product,
          quantity: item.quantity
        };
      });
      
      //console.log('Items normalizados:', JSON.stringify(normalizedItems, null, 2));
      
      const inventoryService = new InventoryService(req.tenant.id);
      const result = await inventoryService.reserveForOrder(normalizedItems);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Error en reserveStock:', error);
      next(error);
    }
  }

  async releaseStock(req, res, next) {
    try {
      if (!req.body.items || !Array.isArray(req.body.items)) {
        throw new AppError('Se requiere un array de items', 400);
      }
  
      // Normalizar items (similar a reserveStock)
      const normalizedItems = req.body.items.map(item => ({
        product: item.productId || item.product,
        quantity: item.quantity
      }));
  
      const inventoryService = new InventoryService(req.tenant.id);
      const result = await inventoryService.releaseStock(normalizedItems);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async syncProductStock(req, res, next) {
    try {
      const inventoryService = new InventoryService(req.tenant.id);
      const product = await Product.findById(req.params.productId);
      
      await Inventory.updateOne(
        { product_id: req.params.productId },
        { $set: { current_stock: product.stock } }
      );
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
  
}

module.exports = new InventoryController();