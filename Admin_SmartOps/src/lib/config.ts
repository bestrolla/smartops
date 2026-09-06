// Configuración centralizada para variables de entorno
export const config = {
  // URL del API
  apiUrl: import.meta.env.VITE_API_URL ?? getDefaultApiUrl(),

  // Entorno actual
  environment: import.meta.env.VITE_ENV ?? import.meta.env.MODE ?? "development",

  // Verificar si estamos en desarrollo
  isDevelopment: import.meta.env.DEV,

  // Verificar si estamos en producción
  isProduction: import.meta.env.PROD,
};

// Función para obtener la URL del API por defecto
function getDefaultApiUrl(): string {
  if (import.meta.env.DEV) {
    return "http://localhost:5001/api";
  }
  return "https://api-smartops-147414442.us-west1.run.app/api";
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
