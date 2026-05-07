import api from './api';
import { TenantResponse } from './profileApi';

export interface TenantPublicProfile {
  displayName?: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
}

export interface TenantFeatures {
  appointments: boolean;
  crm: boolean;
  ecommerce: boolean;
  inventory: boolean;
  orders: boolean;
  products: boolean;
  professionals: boolean;
  services: boolean;
  customDomain: boolean;
}

export interface Tenant {
  _id: string;
  name: string;
  isActive: boolean;
  publicProfile: TenantPublicProfile;
  theme: TenantTheme;
  features: TenantFeatures;
  createdAt: string;
  updatedAt: string;
  slug?: string;
}

export interface TenantUpdateData {
  name?: string;
  publicProfile?: Partial<TenantPublicProfile>;
  features?: Partial<TenantFeatures>;
  theme?: Partial<TenantTheme>;
  isActive?: boolean;
}


export interface TenantPublicProfileResponse {
  tenant: {
    _id: string;
    name: string;
    slug: string;
    displayName?: string;
    businessType?: string;
    description?: string;
    logoUrl?: string;
    isActive: boolean;
    theme?: TenantTheme;
    features?: TenantFeatures;
    createdAt: string;
    updatedAt: string;
  };
  profile?: any;
  services?: any[];
  products?: any[];
  testimonials?: any[];
  stats?: any[];
  theme?: any;
  professionals?: any[];
  gallery?: any[];
}

// Obtener perfil público del tenant actual (permitiendo headers de identificación)
export const getPublicTenantProfile = async (
  opts?: { tenantId?: string; slug?: string }
): Promise<TenantPublicProfileResponse> => {
  const response = await api.get('/public/tenant/profile', {
    headers: {
      ...(opts?.tenantId ? { 'X-Tenant-Id': opts.tenantId } : {}),
      ...(opts?.slug ? { 'X-Tenant-Slug': opts.slug } : {}),
    },
  });
  return response.data.data as TenantPublicProfileResponse;
};

// Obtener todos los tenants (solo admin/superadmin)
export const getAllTenants = async (): Promise<Tenant[]> => {
  const response = await api.get('/tenants');
  return response.data.data;
};

// Obtener tenant por ID (solo admin/superadmin)
export const getTenantById = async (id: string): Promise<Tenant> => {
  const response = await api.get(`/tenants/${id}`);
  return response.data.data;
};

// Actualizar tenant
export const updateTenant = async (id: string, data: TenantUpdateData): Promise<Tenant> => {
  const response = await api.put(`/tenants/${id}`, data);
  return response.data;
};

// Actualizar solo el tema del tenant
export const updateTenantTheme = async (id: string, theme: Partial<TenantTheme>): Promise<{ theme: TenantTheme; updatedAt: string }> => {
  const response = await api.put(`/tenants/${id}/theme`, theme);
  return response.data;
};

// Crear nuevo tenant (solo superadmin)
export const createTenant = async (data: Partial<Tenant>): Promise<{ id: string; subdomain: string; fullDomain: string; createdAt: string }> => {
  const response = await api.post('/tenants', data);
  return response.data;
};

// Desactivar tenant (solo superadmin)
export const deactivateTenant = async (id: string): Promise<{ id: string; isActive: boolean; deactivatedAt: string }> => {
  const response = await api.patch(`/tenants/${id}/deactivate`);
  return response.data;
};