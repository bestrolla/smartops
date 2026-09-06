const PRODUCTION_API_URL = "https://smartops-api-147414442.us-west1.run.app/api";

// Configuración centralizada para variables de entorno
export const config = {
  // URL del API
  apiUrl: getConfiguredApiUrl(),

  // Entorno actual
  environment: import.meta.env.VITE_ENV ?? import.meta.env.MODE ?? "development",

  // Verificar si estamos en desarrollo
  isDevelopment: import.meta.env.DEV,

  // Verificar si estamos en producción
  isProduction: import.meta.env.PROD,
};

function getConfiguredApiUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL;

  return configuredUrl || (import.meta.env.PROD ? PRODUCTION_API_URL : getDefaultApiUrl());
}

// Función para obtener la URL del API por defecto
function getDefaultApiUrl(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:5001/api";
  }
  return PRODUCTION_API_URL;
}

// Función para obtener la URL del API dinámicamente
export function getApiUrl(): string {
  return config.apiUrl;
}

// Función para debug (solo en desarrollo)
export function logConfig() {
  if (config.isDevelopment) {
    console.log("🔧 Configuración actual:", config);
  }
}
