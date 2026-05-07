const ProfileTheme = require('../models/profileTheme.model');
const logger = require('../../../shared/logger');

class ProfileThemeController {
  /**
   * Obtener todos los temas de perfiles disponibles
   */
  async getAllThemes(req, res) {
    try {
      const { category, search, limit = 20, page = 1 } = req.query;
      
      let query = { isActive: true, isPublic: true };
      
      // Filtrar por categoría
      if (category) {
        query.category = category;
      }
      
      // Búsqueda por texto
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { profession: { $regex: search, $options: 'i' } },
          { style: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      const skip = (page - 1) * limit;
      
      const themes = await ProfileTheme.find(query)
        .sort({ 'usage.rating': -1, 'usage.total_profiles': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v');
      
      const total = await ProfileTheme.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          themes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
      
    } catch (error) {
      logger.error('Error obteniendo temas de perfiles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener un tema específico por ID
   */
  async getThemeById(req, res) {
    try {
      const { id } = req.params;
      
      const theme = await ProfileTheme.findOne({ 
        id, 
        isActive: true, 
        isPublic: true 
      }).select('-__v');
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'Tema no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: theme
      });
      
    } catch (error) {
      logger.error('Error obteniendo tema por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener temas por categoría
   */
  async getThemesByCategory(req, res) {
    try {
      const { category } = req.params;
      
      const themes = await ProfileTheme.getByCategory(category);
      
      res.json({
        success: true,
        data: themes
      });
      
    } catch (error) {
      logger.error('Error obteniendo temas por categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener temas populares
   */
  async getPopularThemes(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const themes = await ProfileTheme.getPopular(parseInt(limit));
      
      res.json({
        success: true,
        data: themes
      });
      
    } catch (error) {
      logger.error('Error obteniendo temas populares:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Buscar temas
   */
  async searchThemes(req, res) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Query de búsqueda requerida'
        });
      }
      
      const themes = await ProfileTheme.search(q);
      
      res.json({
        success: true,
        data: themes
      });
      
    } catch (error) {
      logger.error('Error buscando temas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Incrementar uso de un tema
   */
  async incrementThemeUsage(req, res) {
    try {
      const { id } = req.params;
      
      const theme = await ProfileTheme.findOne({ id });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'Tema no encontrado'
        });
      }
      
      await theme.incrementUsage();
      
      res.json({
        success: true,
        message: 'Uso del tema incrementado',
        data: {
          total_profiles: theme.usage.total_profiles
        }
      });
      
    } catch (error) {
      logger.error('Error incrementando uso del tema:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Agregar review a un tema
   */
  async addThemeReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user?.id;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating debe estar entre 1 y 5'
        });
      }
      
      const theme = await ProfileTheme.findOne({ id });
      
      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'Tema no encontrado'
        });
      }
      
      const review = {
        user_id: userId,
        rating: parseInt(rating),
        comment: comment || '',
        date: new Date()
      };
      
      await theme.addReview(review);
      
      res.json({
        success: true,
        message: 'Review agregada exitosamente',
        data: {
          rating: theme.usage.rating,
          total_reviews: theme.usage.reviews.length
        }
      });
      
    } catch (error) {
      logger.error('Error agregando review al tema:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
  
  /**
   * Obtener estadísticas de temas
   */
  async getThemeStats(req, res) {
    try {
      const totalThemes = await ProfileTheme.countDocuments({ isActive: true, isPublic: true });
      const totalUsage = await ProfileTheme.aggregate([
        { $match: { isActive: true, isPublic: true } },
        { $group: { _id: null, total: { $sum: '$usage.total_profiles' } } }
      ]);
      
      const categoryStats = await ProfileTheme.aggregate([
        { $match: { isActive: true, isPublic: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      const topThemes = await ProfileTheme.find({ isActive: true, isPublic: true })
        .sort({ 'usage.total_profiles': -1 })
        .limit(5)
        .select('id name usage.total_profiles usage.rating');
      
      res.json({
        success: true,
        data: {
          total_themes: totalThemes,
          total_usage: totalUsage[0]?.total || 0,
          category_stats: categoryStats,
          top_themes: topThemes
        }
      });
      
    } catch (error) {
      logger.error('Error obteniendo estadísticas de temas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = new ProfileThemeController();
