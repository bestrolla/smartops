const ProfileService = require("../services/profile.service");
const logger = require("../../../shared/logger");

const TestimonialsController = {
  /**
   * Obtener testimonios de un perfil
   */
  async getTestimonials(req, res) {
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
        data: profile.testimonials || []
      });
    } catch (error) {
      logger.error('Error obteniendo testimonios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Agregar un testimonio al perfil
   */
  async addTestimonial(req, res) {
    try {
      const { tenant_id } = req.params;
      const testimonialData = req.body;

      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Agregar el nuevo testimonio
      const testimonials = profile.testimonials || [];
      testimonials.push(testimonialData);

      // Actualizar el perfil
      const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
        testimonials: testimonials
      });

      res.json({
        success: true,
        message: 'Testimonio agregado exitosamente',
        data: testimonialData
      });
    } catch (error) {
      logger.error('Error agregando testimonio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Agregar múltiples testimonios o reemplazar array completo
   */
  async addMultipleTestimonials(req, res) {
    try {
      const { tenant_id } = req.params;
      const { testimonials: newTestimonials } = req.body;

      if (!Array.isArray(newTestimonials)) {
        return res.status(400).json({
          success: false,
          message: 'Los testimonios deben ser un array'
        });
      }

      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      // Si solo hay un testimonio nuevo, agregarlo al principio
      if (newTestimonials.length === 1) {
        const existingTestimonials = profile.testimonials || [];
        const updatedTestimonials = [newTestimonials[0], ...existingTestimonials];
        
        const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
          testimonials: updatedTestimonials
        });

        res.json({
          success: true,
          message: 'Testimonio agregado exitosamente',
          data: newTestimonials[0]
        });
      } else {
        // Si hay múltiples testimonios, reemplazar el array completo
        const updatedProfile = await ProfileService.createOrUpdateProfile(tenant_id, {
          testimonials: newTestimonials
        });

        res.json({
          success: true,
          message: 'Testimonios actualizados exitosamente',
          data: updatedProfile.testimonials
        });
      }

    } catch (error) {
      logger.error('Error agregando múltiples testimonios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Actualizar un testimonio específico
   */
  async updateTestimonial(req, res) {
    try {
      const { tenant_id, testimonial_id } = req.params;
      const testimonialData = req.body;

      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      const testimonials = profile.testimonials || [];
      const testimonialIndex = testimonials.findIndex(t => t._id.toString() === testimonial_id);
      
      if (testimonialIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Testimonio no encontrado'
        });
      }

      // Actualizar el testimonio manteniendo su posición
      testimonials[testimonialIndex] = {
        ...testimonials[testimonialIndex],
        ...testimonialData
      };

      // Actualizar el perfil
      await ProfileService.createOrUpdateProfile(tenant_id, {
        testimonials: testimonials
      });

      res.json({
        success: true,
        message: 'Testimonio actualizado exitosamente',
        data: testimonials[testimonialIndex]
      });
    } catch (error) {
      logger.error('Error actualizando testimonio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Eliminar un testimonio específico
   */
  async deleteTestimonial(req, res) {
    try {
      const { tenant_id, testimonial_id } = req.params;

      const profile = await ProfileService.getProfile(tenant_id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil no encontrado'
        });
      }

      const testimonials = profile.testimonials || [];
      const filteredTestimonials = testimonials.filter(t => t._id.toString() !== testimonial_id);

      if (filteredTestimonials.length === testimonials.length) {
        return res.status(404).json({
          success: false,
          message: 'Testimonio no encontrado'
        });
      }

      // Actualizar el perfil
      await ProfileService.createOrUpdateProfile(tenant_id, {
        testimonials: filteredTestimonials
      });

      res.json({
        success: true,
        message: 'Testimonio eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando testimonio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = { TestimonialsController };
