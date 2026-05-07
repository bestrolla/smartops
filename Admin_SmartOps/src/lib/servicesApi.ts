import api from './api';

export interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;  // en minutos
  price: number;
  currency: string;
  categoryId?: string;
  professionals: string[];
  requirements: string[];
  isActive: boolean;
  isPackage: boolean;
  packageServices?: Array<{
    serviceId: string;
    order: number;
  }>;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicesListResponse {
  docs: Service[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Obtener servicios activos del tenant (para mostrar en perfil público)
export const getActiveServices = async (
  page = 1, 
  limit = 10,
  categoryId?: string
): Promise<ServicesListResponse> => {
  const params: Record<string, any> = {
    page,
    limit,
    isActive: true
  };
  
  if (categoryId) {
    params.categoryId = categoryId;
  }

  const response = await api.get('/services', { params });
  console.log('🔍 getActiveServices API response:', response);
  
  // Manejar el mismo formato que getServices
  if (response.data.status === 'success' && response.data.data) {
    const apiData = response.data.data;
    return {
      docs: apiData.services || [],
      totalDocs: apiData.total || 0,
      limit: apiData.limit || limit,
      page: apiData.page || page,
      totalPages: apiData.pages || 1,
      hasNextPage: (apiData.page || page) < (apiData.pages || 1),
      hasPrevPage: (apiData.page || page) > 1
    };
  } else if (response.data.docs) {
    return response.data;
  } else {
    console.warn('❌ Unexpected active services API response format:', response.data);
    return {
      docs: [],
      totalDocs: 0,
      limit,
      page,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    };
  }
};

// Función para compatibilidad con código existente
export const getServices = async (filters: Record<string, any> = {}): Promise<ServicesListResponse> => {
  const params = {
    page: 1,
    limit: 100,
    ...filters
  };

  const response = await api.get('/services', { params });
  console.log('🔍 getServices API response:', response);
  console.log('🔍 getServices response.data:', response.data);
  
  // Manejar diferentes formatos de respuesta del API
  if (response.data.status === 'success' && response.data.data) {
    // Formato: { status: "success", data: { services: [...], total: ..., pages: ..., page: ..., limit: ... } }
    const apiData = response.data.data;
    return {
      docs: apiData.services || [],
      totalDocs: apiData.total || 0,
      limit: apiData.limit || 10,
      page: apiData.page || 1,
      totalPages: apiData.pages || 1,
      hasNextPage: (apiData.page || 1) < (apiData.pages || 1),
      hasPrevPage: (apiData.page || 1) > 1
    };
  } else if (response.data.docs) {
    // Formato directo de paginación
    return response.data;
  } else {
    // Fallback
    console.warn('❌ Unexpected services API response format:', response.data);
    return {
      docs: [],
      totalDocs: 0,
      limit: 10,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    };
  }
};

// Obtener servicio por ID
export const getService = async (serviceId: string): Promise<Service> => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};

// Obtener categorías de servicios
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  try {
    const response = await api.get('/services/categories');
    console.log('📦 API response for categories:', response);
    console.log('📦 API response.data:', response.data);

    // Manejar objeto { status: "success", data: [...] }
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // Manejar array directo
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Manejar paginación { docs: [...] }
    if (response.data && Array.isArray(response.data.docs)) {
      return response.data.docs;
    }

    console.warn('❌ Unexpected response format for categories:', response.data);
    return [];
  } catch (error) {
    console.error('❌ Error fetching service categories:', error);
    return [];
  }
};


// Obtener servicios por categoría (para perfil público)
export const getServicesByCategory = async (): Promise<{
  category: ServiceCategory;
  services: Service[];
}[]> => {
  try {
    const [categoriesResponse, servicesResponse] = await Promise.all([
      getServiceCategories(),
      getActiveServices(1, 100) // Obtener muchos servicios activos
    ]);

    const categories = categoriesResponse.filter(cat => cat.isActive);
    const services = servicesResponse.docs;

    // Agrupar servicios por categoría
    const servicesByCategory = categories.map(category => ({
      category,
      services: services.filter(service => service.categoryId === category._id)
    })).filter(group => group.services.length > 0);

    // Agregar servicios sin categoría si existen
    const servicesWithoutCategory = services.filter(service => !service.categoryId);
    if (servicesWithoutCategory.length > 0) {
      servicesByCategory.push({
        category: {
          _id: 'no-category',
          name: 'Otros Servicios',
          isActive: true,
          createdAt: '',
          updatedAt: ''
        },
        services: servicesWithoutCategory
      });
    }

    return servicesByCategory;
  } catch (error) {
    console.error('Error obteniendo servicios por categoría:', error);
    return [];
  }
};

// Formatear precio para mostrar
export const formatServicePrice = (service: Service): string => {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: service.currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(service.price);
};

// Crear servicio
export const createService = async (serviceData: Partial<Service>): Promise<Service> => {
  const response = await api.post('/services', serviceData);
  return response.data;
};

// Actualizar servicio
export const updateService = async (serviceId: string, serviceData: Partial<Service>): Promise<Service> => {
  const response = await api.put(`/services/${serviceId}`, serviceData);
  return response.data;
};

// Eliminar servicio
export const deleteService = async (serviceId: string): Promise<void> => {
  await api.delete(`/services/${serviceId}`);
};

// Crear categoría de servicio
export const createServiceCategory = async (categoryData: Partial<ServiceCategory>): Promise<ServiceCategory> => {
  const response = await api.post('/services/categories', categoryData);
  return response.data;
};

// Formatear duración para mostrar
export const formatServiceDuration = (durationInMinutes: number): string => {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}min`;
  }
};