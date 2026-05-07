import { getApiUrl } from './config';

export interface Testimonial {
  _id?: string;
  name: string;
  role: string;
  content: string[];
  rating: number;
  avatar?: string;
}

export interface TestimonialsResponse {
  success: boolean;
  data: Testimonial[];
  message?: string;
}

export interface TestimonialResponse {
  success: boolean;
  data: Testimonial;
  message?: string;
}

// Obtener testimonios del perfil
export const getTestimonials = async (tenantId: string): Promise<TestimonialsResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/profiles/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data: any = await response.json().catch(() => null);
    
    if (response.ok) {
      // Manejar diferentes estructuras de respuesta de forma segura
      const testimonials = data?.data?.testimonials ?? data?.testimonials ?? [];
      return {
        success: true,
        data: Array.isArray(testimonials) ? testimonials : []
      };
    } else {
      return {
        success: false,
        data: [],
        message: data?.message || 'Error al cargar testimonios'
      };
    }
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return {
      success: false,
      data: [],
      message: 'Error de conexión'
    };
  }
};

// Agregar un testimonio
export const addTestimonial = async (tenantId: string, testimonial: Omit<Testimonial, '_id'>): Promise<TestimonialResponse> => {
  try {
    // Preparar el testimonio para enviar
    const testimonialToSend = {
      ...testimonial,
      // Convertir content de array a string si es necesario
      content: Array.isArray(testimonial.content) ? testimonial.content[0] : testimonial.content
    };
    
    console.log('🔍 Enviando testimonio al backend:', {
      tenantId,
      testimonial: testimonialToSend,
      url: `${getApiUrl()}/profiles/${tenantId}`
    });
    
    // Intentar primero con un endpoint específico para testimonios
    let response = await fetch(`${getApiUrl()}/profiles/${tenantId}/testimonials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(testimonialToSend)
    });

    // Si no existe el endpoint específico, usar el enfoque de actualizar perfil
    if (response.status === 404) {
      console.log('🔍 Endpoint específico no encontrado, usando enfoque de actualizar perfil');
      
      // Obtener testimonios existentes
      const existingResponse = await getTestimonials(tenantId);
      const existingTestimonials = existingResponse.success ? existingResponse.data : [];
      
      // Agregar el nuevo testimonio
      const updatedTestimonials = [...existingTestimonials, testimonialToSend];
      
      response = await fetch(`${getApiUrl()}/profiles/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          testimonials: updatedTestimonials
        })
      });
    }

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: testimonial as Testimonial,
        message: data.message || 'Testimonio guardado exitosamente'
      };
    } else {
      console.error('❌ Error response del backend:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return {
        success: false,
        data: testimonial as Testimonial,
        message: data.message || `Error al agregar testimonio: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('❌ Error adding testimonial:', error);
    return {
      success: false,
      data: testimonial as Testimonial,
      message: 'Error de conexión'
    };
  }
};

// Actualizar un testimonio
export const updateTestimonial = async (tenantId: string, testimonialId: string, testimonial: Partial<Testimonial>): Promise<TestimonialResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/profiles/${tenantId}/testimonials/${testimonialId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(testimonial)
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data.data
      };
    } else {
      return {
        success: false,
        data: testimonial as Testimonial,
        message: data.message || 'Error al actualizar testimonio'
      };
    }
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return {
      success: false,
      data: testimonial as Testimonial,
      message: 'Error de conexión'
    };
  }
};

// Eliminar un testimonio
export const deleteTestimonial = async (tenantId: string, testimonialId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(`${getApiUrl()}/profiles/${tenantId}/testimonials/${testimonialId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        message: data.message || 'Error al eliminar testimonio'
      };
    }
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return {
      success: false,
      message: 'Error de conexión'
    };
  }
};