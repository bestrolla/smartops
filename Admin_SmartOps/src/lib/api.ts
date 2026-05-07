import axios from "axios";
import { getApiUrl } from "./config";

// Crear instancia de Axios
const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Interceptor de request para token y tenantId
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("tenantId");
  const tenantSlug = localStorage.getItem("tenantSlug");
  const tenantName = localStorage.getItem("tenantName");

  const publicRoutes = ['/auth/signup', '/auth/signup-full', '/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.some(route => config.url?.includes(route));

  if (token && !isPublicRoute) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers = config.headers || {};
    config.headers['X-Tenant-ID'] = tenantId;
  }
  if (tenantSlug) {
    config.headers = config.headers || {};
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }
  if (tenantName) {
    config.headers = config.headers || {};
    config.headers['X-Tenant-Name'] = tenantName;
  }

  return config;
});

// Interceptor de response para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/sign-in';
    }

    if (error.code === 'ERR_NETWORK') {
      console.error('Error de conexión:', 'No se pudo conectar al servidor. Verifica tu conexión a internet.');
    }

    return Promise.reject(error);
  }
);

// Función para construir URLs completas de imágenes
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;

  const baseUrl = getApiUrl().replace('/api', '');
  return imagePath.startsWith('/uploads') ? `${baseUrl}${imagePath}` : `${baseUrl}/uploads/tenants/common/profiles/${imagePath}`;
};

// Función para obtener una imagen de perfil válida
export const getValidProfileImage = (imagePath: string): string => {
  if (!imagePath) return `${getApiUrl().replace('/api', '')}/uploads/tenants/common/profiles/37bab2b1-81ad-4722-867a-f19ea22b80bd.jpg`;
  return getImageUrl(imagePath);
};

export default api;