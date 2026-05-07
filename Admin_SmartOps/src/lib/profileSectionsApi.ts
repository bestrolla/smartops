import api from './api';

export interface ProfileSection {
  available: boolean;
  enabled: boolean;
  label: string;
  description: string;
}

export interface ProfileSectionsResponse {
  tenant_features: {
    appointments: boolean;
    crm: boolean;
    ecommerce: boolean;
    inventory: boolean;
    orders: boolean;
    products: boolean;
    professionals: boolean;
    services: boolean;
    customDomain: boolean;
  };
  available_sections: {
    basic: {
      show_stats: boolean;
      show_testimonials: boolean;
      show_contact: boolean;
      show_social: boolean;
    };
    conditional: {
      show_services: boolean;
      show_products: boolean;
      show_appointments: boolean;
    };
  };
  current_configuration: {
    show_services?: boolean;
    show_products?: boolean;
    show_appointments?: boolean;
    show_stats?: boolean;
    show_testimonials?: boolean;
    show_contact?: boolean;
    show_social?: boolean;
  };
  all_sections: {
    [key: string]: ProfileSection;
  };
}

export interface ProfileSectionsConfig {
  show_services?: boolean;
  show_products?: boolean;
  show_appointments?: boolean;
  show_stats?: boolean;
  show_testimonials?: boolean;
  show_contact?: boolean;
  show_social?: boolean;
}

// Obtener las secciones disponibles del perfil
export const getProfileSections = async (tenantId: string): Promise<ProfileSectionsResponse> => {
  const response = await api.get(`/profiles/${tenantId}/sections`);
  return response.data.data;
};

// Actualizar configuración de secciones del perfil
export const updateProfileSections = async (
  tenantId: string, 
  sectionsConfig: ProfileSectionsConfig
): Promise<any> => {
  const response = await api.put(`/profiles/${tenantId}/sections`, {
    profile_sections: sectionsConfig
  });
  return response.data;
};
