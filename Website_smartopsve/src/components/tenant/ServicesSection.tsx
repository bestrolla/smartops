'use client';
import React from 'react';
import { Service } from '@/types';
import { Briefcase, Loader2 } from 'lucide-react';

interface Theme {
  id?: string;
  name?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  layout?: {
    header?: string;
    stats?: string;
    services?: string;
    testimonials?: string;
  };
}

interface ServicesSectionProps {
  services: Service[];
  theme?: Theme | null;
}

// Función para formatear el precio del servicio
const formatServicePrice = (service: Service) => {
  const raw = service.price;

  if (raw === undefined || raw === null) return 'Consultar precio';

  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 'Consultar precio';

  return `$${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}`;
};

// Función para formatear la duración del servicio
const formatServiceDuration = (raw?: string | number) => {
  const value =
    raw === undefined || raw === null
      ? 30
      : typeof raw === 'number'
      ? raw
      : Number(raw);

  if (!Number.isFinite(value) || value <= 0) return '30 min';

  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const minutes = Math.floor(value % 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  return `${Math.floor(value)} min`;
};


export function ServicesSection({ services, theme }: ServicesSectionProps) {
  if (!services || services.length === 0) {
    return (
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-gray-700" />
          <h3 className="font-bold text-gray-900 font-montserrat text-sm">
            Servicios
          </h3>
        </div>
        <div className="text-center py-4">
          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-montserrat">
            Aún no tienes servicios configurados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-gray-700" />
        <h3 className="font-bold text-gray-900 font-montserrat text-sm">
          Servicios
        </h3>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {services.map((service) => (
          <div key={String(service.id ?? service.name)} className="p-3 sm:p-4 border border-gray-200 bg-white shadow-sm rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                <span className="text-xs sm:text-sm">
                  {service.name.includes('Consulta') ? '🩺' : 
                   service.name.includes('Urgencia') ? '🚨' : 
                   service.name.includes('Preventiva') ? '🛡️' : '📋'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                  {service.name}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                  {service.description && service.description.length > 80 
                    ? `${service.description.substring(0, 80)}...` 
                    : service.description || 'Sin descripción'
                  }
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base font-bold text-green-600">
                    {formatServicePrice(service)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {formatServiceDuration(service.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}