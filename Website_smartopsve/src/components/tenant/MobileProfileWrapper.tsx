'use client';

import { ReactNode } from 'react';

interface MobileProfileWrapperProps {
  children: ReactNode;
}

export function MobileProfileWrapper({ children }: MobileProfileWrapperProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="relative">
        {/* Sombra del dispositivo */}
        <div className="absolute inset-0 bg-black/20 rounded-3xl blur-xl transform scale-110"></div>
        
        {/* Contenedor del dispositivo móvil */}
        <div className="w-80 h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 relative">
          {/* Barra de estado del móvil */}
          <div className="bg-black text-white text-xs px-6 py-1 flex justify-between items-center">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white rounded-sm"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Contenido del perfil con scroll automático */}
          <div className="h-full overflow-y-auto scrollbar-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}