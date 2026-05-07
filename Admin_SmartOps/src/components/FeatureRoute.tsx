import React from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatures } from '../lib/FeaturesContext';

interface FeatureRouteProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureRoute: React.FC<FeatureRouteProps> = ({ 
  featureName, 
  children, 
  fallback 
}) => {
  const { isFeatureEnabled, loading } = useFeatures();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isFeatureEnabled(featureName)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Módulo no disponible
          </h1>
          <p className="text-gray-600 mb-6">
            Este módulo no está habilitado para tu organización.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
            >
              Volver
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default FeatureRoute; 