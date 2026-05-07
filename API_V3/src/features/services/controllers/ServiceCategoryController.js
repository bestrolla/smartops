const ServiceCategoryService = require('../services/ServiceCategoryService');
const { createError } = require('../../../shared/errors.utils');

class ServiceCategoryController {
  static async create(req, res, next) {
    try {
      const { tenantId, body } = req;
      
      const service = new ServiceCategoryService(tenantId);
      const category = await service.createCategory(body);
      
      res.status(201).json({
        status: 'success',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req, res, next) {
    try {
      const { tenantId, query } = req;
      
      const service = new ServiceCategoryService(tenantId);
      const categories = await service.getAllCategories(query);
      
      res.json({
        status: 'success',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategory(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = new ServiceCategoryService(tenantId);
      const category = await service.getCategoryById(id);
      
      res.json({
        status: 'success',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const { tenantId, params: { id }, body } = req;
      
      const service = new ServiceCategoryService(tenantId);
      const category = await service.updateCategory(id, body);
      
      res.json({
        status: 'success',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const { tenantId, params: { id } } = req;
      
      const service = new ServiceCategoryService(tenantId);
      await service.deleteCategory(id);
      
      res.json({
        status: 'success',
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Métodos públicos (sin autenticación)
  static async getPublicCategories(tenantId) {
    try {
      const service = new ServiceCategoryService(tenantId);
      return await service.getPublicCategories();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ServiceCategoryController;