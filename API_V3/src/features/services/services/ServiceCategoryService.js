const ServiceCategory = require('../models/ServiceCategory.model');
const { createError } = require('../../../shared/errors.utils');

class ServiceCategoryService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async createCategory(categoryData) {
    try {
      const category = new ServiceCategory({
        ...categoryData,
        tenantId: this.tenantId
      });

      await category.save();
      return category;
    } catch (error) {
      if (error.code === 11000) {
        throw createError(400, 'Category with this name already exists');
      }
      throw createError(500, 'Error creating category: ' + error.message);
    }
  }

  async getAllCategories(filters = {}) {
    try {
      const query = { tenantId: this.tenantId };

      // Aplicar filtros
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.parentCategory !== undefined) {
        query.parentCategory = filters.parentCategory || null;
      }

      const categories = await ServiceCategory.find(query)
        .populate('parentCategory', 'name')
        .populate('subcategories')
        .sort({ name: 1 });

      return categories;
    } catch (error) {
      throw createError(500, 'Error fetching categories: ' + error.message);
    }
  }

  async getCategoryById(categoryId) {
    try {
      const category = await ServiceCategory.findOne({
        _id: categoryId,
        tenantId: this.tenantId
      })
        .populate('parentCategory', 'name')
        .populate('subcategories');

      if (!category) {
        throw createError(404, 'Category not found');
      }

      return category;
    } catch (error) {
      if (error.statusCode) throw error;
      throw createError(500, 'Error fetching category: ' + error.message);
    }
  }

  async updateCategory(categoryId, updateData) {
    try {
      const category = await ServiceCategory.findOneAndUpdate(
        { _id: categoryId, tenantId: this.tenantId },
        updateData,
        { new: true, runValidators: true }
      )
        .populate('parentCategory', 'name')
        .populate('subcategories');

      if (!category) {
        throw createError(404, 'Category not found');
      }

      return category;
    } catch (error) {
      if (error.statusCode) throw error;
      if (error.code === 11000) {
        throw createError(400, 'Category with this name already exists');
      }
      throw createError(500, 'Error updating category: ' + error.message);
    }
  }

  async deleteCategory(categoryId) {
    try {
      // Verificar si la categoría existe
      const category = await ServiceCategory.findOne({
        _id: categoryId,
        tenantId: this.tenantId
      });

      if (!category) {
        throw createError(404, 'Category not found');
      }

      // Verificar si hay servicios usando esta categoría
      const Service = require('../models/Service.model');
      const servicesUsingCategory = await Service.countDocuments({
        categoryId: categoryId,
        tenantId: this.tenantId
      });

      if (servicesUsingCategory > 0) {
        throw createError(400, 'Cannot delete category that is being used by services');
      }

      // Verificar si hay subcategorías
      const subcategories = await ServiceCategory.countDocuments({
        parentCategory: categoryId,
        tenantId: this.tenantId
      });

      if (subcategories > 0) {
        throw createError(400, 'Cannot delete category that has subcategories');
      }

      await ServiceCategory.findByIdAndDelete(categoryId);
      return { deleted: true };
    } catch (error) {
      if (error.statusCode) throw error;
      throw createError(500, 'Error deleting category: ' + error.message);
    }
  }

  async getPublicCategories() {
    try {
      // For public routes, we only want to show active categories
      return await this.getAllCategories({ isActive: true });
    } catch (error) {
      // Re-throw error to be caught by the controller's error handler
      throw error;
    }
  }
}

module.exports = ServiceCategoryService;