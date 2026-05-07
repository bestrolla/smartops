const OrderService = require('../services/orderService');
const { validateCreateOrder, validateUpdateOrder } = require('../validations/orderValidations');
const AppError = require('../../../shared/errors.utils');
const OrderPolicy = require('../policies/orderPolicy');

class OrderController {
  
  async createOrder(req, res, next) {
    try {
      const { error, value } = validateCreateOrder(req.body);
      if (error) {
        throw new AppError('Datos de orden inválidos', 400, {
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        });
      }
  
      const orderService = new OrderService(req.user.tenantId);
      const order = await orderService.createOrder({
        ...value,
        userId: req.user._id
      });
  
      res.status(201).json({
        status: 'success',
        data: order
      });
    } catch (error) {
      next(error);
    }
  };
  
  async getOrders(req, res, next) {
    try {
      const orderService = new OrderService(req.user.tenantId);
      const result = await orderService.getOrders(req.query);
      
      res.json({
        status: 'success',
        data: {
          orders: result.docs,
          total: result.totalDocs,
          pages: result.totalPages,
          page: result.page
        }
      });
    } catch (error) {
      next(error);
    }
  };
  
  async getOrderDetails(req, res, next) {
    try {
      const orderService = new OrderService(req.user.tenantId);
      const order = await orderService.getOrderDetails(req.params.id);
      
      res.json({
        status: 'success',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateOrderStatus(req, res, next) {
    try {
      // 1. Validar los datos de entrada
      const { error } = validateUpdateOrder(req.body);
      if (error) {
        throw new AppError('Datos de actualización inválidos', 400, {
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        });
      }
  
      // 2. Crear instancia del servicio
      const orderService = new OrderService(req.user.tenantId);
      
      // 3. Actualizar el estado
      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.user._id
      );
      
      // 4. Responder con la orden actualizada
      res.json({
        status: 'success',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
  
  async cancelOrder(req, res, next) {
    try {
      const orderService = new OrderService(req.user.tenantId);
      const order = await orderService.cancelOrder(
        req.params.id,
        req.user._id
      );
      
      res.json({
        status: 'success',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();