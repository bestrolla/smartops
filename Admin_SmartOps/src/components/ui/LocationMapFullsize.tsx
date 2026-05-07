import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

interface LocationMapFullsizeProps {
  location: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postal_code?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    additional_info?: string;
    business_hours?: {
      [key: string]: string;
    };
  };
  className?: string;
}

export function LocationMapFullsize({ location, className = "" }: LocationMapFullsizeProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Construir la dirección completa para el mapa
  const fullAddress = [
    location.address,
    location.city,
    location.state,
    location.country,
    location.postal_code
  ].filter(Boolean).join(', ');

  // URLs para diferentes servicios de mapas
  const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const googleEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
  
  // Usar OpenStreetMap como alternativa sin API key
  const osmUrl = location.coordinates 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.coordinates.longitude-0.005},${location.coordinates.latitude-0.005},${location.coordinates.longitude+0.005},${location.coordinates.latitude+0.005}&layer=mapnik&marker=${location.coordinates.latitude},${location.coordinates.longitude}`
    : null;

  // Mapa estático como fallback
  const renderStaticMap = () => (
    <div className="relative h-96">
      {/* Mapa simulado mejorado y más grande */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden h-full">
        <div className="h-full relative">
          {/* Grid de calles más realista */}
          <div className="absolute inset-0">
            {/* Calles principales */}
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400"></div>
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-500"></div>
            <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400"></div>
            
            {/* Calles verticales */}
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-400"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-500"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-400"></div>

            {/* Calles secundarias */}
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-300 opacity-60"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-300 opacity-60"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-300 opacity-60"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gray-300 opacity-60"></div>

            {/* Áreas verdes y edificios simulados */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-green-200 rounded-full opacity-70"></div>
            <div className="absolute bottom-4 left-4 w-12 h-20 bg-gray-300 rounded-sm opacity-50"></div>
            <div className="absolute top-20 left-20 w-8 h-12 bg-gray-400 rounded-sm opacity-40"></div>
            <div className="absolute bottom-20 right-20 w-10 h-16 bg-gray-350 rounded-sm opacity-45"></div>

            {/* Marcador de ubicación principal */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Marcador principal más grande */}
                <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10 relative">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                
                {/* Pulsos animados múltiples */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-500/15 rounded-full animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-500/25 rounded-full animate-ping animation-delay-500"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/35 rounded-full animate-ping animation-delay-1000"></div>
              </div>
            </div>

            {/* Etiqueta de ubicación */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-12 mt-4">
              <div className="bg-white rounded-lg shadow-xl px-3 py-2 text-sm font-medium text-gray-800 max-w-48 text-center border-2 border-gray-200">
                <div className="font-semibold">{location.city}</div>
                <div className="text-xs text-gray-600">{location.country}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay con botones de acción */}
      <div className="absolute top-4 right-4 flex flex-col gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(googleMapsDirectUrl, '_blank')}
          className="bg-white/95 hover:bg-white shadow-lg border"
          title="Ver en Google Maps"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Ver en Maps
        </Button>
        
        {location.coordinates && (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              const coords = `${location.coordinates!.latitude},${location.coordinates!.longitude}`;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
            }}
            className="shadow-lg"
            title="Cómo llegar"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Cómo llegar
          </Button>
        )}
      </div>
    </div>
  );

  // Mapa interactivo con iframe
  const renderInteractiveMap = () => {
    if (osmUrl) {
      return (
        <div className="relative h-96">
          <div className="h-full relative overflow-hidden rounded-lg">
            <iframe
              src={osmUrl}
              width="100%"
              height="100%"
              className="border-0"
              onLoad={() => setMapLoaded(true)}
              title={`Mapa de ${location.address}`}
            />
            {!mapLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="text-gray-500">Cargando mapa interactivo...</div>
              </div>
            )}
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(googleMapsDirectUrl, '_blank')}
              className="bg-white/95 hover:bg-white shadow-lg border"
              title="Ver en Google Maps"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver en Maps
            </Button>
            {location.coordinates && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const coords = `${location.coordinates!.latitude},${location.coordinates!.longitude}`;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
                }}
                className="shadow-lg"
                title="Cómo llegar"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Cómo llegar
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-96">
        <div className="h-full relative overflow-hidden rounded-lg">
          <iframe
            src={googleEmbedUrl}
            width="100%"
            height="100%"
            className="border-0"
            onLoad={() => setMapLoaded(true)}
            title={`Mapa de ${fullAddress}`}
          />
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-500">Cargando mapa interactivo...</div>
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(googleMapsDirectUrl, '_blank')}
            className="bg-white/95 hover:bg-white shadow-lg border"
            title="Ver en Google Maps"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver en Maps
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderInteractiveMap()}
    </div>
  );
}

// Función helper para traducir días
function translateDay(day: string): string {
  const translations: { [key: string]: string } = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  
  return translations[day.toLowerCase()] || day;
}
