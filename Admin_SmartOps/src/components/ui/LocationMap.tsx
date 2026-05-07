import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';

interface LocationMapProps {
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

export function LocationMap({ location, className = "" }: LocationMapProps) {
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
  const googleMapsUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDclFMNE4KwtdMmJUNIG719t3GdvAA4R4w&q=${encodeURIComponent(fullAddress)}`;
  const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  
  // Usar OpenStreetMap como alternativa sin API key
  const osmUrl = location.coordinates 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.coordinates.longitude-0.01},${location.coordinates.latitude-0.01},${location.coordinates.longitude+0.01},${location.coordinates.latitude+0.01}&layer=mapnik&marker=${location.coordinates.latitude},${location.coordinates.longitude}`
    : null;

  // Mapa estático como fallback
  const renderStaticMap = () => (
    <div className="relative">
      {/* Mapa simulado mejorado */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
        <div className="aspect-[16/9] relative">
          {/* Grid de calles más realista */}
          <div className="absolute inset-0">
            {/* Calles horizontales */}
            <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gray-300"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400"></div>
            <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-gray-300"></div>
            
            {/* Calles verticales */}
            <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-400"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-gray-300"></div>

            {/* Áreas verdes simuladas */}
            <div className="absolute top-2 right-2 w-8 h-8 bg-green-200 rounded-full opacity-70"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-green-200 rounded-sm opacity-70"></div>

            {/* Marcador de ubicación principal */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Marcador principal */}
                <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-10 relative">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                
                {/* Pulso animado */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-500/30 rounded-full animate-ping animation-delay-1000"></div>
              </div>
            </div>

            {/* Etiqueta de ubicación */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-8 mt-2">
              <div className="bg-white rounded-lg shadow-lg px-2 py-1 text-xs font-medium text-gray-800 max-w-32 text-center border">
                {location.city}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay con botones de acción */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open(googleMapsDirectUrl, '_blank')}
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
          title="Ver en Google Maps"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
        
        {location.coordinates && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const coords = `${location.coordinates!.latitude},${location.coordinates!.longitude}`;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
            }}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
            title="Cómo llegar"
          >
            <Navigation className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );

  // Mapa interactivo con iframe
  const renderInteractiveMap = () => {
    if (!osmUrl) return renderStaticMap();

    return (
      <div className="relative">
        <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
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
              <div className="text-gray-500 text-sm">Cargando mapa...</div>
            </div>
          )}
        </div>

        {/* Overlay con información */}
{/*         <div className="absolute bottom-2 left-2 bg-white/95 rounded-lg p-2 shadow-lg max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-900">
                {location.address}
              </p>
              <p className="text-xs text-gray-600">
                {location.city}, {location.country}
              </p>
            </div>
          </div>
        </div> */}

        {/* Botones de acción */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(googleMapsDirectUrl, '_blank')}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
            title="Ver en Google Maps"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          
          {location.coordinates && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const coords = `${location.coordinates!.latitude},${location.coordinates!.longitude}`;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
              title="Cómo llegar"
            >
              <Navigation className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Solo el mapa */}
      {location.coordinates ? renderInteractiveMap() : renderStaticMap()}
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
