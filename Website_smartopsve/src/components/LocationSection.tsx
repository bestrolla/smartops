import React from 'react';
import { MapPin, Clock, Info } from 'lucide-react';
import { Location } from '@/types';
import { LocationMap } from './LocationMap';

interface LocationSectionProps {
  location?: Location;
  className?: string;
}

export function LocationSection({ location, className = "" }: LocationSectionProps) {
  // Add null check for location
  if (!location) {
    return null; // Don't render the section if no location data
  }

  const businessHoursDays = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <section className={`py-12 md:py-20 ${className}`}>
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestra Ubicación
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Visítanos en nuestra ubicación o contáctanos para más información
          </p>
        </div>

        <div className="space-y-6">
          {/* Dirección */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">Dirección</h3>
                  <span className="text-sm text-blue-600 font-medium">Mapa</span>
                </div>
                <div className="space-y-2">
                   <p className="text-gray-800 font-medium">{location.address}</p>
                   {location.city && (
                     <p className="text-gray-600">{location.city}, {location.state}</p>
                   )}
                   {location.postal_code && (
                     <p className="text-gray-600">{location.postal_code}</p>
                   )}
                   {location.country && (
                     <p className="text-gray-600">{location.country}</p>
                   )}
                   {location.coordinates && (
                     <div className="text-sm text-gray-500 mt-3">
                       <p>Coordenadas:</p>
                       <p>{location.coordinates.latitude}, {location.coordinates.longitude}</p>
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>

          {/* Horarios de Atención */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Horarios de Atención</h3>
            </div>
            
            <div className="space-y-3">
              {businessHoursDays.map(({ key, label }) => {
                const hours = location.business_hours?.[key as keyof typeof location.business_hours];
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <span className="font-medium text-gray-700 text-base">{label}</span>
                    <span className="text-gray-600 text-sm font-medium">
                      {hours && hours !== 'Cerrado' ? hours : 'Cerrado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Información Adicional */}
          {location.additional_info && (
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Información Adicional</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">{location.additional_info}</p>
            </div>
          )}

          {/* Mapa - Debajo de toda la información */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <LocationMap 
              location={location}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
