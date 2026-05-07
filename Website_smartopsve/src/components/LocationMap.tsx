'use client';

import React, { useState } from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Location } from '@/types';

interface LocationMapProps {
  location?: Location;
  className?: string;
}

export function LocationMap({ location, className = "" }: LocationMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Add null/undefined checks for location
  if (!location) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Información de ubicación no disponible</p>
      </div>
    );
  }

  const fullAddress = [
    location?.address,
    location?.city,
    location?.state,
    location?.country,
    location?.postal_code
  ].filter(Boolean).join(', ');

  const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  
  const osmUrl = location?.coordinates?.latitude && location?.coordinates?.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${location.coordinates.longitude-0.01},${location.coordinates.latitude-0.01},${location.coordinates.longitude+0.01},${location.coordinates.latitude+0.01}&layer=mapnik&marker=${location.coordinates.latitude},${location.coordinates.longitude}`
    : null;

  const renderStaticMap = () => (
    <div className="relative">
      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
        <div className="aspect-[4/3] md:aspect-[16/9] relative">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gray-300"></div>
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400"></div>
            <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-gray-300"></div>
            <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-400"></div>
            <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="absolute top-2 right-2 w-8 h-8 bg-green-200 rounded-full opacity-70"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-green-200 rounded-sm opacity-70"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center z-10 relative">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-500/30 rounded-full animate-ping animation-delay-1000"></div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-8 mt-2">
              <div className="bg-white rounded-lg shadow-lg px-2 py-1 text-xs font-medium text-gray-800 max-w-32 text-center border">
                {location.city}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        <button
          onClick={() => window.open(googleMapsDirectUrl, '_blank')}
          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md rounded-md flex items-center justify-center"
          title="Ver en Google Maps"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
        {location.coordinates?.latitude && location.coordinates?.longitude && (
          <button
            onClick={() => {
              const coords = `${location.coordinates!.latitude},${location.coordinates!.longitude}`;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
            }}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md rounded-md flex items-center justify-center"
            title="Cómo llegar"
          >
            <Navigation className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );

  const renderInteractiveMap = () => {
    if (!osmUrl) return renderStaticMap();

    return (
      <div className="relative">
        <div className="aspect-[4/3] md:aspect-[16/9] relative overflow-hidden rounded-lg">
          <div className="absolute inset-0">
            <iframe
              src={osmUrl}
              className="w-full h-full border-0"
              onLoad={() => setMapLoaded(true)}
              title={`Mapa de ${location.address}`}
            />
          </div>
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-500 text-sm">Cargando mapa...</div>
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={() => window.open(googleMapsDirectUrl, '_blank')}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md rounded-md flex items-center justify-center"
            title="Ver en Google Maps"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          {location.coordinates?.latitude && location.coordinates?.longitude && (
            <button
              onClick={() => {
                const coords = `${location.coordinates!.latitude},${location.coordinates!.longitude}`;
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
              }}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md rounded-md flex items-center justify-center"
              title="Cómo llegar"
            >
              <Navigation className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {location.coordinates ? renderInteractiveMap() : renderStaticMap()}
    </div>
  );
}