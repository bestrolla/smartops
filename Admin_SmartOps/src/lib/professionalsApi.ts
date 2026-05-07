import api from './api';

export interface ProfessionalType {
  _id: string;
  name: string;
  description?: string;
  requiresLicense?: boolean;
  tenantId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Professional {
  _id: string;
  userId: string; // ID del usuario asociado al profesional
  professionalType: string; // Este es un ObjectId que referencia a ProfessionalType
  specialties?: string[];
  licenseNumber?: string;
  experienceYears?: number;
  rating?: number;
  isActive: boolean;
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  // Propiedades adicionales si se populan
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  professionalTypeDetails?: ProfessionalType; // Datos populados del tipo de profesional
}

export interface GetProfessionalsOptions {
  page?: number;
  limit?: number;
  sort?: string;
  professionalType?: string;
  isActive?: boolean;
  filter?: Record<string, any>;
}

export interface ProfessionalsApiResponse {
  professionals: Professional[];
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export async function getProfessionals(options: GetProfessionalsOptions = {}): Promise<ProfessionalsApiResponse> {
  const { page = 1, limit = 10, sort = '-createdAt', filter = {}, ...rest } = options;
  const params: any = {
    page,
    limit,
    sort,
    ...filter,
    ...rest
  };
  const response = await api.get('/professionals', { params });
  return response.data.data;
}

export async function getProfessionalById(id: string): Promise<Professional> {
  const response = await api.get(`/professionals/${id}`);
  return response.data.data;
}

export async function createProfessional(professionalData: Partial<Professional>): Promise<Professional> {
  const response = await api.post('/professionals', professionalData);
  return response.data.data;
}

export async function updateProfessional(id: string, updateData: Partial<Professional>): Promise<Professional> {
  const response = await api.put(`/professionals/${id}`, updateData);
  return response.data.data;
}

export async function getProfessionalTypes(): Promise<ProfessionalType[]> {
  const response = await api.get('/professionals/types');
  return response.data.data;
}

export async function createProfessionalType(typeData: Partial<ProfessionalType>): Promise<ProfessionalType> {
  const response = await api.post('/professionals/types', typeData);
  return response.data.data;
}

export async function deleteProfessional(id: string): Promise<void> {
  await api.delete(`/professionals/${id}`);
} 