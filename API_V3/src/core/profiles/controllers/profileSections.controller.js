const ProfileService = require("../services/profile.service");

const ProfileSectionsController = {
  /**
   * Obtener las secciones disponibles para el perfil basado en las features del tenant
   */
  async getAvailableSections(req, res) {
    try {
      const { tenant_id } = req.params;
      
      // Obtener el tenant con sus features
      const tenant = await require('../../tenant/models/tenant.model').findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      // Definir qué secciones están disponibles según las features
      const availableSections = {
        basic: {
          show_stats: true,
          show_testimonials: true,
          show_contact: true,
          show_social: true
        },
        conditional: {
          show_services: tenant.features.services || false,
          show_products: tenant.features.ecommerce || tenant.features.products || false,
          show_appointments: tenant.features.appointments || false
        }
      };

      // Obtener la configuración actual del perfil si existe
      const profile = await ProfileService.getProfile(tenant_id);
      const currentSections = profile?.profile_sections || {};

      res.json({
        success: true,
        data: {
          tenant_features: tenant.features,
          available_sections: availableSections,
          current_configuration: currentSections,
          all_sections: {
            show_services: {
              available: availableSections.conditional.show_services,
              enabled: currentSections.show_services || false,
              label: 'Mostrar Servicios',
              description: 'Muestra los servicios que ofreces'
            },
            show_products: {
              available: availableSections.conditional.show_products,
              enabled: currentSections.show_products || false,
              label: 'Mostrar Productos',
              description: 'Muestra tu catálogo de productos'
            },
            show_appointments: {
              available: availableSections.conditional.show_appointments,
              enabled: currentSections.show_appointments || false,
              label: 'Mostrar Citas',
              description: 'Permite agendar citas contigo'
            },
            show_stats: {
              available: availableSections.basic.show_stats,
              enabled: currentSections.show_stats !== false, // Por defecto true
              label: 'Mostrar Estadísticas',
              description: 'Muestra tus logros y números importantes'
            },
            show_testimonials: {
              available: availableSections.basic.show_testimonials,
              enabled: currentSections.show_testimonials !== false, // Por defecto true
              label: 'Mostrar Testimonios',
              description: 'Muestra reseñas de tus clientes'
            },
            show_contact: {
              available: availableSections.basic.show_contact,
              enabled: currentSections.show_contact !== false, // Por defecto true
              label: 'Mostrar Contacto',
              description: 'Muestra tu información de contacto'
            },
            show_social: {
              available: availableSections.basic.show_social,
              enabled: currentSections.show_social !== false, // Por defecto true
              label: 'Mostrar Redes Sociales',
              description: 'Muestra enlaces a tus redes sociales'
            }
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo secciones disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Actualizar la configuración de secciones del perfil
   */
  async updateSections(req, res) {
    try {
      const { tenant_id } = req.params;
      const { profile_sections } = req.body;

      // Validar que el tenant existe
      const tenant = await require('../../tenant/models/tenant.model').findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      // Validar que las secciones solicitadas están disponibles según las features
      const requestedSections = Object.keys(profile_sections);
      for (const section of requestedSections) {
        if (section === 'show_services' && !tenant.features.services) {
          return res.status(400).json({
            success: false,
            message: 'La sección de servicios no está disponible en tu plan'
          });
        }
        if (section === 'show_products' && !tenant.features.ecommerce && !tenant.features.products) {
          return res.status(400).json({
            success: false,
            message: 'La sección de productos no está disponible en tu plan'
          });
        }
        if (section === 'show_appointments' && !tenant.features.appointments) {
          return res.status(400).json({
            success: false,
            message: 'La sección de citas no está disponible en tu plan'
          });
        }
      }

      // Actualizar o crear el perfil con las nuevas secciones
      const profile = await ProfileService.createOrUpdateProfile(tenant_id, { profile_sections });

      res.json({
        success: true,
        message: 'Configuración de secciones actualizada exitosamente',
        data: profile
      });
    } catch (error) {
      console.error('Error actualizando secciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Actualizar el orden de las secciones del perfil
   */
  async updateSectionOrder(req, res) {
    try {
      const { tenant_id } = req.params;
      const { section_order } = req.body;

      // Validar que el tenant existe
      const tenant = await require('../../tenant/models/tenant.model').findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      // Validar que section_order sea un array
      if (!Array.isArray(section_order)) {
        return res.status(400).json({
          success: false,
          message: 'section_order debe ser un array'
        });
      }

      // Validar que las secciones en el orden están disponibles
      const availableSections = [
        'header', 'stats', 'services', 'products', 'testimonials', 
        'contact', 'location', 'social', 'appointments'
      ];

      for (const section of section_order) {
        if (!availableSections.includes(section)) {
          return res.status(400).json({
            success: false,
            message: `Sección '${section}' no es válida`
          });
        }
      }

      // Obtener el perfil actual
      const currentProfile = await ProfileService.getProfile(tenant_id);
      if (!currentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Actualizar el perfil con el nuevo orden de secciones
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
        section_order: section_order
      });

      res.json({
        success: true,
        message: 'Orden de secciones actualizado exitosamente',
        data: {
          section_order: updatedProfile.section_order,
          profile_id: updatedProfile._id
        }
      });

    } catch (error) {
      console.error('Error actualizando orden de secciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Obtener el orden actual de las secciones del perfil
   */
  async getSectionOrder(req, res) {
    try {
      const { tenant_id } = req.params;

      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Orden por defecto si no existe
      const defaultOrder = [
        'header', 'stats', 'services', 'products', 'testimonials', 
        'contact', 'location', 'social', 'appointments'
      ];

      res.json({
        success: true,
        data: {
          section_order: profile.section_order || defaultOrder,
          profile_id: profile._id
        }
      });

    } catch (error) {
      console.error('Error obteniendo orden de secciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Obtener todas las secciones disponibles con su configuración completa
   */
  async getAllSectionsConfig(req, res) {
    try {
      const { tenant_id } = req.params;
      
      // Obtener el tenant con sus features
      const tenant = await require('../../tenant/models/tenant.model').findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant no encontrado'
        });
      }

      // Obtener la configuración actual del perfil
      const profile = await ProfileService.getProfile(tenant_id);
      const currentSections = profile?.profile_sections || {};
      const currentOrder = profile?.section_order || [
        'header', 'stats', 'services', 'products', 'testimonials', 
        'contact', 'location', 'social', 'appointments'
      ];

      // Definir todas las secciones disponibles
      const allSections = {
        header: {
          id: 'header',
          name: 'Encabezado',
          description: 'Información principal del perfil',
          available: true,
          enabled: true,
          order: currentOrder.indexOf('header'),
          icon: 'user',
          category: 'basic'
        },
        stats: {
          id: 'stats',
          name: 'Estadísticas',
          description: 'Muestra tus logros y números importantes',
          available: true,
          enabled: currentSections.show_stats !== false,
          order: currentOrder.indexOf('stats'),
          icon: 'chart-bar',
          category: 'basic'
        },
        services: {
          id: 'services',
          name: 'Servicios',
          description: 'Muestra los servicios que ofreces',
          available: tenant.features.services || false,
          enabled: currentSections.show_services || false,
          order: currentOrder.indexOf('services'),
          icon: 'briefcase',
          category: 'conditional'
        },
        products: {
          id: 'products',
          name: 'Productos',
          description: 'Muestra tu catálogo de productos',
          available: tenant.features.ecommerce || tenant.features.products || false,
          enabled: currentSections.show_products || false,
          order: currentOrder.indexOf('products'),
          icon: 'shopping-bag',
          category: 'conditional'
        },
        testimonials: {
          id: 'testimonials',
          name: 'Testimonios',
          description: 'Muestra reseñas de tus clientes',
          available: true,
          enabled: currentSections.show_testimonials !== false,
          order: currentOrder.indexOf('testimonials'),
          icon: 'star',
          category: 'basic'
        },
        contact: {
          id: 'contact',
          name: 'Contacto',
          description: 'Muestra tu información de contacto',
          available: true,
          enabled: currentSections.show_contact !== false,
          order: currentOrder.indexOf('contact'),
          icon: 'phone',
          category: 'basic'
        },
        location: {
          id: 'location',
          name: 'Ubicación',
          description: 'Muestra tu ubicación y horarios de negocio',
          available: true,
          enabled: currentSections.show_location !== false,
          order: currentOrder.indexOf('location'),
          icon: 'map-pin',
          category: 'basic'
        },
        social: {
          id: 'social',
          name: 'Redes Sociales',
          description: 'Muestra enlaces a tus redes sociales',
          available: true,
          enabled: currentSections.show_social !== false,
          order: currentOrder.indexOf('social'),
          icon: 'share',
          category: 'basic'
        },
        appointments: {
          id: 'appointments',
          name: 'Citas',
          description: 'Permite agendar citas contigo',
          available: tenant.features.appointments || false,
          enabled: currentSections.show_appointments || false,
          order: currentOrder.indexOf('appointments'),
          icon: 'calendar',
          category: 'conditional'
        }
      };

      res.json({
        success: true,
        data: {
          tenant_features: tenant.features,
          sections: allSections,
          current_order: currentOrder,
          profile_id: profile?._id
        }
      });

    } catch (error) {
      console.error('Error obteniendo configuración de secciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = { ProfileSectionsController };
