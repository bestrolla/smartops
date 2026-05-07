'use client';

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

export default function LocationMapFullsize({ location, className = "" }: LocationMapFullsizeProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const fullAddress = [
    location.address,
    location.city,
    location.state,
    location.country,
    location.postal_code
  ].filter(Boolean).join(', ');

  const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const googleEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

  const osmUrl = location.coordinates 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.coordinates.longitude-0.005},${location.coordinates.latitude-0.005},${location.coordinates.longitude+0.005},${location.coordinates.latitude+0.005}&layer=mapnik&marker=${location.coordinates.latitude},${location.coordinates.longitude}`
    : null;

  const renderStaticMap = () => (
    <div className="relative h-96">
      {/* Mapa simulado */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden h-full">
        <div className="h-full relative">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-400" />
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-500" />
            <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-400" />
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-400" />
            <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gray-500" />
            <div className="absolute left-3/4 top-0 bottom-0 w-1 bg-gray-400" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-300 opacity-60" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-300 opacity-60" />
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-300 opacity-60" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gray-300 opacity-60" />

            {/* Marcador */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-12 h-12 bg-red-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-red-500/15 rounded-full animate-ping" />
              </div>
            </div>
            {/* Etiqueta */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 mt-4">
              <div className="bg-white rounded-lg shadow-xl px-3 py-2 text-sm font-medium text-gray-800 max-w-48 text-center border-2 border-gray-200">
                <div className="font-semibold">{location.city}</div>
                <div className="text-xs text-gray-600">{location.country}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
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