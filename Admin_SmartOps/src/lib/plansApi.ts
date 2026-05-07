import api from './api';

export interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  features: {
    appointments: boolean;
    crm: boolean;
    ecommerce: boolean;
    inventory: boolean;
    orders: boolean;
    products: boolean;
    professionals: boolean;
    services: boolean;
    customDomain: boolean;
    automation: boolean
  };
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanInput {
  name: string;
  price: number;
  currency?: string;
  features: {
    appointments?: boolean;
    crm?: boolean;
    ecommerce?: boolean;
    inventory?: boolean;
    orders?: boolean;
    products?: boolean;
    professionals?: boolean;
    services?: boolean;
    customDomain?: boolean;
  };
  description?: string;
  isActive?: boolean;
}

export interface PlansResponse {
  plans: Plan[];
  total: number;
}

export const getPlans = async (params?: { page?: number; limit?: number }): Promise<PlansResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  // Cambiado a ruta pública
  const response = await api.get(`/public/plans?${queryParams.toString()}`);
  return response.data;
};

// Obtener un plan específico por ID
export const getPlan = async (id: string): Promise<Plan> => {
  const response = await api.get(`/plans/${id}`);
  return response.data;
};

// Crear un nuevo plan (solo admin)
export const createPlan = async (planData: PlanInput): Promise<Plan> => {
  const response = await api.post('/plans', planData);
  return response.data;
};

// Actualizar un plan existente (solo admin)
export const updatePlan = async (id: string, planData: Partial<PlanInput>): Promise<Plan> => {
  const response = await api.patch(`/plans/${id}`, planData);
  return response.data;
};

// Eliminar un plan (solo admin)
export const deletePlan = async (id: string): Promise<void> => {
  await api.delete(`/plans/${id}`);
};