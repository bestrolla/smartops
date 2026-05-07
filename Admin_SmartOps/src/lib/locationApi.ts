import { getApiUrl } from './config';

export interface Location {
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  business_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  additional_info?: string;
}

export interface LocationResponse {
  success: boolean;
  data: Location;
  message?: string;
}

// Obtener información de ubicación del perfil
export const getLocation = async (tenantId: string): Promise<LocationResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/profiles/${tenantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data: any = await response.json().catch(() => null);
    
    if (response.ok) {
      // Manejar diferentes estructuras de respuesta de forma segura
      const location = data?.data?.location ?? data?.location ?? {};
      return {
        success: true,
        data: location as Location
      };
    } else {
      return {
        success: false,
        data: {} as Location,
        message: data?.message || 'Error al cargar información de ubicación'
      };
    }
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      success: false,
      data: {} as Location,
      message: 'Error de conexión'
    };
  }
};

export const getPublicLocationBySlug = async (slug: string): Promise<LocationResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/profile/${slug}`);
    const payload: any = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      const location = payload?.data?.profile?.location ?? {};
      return { success: true, data: location as Location };
    }
    return {
      success: false,
      data: {} as Location,
      message: payload?.message || 'Error al cargar ubicación pública'
    };
  } catch (error) {
    console.error('Error fetching public location:', error);
    return { success: false, data: {} as Location, message: 'Error de conexión' };
  }
};

// Actualizar información de ubicación
export const updateLocation = async (tenantId: string, location: Location): Promise<LocationResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/profiles/${tenantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        location: location
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: location,
        message: data.message || 'Ubicación actualizada exitosamente'
      };
    } else {
      return {
        success: false,
        data: location,
        message: data.message || 'Error al actualizar información de ubicación'
      };
    }
  } catch (error) {
    console.error('Error updating location:', error);
    return {
      success: false,
      data: location,
      message: 'Error de conexión'
    };
  }
};

// Obtener coordenadas desde una dirección usando un servicio de geocoding
export const getCoordinatesFromAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    // Usar un servicio de geocoding gratuito (ejemplo con Nominatim de OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};