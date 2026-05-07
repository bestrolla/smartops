import api from './api';

export interface ProfileTheme {
  id: string;
  name: string;
  description: string;
  profession: string;
  style: string;
  image: string;
  preview_url: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout: {
    header: string;
    stats: string;
    services: string;
    testimonials: string;
  };
  default_sections: {
    show_stats: boolean;
    show_testimonials: boolean;
    show_contact: boolean;
    show_social: boolean;
    show_services: boolean;
    show_products: boolean;
    show_appointments: boolean;
  };
  sample_data: {
    name: string;
    title: string;
    specialty?: string;
    bio: string;
    stats: Array<{
      label: string;
      value: string;
    }>;
    contact: {
      email: string;
      phone: string;
      website: string;
    };
    social_links: Array<{
      platform: string;
      url: string;
      display_name: string;
    }>;
  };
  category: string;
  tags: string[];
  usage: {
    total_profiles: number;
    rating: number;
    reviews: Array<{
      user_id: string;
      rating: number;
      comment: string;
      date: string;
    }>;
  };
}

export interface ProfileThemesResponse {
  success: boolean;
  data: {
    themes: ProfileTheme[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ApplyThemeRequest {
  theme_id: string;
}

export interface ApplyThemeResponse {
  success: boolean;
  message: string;
  data: {
    profile: any;
    theme: {
      id: string;
      name: string;
      style: string;
    };
  };
}

class ProfileThemesApi {
  /**
   * Obtener todos los temas de perfil disponibles
   */
  async getThemes(params?: {
    category?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<ProfileThemesResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.category) queryParams.append('category', params.category);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.page) queryParams.append('page', params.page.toString());

      const response = await api.get(`/profiles/themes?${queryParams.toString()}`);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en getThemes:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtener temas por categoría
   */
  async getThemesByCategory(category: string): Promise<ProfileThemesResponse> {
    const response = await api.get(`/profiles/themes/category/${category}`);
    return response.data;
  }

  /**
   * Buscar temas
   */
  async searchThemes(query: string): Promise<ProfileThemesResponse> {
    const response = await api.get(`/profiles/themes/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Obtener tema específico por ID
   */
  async getThemeById(themeId: string): Promise<{ success: boolean; data: ProfileTheme }> {
    const response = await api.get(`/profiles/themes/${themeId}`);
    return response.data;
  }

  /**
   * Obtener temas populares
   */
  async getPopularThemes(limit: number = 10): Promise<ProfileThemesResponse> {
    const response = await api.get(`/profiles/themes/popular?limit=${limit}`);
    return response.data;
  }

  /**
   * Obtener estadísticas de temas
   */
  async getThemeStats(): Promise<{
    success: boolean;
    data: {
      total_themes: number;
      total_usage: number;
      category_stats: Array<{ _id: string; count: number }>;
      top_themes: Array<{
        id: string;
        name: string;
        usage: { total_profiles: number; rating: number };
      }>;
    };
  }> {
    const response = await api.get('/profiles/themes/stats');
    return response.data;
  }

  /**
   * Obtener temas disponibles para un tenant específico
   */
  async getTenantThemes(tenantId: string, params?: {
    category?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<ProfileThemesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const response = await api.get(`/profiles/${tenantId}/themes?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Aplicar un tema al perfil de un tenant
   */
  async applyThemeToProfile(tenantId: string, themeId: string): Promise<ApplyThemeResponse> {
    const response = await api.post(`/profiles/${tenantId}/themes/apply`, {
      theme_id: themeId
    });
    return response.data;
  }

  /**
   * Incrementar el uso de un tema
   */
  async incrementThemeUsage(themeId: string): Promise<{
    success: boolean;
    message: string;
    data: { total_profiles: number };
  }> {
    const response = await api.post(`/profiles/themes/${themeId}/usage`);
    return response.data;
  }

  /**
   * Agregar una review a un tema
   */
  async addThemeReview(themeId: string, review: {
    rating: number;
    comment?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: { rating: number; total_reviews: number };
  }> {
    const response = await api.post(`/profiles/themes/${themeId}/review`, review);
    return response.data;
  }
}

export const profileThemesApi = new ProfileThemesApi();

