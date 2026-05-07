const ProfileService = require("../services/profile.service");
const logger = require("../../../shared/logger");

const LocationController = {
  /**
   * Obtener ubicación de un perfil
   */
  async getLocation(req, res) {
    try {
      const { tenant_id } = req.params;
      
      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      res.json({
        success: true,
        data: profile.location || {}
      });
    } catch (error) {
      logger.error('Error obteniendo ubicación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Actualizar ubicación del perfil
   */
  async updateLocation(req, res) {
    try {
      const { tenant_id } = req.params;
      const locationData = req.body;

      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Actualizar el perfil con la nueva ubicación
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
        location: locationData
      });

      res.json({
        success: true,
        message: 'Ubicación actualizada exitosamente',
        data: updatedProfile.location
      });
    } catch (error) {
      logger.error('Error actualizando ubicación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = { LocationController };
