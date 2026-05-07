const CategoryService = require('../services/categoryService');
const logger = require('../../../shared/logger');

exports.createCategory = async (req, res, next) => {
  try {
    const categoryService = new CategoryService(req.user.tenantId);
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({
      status: 'success',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategory = async (req, res, next) => {
    try {
      const categoryService = new CategoryService(req.user.tenantId);
      const category = await categoryService.getCategoryById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: category
      });
    } catch (error) {
      next(error);
    }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categoryService = new CategoryService(req.user.tenantId);
    const categories = await categoryService.getAllCategories();
    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryTree = async (req, res, next) => {
  try {
    const categoryService = new CategoryService(req.user.tenantId);
    const tree = await categoryService.getCategoryTree();
    res.status(200).json({
      status: 'success',
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    logger.debug('Iniciando actualización de categoría en el controlador', {
      id: req.params.id,
      body: req.body
    });

    const categoryService = new CategoryService(req.user.tenantId);
    const category = await categoryService.updateCategory(req.params.id, req.body);
    
    logger.debug('Categoría actualizada exitosamente en el controlador', { category });
    
    res.status(200).json({
      status: 'success',
      message: 'Categoría actualizada exitosamente',
      data: category
    });
  } catch (error) {
    logger.error('Error al actualizar categoría en el controlador:', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    logger.debug('Iniciando eliminación de categoría en el controlador', {
      id: req.params.id
    });

    const categoryService = new CategoryService(req.user.tenantId);
    const category = await categoryService.deleteCategory(req.params.id);
    
    logger.debug('Categoría eliminada exitosamente en el controlador', { category });
    
    res.status(200).json({
      status: 'success',
      message: 'Categoría eliminada exitosamente',
      data: category
    });
  } catch (error) {
    logger.error('Error al eliminar categoría en el controlador:', {
      error: error.message,
      stack: error.stack
    });
    next(error);
  }
};