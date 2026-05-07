const Category = require('../models/Category');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');

class CategoryService {
    constructor(tenantId) {
      this.tenantId = tenantId;
    }
  
    async createCategory(categoryData) {
      const category = await Category.create({
        ...categoryData,
        tenantId: this.tenantId
      });
      return category;
    }
  
    async getCategoryById(id) {
        const category = await Category.findOne({ 
          _id: id, 
          tenantId: this.tenantId 
        }).populate('parentCategory');
      
        if (!category) throw createError(404, 'Categoría no encontrada');
        return category;
    }
  
    async getAllCategories() {
        return await Category.find({ tenantId: this.tenantId })
          .populate('parentCategory')
          .lean();
    }
  
    async updateCategory(id, updateData) {
      try {
        logger.debug('Iniciando actualización de categoría', { id, updateData });
        
        // Validar que el ID sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
          logger.error('ID de categoría inválido', { id });
          throw createError(400, 'ID de categoría inválido');
        }

        // Validar que no se intente actualizar el tenantId
        if (updateData.tenantId) {
          delete updateData.tenantId;
        }

        // Convertir parentId a parentCategory si existe
        if (updateData.parentId) {
          updateData.parentCategory = updateData.parentId;
          delete updateData.parentId;
        }

        logger.debug('Buscando y actualizando categoría', { id, tenantId: this.tenantId });
        const category = await Category.findOneAndUpdate(
          { _id: id, tenantId: this.tenantId },
          updateData,
          { new: true, runValidators: true }
        );
        
        if (!category) {
          logger.error('Categoría no encontrada', { id, tenantId: this.tenantId });
          throw createError(404, 'Categoría no encontrada');
        }

        logger.debug('Categoría actualizada exitosamente', { category });
        return category;
      } catch (error) {
        logger.error('Error en updateCategory:', error);
        if (error instanceof mongoose.Error.ValidationError) {
          throw createError(400, 'Datos de categoría inválidos: ' + error.message);
        }
        throw error;
      }
    }
  
    async deleteCategory(id) {
      try {
        logger.debug('Iniciando eliminación de categoría', { id });
        
        // Validar que el ID sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
          logger.error('ID de categoría inválido', { id });
          throw createError(400, 'ID de categoría inválido');
        }

        // Realizar soft delete (marcar como inactivo)
        const category = await Category.findOneAndUpdate(
          { _id: id, tenantId: this.tenantId },
          { isActive: false },
          { new: true }
        );
        
        if (!category) {
          logger.error('Categoría no encontrada', { id, tenantId: this.tenantId });
          throw createError(404, 'Categoría no encontrada');
        }

        logger.debug('Categoría eliminada exitosamente', { category });
        return category;
      } catch (error) {
        logger.error('Error en deleteCategory:', error);
        throw error;
      }
    }
  
    async getCategoryTree() {
      const categories = await this.getAllCategories();
      return this.buildTree(categories);
    }
  
    buildTree(categories, parentId = null) {
      const tree = [];
      
      // Convierte primero todos los documentos Mongoose a objetos simples
      const plainCategories = categories.map(cat => 
        cat instanceof mongoose.Document ? cat.toObject() : cat
      );
    
      const filtered = plainCategories.filter(cat => {
        const catParent = cat.parentCategory || null;
        const compareParent = parentId ? 
          (catParent && catParent.toString() === parentId.toString()) : 
          !catParent;
        return compareParent;
      });
    
      for (const category of filtered) {
        tree.push({
          ...category,
          children: this.buildTree(plainCategories, category._id)
        });
      }
      return tree;
    }
  }
  
  module.exports = CategoryService;