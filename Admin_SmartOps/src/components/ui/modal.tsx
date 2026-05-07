import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]'
};

export function Modal({ isOpen, onClose, children, title, className = '', size = 'lg' }: ModalProps) {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup cuando el componente se desmonta
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = sizeClasses[size];

  const modalContent = (
    <div className="fixed inset-0 z-50 bg-black/50">
      {/* Overlay que cubre toda la pantalla */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Contenedor del modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`relative w-full ${sizeClass} max-h-[90vh] flex flex-col rounded-lg shadow-2xl bg-white ${className}`}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white">
                {title}
              </h3>
              <button
                className="p-1 text-white/80 hover:text-white transition-colors rounded-md hover:bg-white/10"
                onClick={onClose}
                type="button"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar el modal como portal en el body
  return createPortal(modalContent, document.body);
} 