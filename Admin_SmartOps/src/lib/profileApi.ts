import api  from './api';

import { SocialLink, Service, Contact, PublicProfileResponse } from '@/types/profile';
import { Location } from './locationApi';
export type { SocialLink, Service, Contact };

interface ApiContact {
  email?: string;
  phone?: string;
  website?: string;
}

export interface Stat {
  label: string;
  value: string;
}

// Interfaces moved to @/types/profile.ts

export interface PortfolioItem {
  title: string;
  description: string;
  image: string;
  url?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string[];
  rating: number;
}

// Tipos y payloads
export interface Theme {
  template_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  layout_style: string;
}

export interface NFCInfo {
  card_uid?: string;
  is_linked: boolean;
  last_updated?: string;
}

export interface Profile {
  _id: string;
  tenant_id: string;
  // Información básica
  profileImage?: string;
  profile_image?: string;
  public_name: string;
  title?: string;
  specialty?: string;
  bio?: string;
  // Contacto
  contact: Contact;
  // Redes sociales
  social_links: SocialLink[];
  // Estadísticas
  stats: Stat[];
  // Servicios
  services: Service[];
  // Portfolio
  portfolio: PortfolioItem[];
  // Testimonios
  testimonials: Testimonial[];
  // Ubicación
  location?: Location;
  // Tema
  theme: Theme;
  // NFC
  nfc: NFCInfo;
  // Configuración de citas
  appointment_config?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    availability_message: string;
  };
  // Campos personalizados
  custom_fields: Record<string, string>;
  // Configuración de secciones
  profile_sections?: ProfileSections;
  // Orden de secciones
  section_order?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantResponse {
  tenant: {
    _id: string;
    name: string;
    displayName: string;
    businessType: string;
    isActive: boolean;
  };
  profile: Profile;
  services: Service[];
  products: any[];
  professionals: any[];
  gallery: any[];
}

export interface ProfileSections {
  show_services?: boolean;
  show_products?: boolean;
  show_appointments?: boolean;
  show_stats?: boolean;
  show_testimonials?: boolean;
  show_contact?: boolean;
  show_social?: boolean;
  show_location?: boolean;
}

export interface ProfileUpdateData {
  // Información básica
  public_name?: string;
  title?: string;
  specialty?: string;
  bio?: string;
  profile_image?: string;
  // Contacto
  contact?: Partial<Contact>;
  // Redes sociales
  social_links?: SocialLink[];
  // Estadísticas
  stats?: Stat[];
  // Testimonios
  testimonials?: Testimonial[];
  // Ubicación
  location?: Location;
  // Tema
  theme?: Partial<Theme>;
  // Configuración de secciones
  profile_sections?: ProfileSections;
  // Orden de secciones
  section_order?: string[];
  // Campos personalizados
  custom_fields?: Record<string, string>;
  // Servicios
  services?: Service[];
  // Configuración de citas
  appointment_config?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    availability_message: string;
  };
}

// Obtener perfil por tenant ID
export const getProfile = async (tenantId: string): Promise<Profile> => {
  const response = await api.get(`/profiles/${tenantId}`);
  return response.data;
};

export const getPublicProfileBySlug = async (slug: string): Promise<PublicProfileResponse> => {
  const response = await api.get(`/profile/${slug}`);
  return response.data;
};

// Crear o actualizar perfil
export const createOrUpdateProfile = async (tenantId: string, data: ProfileUpdateData, profileImage?: File): Promise<Profile> => {
  // Si hay imagen, usar FormData
  if (profileImage) {
    const formData = new FormData();
    
         // Filtrar y agregar campos del perfil
     Object.keys(data).forEach(key => {
       const value = data[key as keyof ProfileUpdateData];
       if (value !== undefined && value !== null && value !== '') {
         if (typeof value === 'object') {
           // Para arrays, verificar que no estén vacíos
           if (Array.isArray(value) && value.length === 0) {
             return; // No agregar arrays vacíos
           }
           // Para objetos, verificar que no estén vacíos o que no tengan solo valores vacíos
           if (!Array.isArray(value)) {
             const hasValues = Object.values(value).some(v => v !== undefined && v !== null && v !== '');
             if (!hasValues) {
               return; // No agregar objetos sin valores
             }
           }
                       // Para profile_sections, theme y contact, enviar como objeto, no como JSON string
            if (key === 'profile_sections') {
              const sections = value as ProfileSections;
              Object.keys(sections).forEach(subKey => {
                const sectionValue = sections[subKey as keyof ProfileSections];
                if (sectionValue !== undefined) {
                  formData.append(`${key}[${subKey}]`, sectionValue.toString());
                }
              });
            } else if (key === 'theme') {
              const theme = value as Theme;
              Object.keys(theme).forEach(subKey => {
                const themeValue = theme[subKey as keyof Theme];
                if (themeValue !== undefined) {
                  formData.append(`${key}[${subKey}]`, themeValue.toString());
                }
              });
            } else if (key === 'contact') {
              const contact = value as Contact;
              // Manejar emails
              if (contact.emails && Array.isArray(contact.emails)) {
                contact.emails.forEach((email, index) => {
                  formData.append(`${key}[emails][${index}][email]`, email.email);
                  formData.append(`${key}[emails][${index}][type]`, email.type);
                  if (email.label) {
                    formData.append(`${key}[emails][${index}][label]`, email.label);
                  }
                });
              }
              // Manejar teléfonos
              if (contact.phones && Array.isArray(contact.phones)) {
                contact.phones.forEach((phone, index) => {
                  formData.append(`${key}[phones][${index}][phone]`, phone.phone);
                  formData.append(`${key}[phones][${index}][type]`, phone.type);
                  if (phone.label) {
                    formData.append(`${key}[phones][${index}][label]`, phone.label);
                  }
                });
              }
              // Manejar website
              if (contact.website) {
                formData.append(`${key}[website]`, contact.website);
              }
            } else if (key === 'social_links' || key === 'stats') {
              // Para arrays, enviar cada elemento como un campo separado
              const arrayValue = value as any[];
              if (Array.isArray(arrayValue) && arrayValue.length > 0) {
                arrayValue.forEach((item, index) => {
                  Object.keys(item).forEach(subKey => {
                    const itemValue = item[subKey];
                    if (itemValue !== undefined && itemValue !== '') {
                      formData.append(`${key}[${index}][${subKey}]`, itemValue.toString());
                    }
                  });
                });
              }
            } else {
              formData.append(key, JSON.stringify(value));
            }
         } else {
           formData.append(key, value.toString());
         }
       }
     });

    formData.append('profileImage', profileImage);

    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

         const response = await api.post(`/profiles/${tenantId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // Si no hay imagen, enviar como JSON
    const cleanData = { ...data };
    
         // Limpiar campos vacíos
     Object.keys(cleanData).forEach(key => {
       const value = cleanData[key as keyof ProfileUpdateData];
       if (value === undefined || value === null || value === '') {
         delete cleanData[key as keyof ProfileUpdateData];
       } else if (typeof value === 'object') {
         if (Array.isArray(value) && value.length === 0) {
           delete cleanData[key as keyof ProfileUpdateData];
         } else if (!Array.isArray(value)) {
           // Para objetos, verificar que tengan al menos un valor no vacío
           const hasValues = Object.values(value).some(v => v !== undefined && v !== null && v !== '');
           if (!hasValues) {
             delete cleanData[key as keyof ProfileUpdateData];
           }
         }
       }
     });

    console.log('JSON data to send:', cleanData);

         const response = await api.post(`/profiles/${tenantId}`, cleanData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }
};

// Eliminar perfil
export const deleteProfile = async (tenantId: string): Promise<void> => {
  await api.delete(`/profiles/${tenantId}`);
};

// Obtener todos los perfiles (solo superadmin)
export const listProfiles = async (page = 1, limit = 10): Promise<{ profiles: Profile[]; total: number; pages: number }> => {
  const response = await api.get('/profiles', {
    params: { page, limit }
  });
  return response.data;
};

// ==================== NUEVOS MÉTODOS PARA GESTIÓN DE COLORES ====================

// Obtener colores del perfil
export const getProfileColors = async (tenantId: string): Promise<{
  success: boolean;
  data: {
    theme: {
      primary_color: string;
      secondary_color: string;
      accent_color: string;
      font_family: string;
    };
    profile_id: string;
  };
}> => {
  const response = await api.get(`/profiles/${tenantId}/colors`);
  return response.data;
};

// Actualizar colores del perfil
export async function updateProfilePartial(tenantId: string, payload: any) {
  const { data } = await api.patch(`/profiles/${tenantId}`, payload);
  return data;
}

export async function updateProfileColors(
  tenantId: string,
  colors: { primary_color?: string; secondary_color?: string; accent_color?: string; font_family?: string }
) {
  const { data } = await api.put(`/profiles/${tenantId}/colors`, colors);
  return data;
}

// ==================== NUEVOS MÉTODOS PARA GESTIÓN DE CONTACTO ====================

// Obtener información de contacto
export const getContactInfo = async (tenantId: string): Promise<{
  success: boolean;
  data: {
    contact: Contact;
    profile_id: string;
  };
}> => {
  const response = await api.get(`/profiles/${tenantId}/contact`);
  return response.data;
};

// Actualizar información de contacto
export const updateContactInfo = async (tenantId: string, contact: Contact): Promise<{
  success: boolean;
  message: string;
  data: {
    contact: Contact;
    profile_id: string;
  };
}> => {
  const response = await api.put(`/profiles/${tenantId}/contact`, contact);
  return response.data;
};

// ==================== NUEVOS MÉTODOS PARA ORDENAMIENTO DE SECCIONES ====================

// Obtener configuración completa de secciones
export const getSectionsConfig = async (tenantId: string): Promise<{
  success: boolean;
  data: {
    tenant_features: any;
    sections: Record<string, {
      id: string;
      name: string;
      description: string;
      available: boolean;
      enabled: boolean;
      order: number;
      icon: string;
      category: 'basic' | 'conditional';
    }>;
    current_order: string[];
    profile_id: string;
  };
}> => {
  const response = await api.get(`/profiles/${tenantId}/sections/config`);
  return response.data;
};

// Obtener orden actual de secciones
export const getSectionOrder = async (tenantId: string): Promise<{
  success: boolean;
  data: {
    section_order: string[];
    profile_id: string;
  };
}> => {
  const response = await api.get(`/profiles/${tenantId}/sections/order`);
  return response.data;
};

// Actualizar orden de secciones
export const updateSectionOrder = async (tenantId: string, data: {
  section_order: string[];
}): Promise<{
  success: boolean;
  message: string;
  data: {
    section_order: string[];
    profile_id: string;
  };
}> => {
  const response = await api.put(`/profiles/${tenantId}/sections/order`, data);
  return response.data;
};

// ==================== OBJETO API UNIFICADO ====================

export const profileApi = {
  getProfile,
  getPublicProfileBySlug,
  createOrUpdateProfile,
  deleteProfile,
  listProfiles,
  getProfileColors,
  updateProfileColors,
  getContactInfo,
  updateContactInfo,
  getSectionsConfig,
  getSectionOrder,
  updateSectionOrder,
  updateProfileFull // agregado
};

// Actualizar perfil completo (PUT JSON o multipart si hay imagen)
export async function updateProfileFull(
  tenantId: string,
  data: ProfileUpdateData,
  profileImage?: File
): Promise<Profile> {
  if (profileImage) {
    const formData = new FormData();

    Object.keys(data).forEach(key => {
      const value = data[key as keyof ProfileUpdateData];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          if (Array.isArray(value) && value.length === 0) {
            return;
          }
          if (!Array.isArray(value)) {
            const hasValues = Object.values(value).some(v => v !== undefined && v !== null && v !== '');
            if (!hasValues) {
              return;
            }
          }

          if (key === 'profile_sections') {
            const sections = value as ProfileSections;
            Object.keys(sections).forEach(subKey => {
              const sectionValue = sections[subKey as keyof ProfileSections];
              if (sectionValue !== undefined) {
                formData.append(`${key}[${subKey}]`, sectionValue.toString());
              }
            });
          } else if (key === 'theme') {
            const theme = value as Theme;
            Object.keys(theme).forEach(subKey => {
              const themeValue = theme[subKey as keyof Theme];
              if (themeValue !== undefined) {
                formData.append(`${key}[${subKey}]`, themeValue.toString());
              }
            });
          } else if (key === 'contact') {
            const contact = value as Contact;
            if (contact.emails && Array.isArray(contact.emails)) {
              contact.emails.forEach((email, index) => {
                formData.append(`${key}[emails][${index}][email]`, email.email);
                formData.append(`${key}[emails][${index}][type]`, email.type);
                if (email.label) {
                  formData.append(`${key}[emails][${index}][label]`, email.label);
                }
              });
            }
            if (contact.phones && Array.isArray(contact.phones)) {
              contact.phones.forEach((phone, index) => {
                formData.append(`${key}[phones][${index}][phone]`, phone.phone);
                formData.append(`${key}[phones][${index}][type]`, phone.type);
                if (phone.label) {
                  formData.append(`${key}[phones][${index}][label]`, phone.label);
                }
              });
            }
            if (contact.website) {
              formData.append(`${key}[website]`, contact.website);
            }
          } else if (key === 'social_links' || key === 'stats') {
            const arrayValue = value as any[];
            if (Array.isArray(arrayValue) && arrayValue.length > 0) {
              arrayValue.forEach((item, index) => {
                Object.keys(item).forEach(subKey => {
                  const itemValue = item[subKey];
                  if (itemValue !== undefined && itemValue !== '') {
                    formData.append(`${key}[${index}][${subKey}]`, itemValue.toString());
                  }
                });
              });
            }
          } else {
            formData.append(key, JSON.stringify(value));
          }
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    formData.append('profileImage', profileImage);

    const response = await api.put(`/profiles/${tenantId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } else {
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      const value = cleanData[key as keyof ProfileUpdateData];
      if (value === undefined || value === null || value === '') {
        delete cleanData[key as keyof ProfileUpdateData];
      } else if (typeof value === 'object') {
        if (Array.isArray(value) && value.length === 0) {
          delete cleanData[key as keyof ProfileUpdateData];
        } else if (!Array.isArray(value)) {
          const hasValues = Object.values(value).some(v => v !== undefined && v !== null && v !== '');
          if (!hasValues) {
            delete cleanData[key as keyof ProfileUpdateData];
          }
        }
      }
    });

    const response = await api.put(`/profiles/${tenantId}`, cleanData, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  }
}