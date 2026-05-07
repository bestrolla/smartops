const ProfileService  =  require("../services/profile.service")
const ProfileTheme = require("../models/profileTheme.model");
const logger = require("../../../shared/logger");

const ProfileController = {
  async createOrUpdate(req, res) {
    const { tenant_id } = req.params;
    const profileFile = req.file;
    const profile = await ProfileService.createOrUpdateProfile(tenant_id, req.body, profileFile);
    res.json(profile);
  },

  async getProfile(req, res) {
    const { tenant_id } = req.params;
    const profile = await ProfileService.getProfile(tenant_id);
    res.json(profile);
  },

  async deleteProfile(req, res) {
    const { tenant_id } = req.params;
    await ProfileService.deleteProfile(tenant_id);
    res.status(204).send();
  },

  async listProfiles(req, res) {
    const { page = 1, limit = 10 } = req.query;
    const profiles = await ProfileService.listProfilesByTenant(req.query.tenantId, page, limit);
    res.json(profiles);
  },

  /**
   * Obtener todos los temas disponibles para perfiles
   */
  async getAvailableThemes(req, res) {
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
  },

  /**
   * Aplicar un tema específico al perfil de un tenant
   */
  async applyThemeToProfile(req, res) {
    try {
      const { tenant_id } = req.params;
      const { theme_id } = req.body;
      
      if (!theme_id) {
        return res.status(400).json({
          success: false,
          message: 'ID del tema es requerido'
        });
      }

      // Obtener el tema
      const theme = await ProfileTheme.findOne({ 
        id: theme_id, 
        isActive: true, 
        isPublic: true 
      });

      if (!theme) {
        return res.status(404).json({
          success: false,
          message: 'Tema no encontrado'
        });
      }

      // Preparar los datos del perfil con la configuración del tema
      const profileData = {
        theme: {
          template_id: theme.id,
          primary_color: theme.colors.primary,
          secondary_color: theme.colors.secondary,
          accent_color: theme.colors.accent,
          layout_style: theme.layout.header
        },
        profile_sections: theme.default_sections
      };

      // Si el perfil no tiene datos básicos, usar los datos de ejemplo del tema
      const existingProfile = await ProfileService.getProfile(tenant_id);
      if (!existingProfile || !existingProfile.public_name) {
        profileData.public_name = theme.sample_data.name;
        profileData.title = theme.sample_data.title;
        profileData.bio = theme.sample_data.bio;
        profileData.stats = theme.sample_data.stats;
        profileData.contact = theme.sample_data.contact;
        profileData.social_links = theme.sample_data.social_links;
      }

      // Actualizar el perfil
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, profileData);

      // Incrementar el uso del tema
      await theme.incrementUsage();

      res.json({
        success: true,
        message: 'Tema aplicado exitosamente al perfil',
        data: {
          profile: updatedProfile,
          theme: {
            id: theme.id,
            name: theme.name,
            style: theme.style
          }
        }
      });

    } catch (error) {
      logger.error('Error aplicando tema al perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Obtener un tema específico por ID
   */
  async getThemeById(req, res) {
    try {
      const { theme_id } = req.params;
      
      const theme = await ProfileTheme.findOne({ 
        id: theme_id, 
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
  },

  /**
   * Actualizar colores del perfil
   */
  async updateProfileColors(req, res) {
    try {
      const { tenant_id } = req.params;
      const { primary_color, secondary_color, accent_color, font_family } = req.body;

      // Validar que al menos un color sea proporcionado
      if (!primary_color && !secondary_color && !accent_color && !font_family) {
        return res.status(400).json({
          success: false,
          message: 'Al menos un color o fuente debe ser proporcionado'
        });
      }

      // Obtener el perfil actual
      const currentProfile = await ProfileService.getProfile(tenant_id);
      if (!currentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Preparar los datos del tema actualizados
      const updatedTheme = {
        ...currentProfile.theme,
        primary_color: primary_color || currentProfile.theme?.primary_color || '#4f46e5',
        secondary_color: secondary_color || currentProfile.theme?.secondary_color || '#7c3aed',
        accent_color: accent_color || currentProfile.theme?.accent_color || '#ffffff',
        font_family: font_family || currentProfile.theme?.font_family || 'Montserrat'
      };

      // Actualizar el perfil con los nuevos colores
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
        theme: updatedTheme
      });

      res.json({
        success: true,
        message: 'Colores del perfil actualizados exitosamente',
        data: {
          theme: updatedProfile.theme,
          profile_id: updatedProfile._id
        }
      });

    } catch (error) {
      logger.error('Error actualizando colores del perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Actualizar información de contacto del perfil
   */
  async updateContactInfo(req, res) {
    try {
      const { tenant_id } = req.params;
      const { email, phone, website } = req.body;

      // Validar que al menos un campo de contacto sea proporcionado
      if (!email && !phone && !website) {
        return res.status(400).json({
          success: false,
          message: 'Al menos un campo de contacto debe ser proporcionado'
        });
      }

      // Obtener el perfil actual
      const currentProfile = await ProfileService.getProfile(tenant_id);
      if (!currentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Preparar los datos de contacto actualizados
      const updatedContact = {
        ...currentProfile.contact,
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website })
      };

      // Actualizar el perfil con la nueva información de contacto
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
        contact: updatedContact
      });

      res.json({
        success: true,
        message: 'Información de contacto actualizada exitosamente',
        data: {
          contact: updatedProfile.contact,
          profile_id: updatedProfile._id
        }
      });

    } catch (error) {
      logger.error('Error actualizando información de contacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Obtener información de contacto del perfil
   */
  async getContactInfo(req, res) {
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
        data: {
          contact: profile.contact || {},
          profile_id: profile._id
        }
      });

    } catch (error) {
      logger.error('Error obteniendo información de contacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Obtener configuración de colores del perfil
   */
  async getProfileColors(req, res) {
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
        data: {
          theme: profile.theme || {
            primary_color: '#4f46e5',
            secondary_color: '#7c3aed',
            accent_color: '#ffffff',
            font_family: 'Montserrat'
          },
          profile_id: profile._id
        }
      });

    } catch (error) {
      logger.error('Error obteniendo colores del perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  /**
   * Actualización parcial del perfil
   */
  async partialUpdate(req, res) {
    try {
      const { tenant_id } = req.params;
      const updateData = req.body;

      // Verificar que el perfil existe
      const existingProfile = await ProfileService.getProfile(tenant_id);
      if (!existingProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Realizar la actualización parcial
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, updateData);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedProfile
      });

    } catch (error) {
      logger.error('Error en actualización parcial del perfil:', error);
      
      // Si es un error de validación, devolver detalles específicos
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};

module.exports = { ProfileController };