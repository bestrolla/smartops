import api from './api';
import { Plan } from './plansApi';

export interface Subscription {
  _id: string;
  tenant_id: string;
  plan: Plan;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired' | 'trial';
  payment_id?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  planId: string;
}

// Obtener la suscripción del tenant actual
export const getCurrentSubscription = async (): Promise<Subscription> => {
  const response = await api.get('/subscriptions/tenant');
  return response.data;
};

// Crear una nueva suscripción
export const createSubscription = async (data: CreateSubscriptionRequest): Promise<Subscription> => {
  const response = await api.post('/subscriptions', data);
  return response.data;
};

// Cambiar plan de suscripción (usar endpoint específico)
export const changePlan = async (planId: string): Promise<Subscription> => {
  try {
    console.log('Cambiando plan a:', planId);
    
    // Usar el nuevo endpoint específico para cambio de plan
    const response = await api.put('/subscriptions/change-plan', { 
      planId: planId 
    });
    
    console.log('Plan cambiado exitosamente:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('Error al cambiar plan:', error);
    
    // Manejo específico de errores comunes
    if (error.response?.status === 403) {
      throw new Error('No tienes permisos para cambiar el plan. Contacta al administrador.');
    } else if (error.response?.status === 404) {
      throw new Error('No se encontró una suscripción o el plan seleccionado no existe.');
    } else if (error.response?.status === 409) {
      throw new Error('Conflicto al cambiar el plan. Intenta refrescar la página.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Error al cambiar el plan. Intenta nuevamente en unos momentos.');
    }
  }
};

// Crear suscripción con pago y comprobante
export const createSubscriptionWithPayment = async (formData: FormData): Promise<{
  subscription: Subscription;
  payment: any;
}> => {
  try {
    console.log('Creando suscripción con pago...');
    
    const response = await api.post('/subscriptions/with-payment', formData);
    
    console.log('Suscripción con pago creada exitosamente:', response.data);
    return response.data;

  } catch (error: any) {
    console.error('Error al crear suscripción con pago:', error);
    
    if (error.response?.status === 413) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB permitido.');
    } else if (error.response?.status === 415) {
      throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes y PDFs.');
    } else if (error.response?.status === 409) {
      throw new Error('Ya existe un pago pendiente de aprobación para tu suscripción. Espera a que sea verificado.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.message || 'Datos inválidos para crear la suscripción con pago.');
    } else if (error.response?.status === 500) {
      throw new Error('Error interno del servidor al procesar la suscripción. Verifica que tu sesión esté activa y que el tenant esté identificado.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Error al procesar la suscripción con pago. Intenta nuevamente.');
    }
  }
};

// Funciones auxiliares para trabajar con suscripciones
export const getSubscriptionStatus = (subscription: Subscription): { 
  label: string; 
  color: string; 
  description: string;
} => {
  switch (subscription.status) {
    case 'active':
      return { 
        label: 'Activa', 
        color: 'green', 
        description: 'Tu suscripción está activa y funcionando' 
      };
    case 'pending':
      return { 
        label: 'Pendiente verificación', 
        color: 'orange', 
        description: 'Pendiente de verificación de pago' 
      };
    case 'cancelled':
      return { 
        label: 'Cancelada', 
        color: 'red', 
        description: 'Suscripción cancelada' 
      };
    case 'expired':
      return { 
        label: 'Expirada', 
        color: 'red', 
        description: 'Suscripción expirada' 
      };
    case 'trial':
      return { 
        label: 'Prueba', 
        color: 'blue', 
        description: 'Período de prueba activo' 
      };
    default:
      return { 
        label: 'Desconocido', 
        color: 'gray', 
        description: 'Estado desconocido' 
      };
  }
};

export const isSubscriptionActive = (subscription: Subscription): boolean => {
  return subscription.status === 'active' || subscription.status === 'trial';
};

export const getDaysUntilExpiration = (subscription: Subscription): number => {
  const endDate = new Date(subscription.endDate);
  const today = new Date();
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const requiresPaymentVerification = (subscription: Subscription): boolean => {
  return subscription?.status === 'pending';
};

export const getFeatureStatusForPendingSubscription = (isIncluded: boolean, isPending: boolean) => {
  if (isPending) {
    return {
      textColor: isIncluded ? 'text-orange-600' : 'text-gray-400',
      bgColor: isIncluded ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200',
      icon: isIncluded ? 'Clock' : 'X'
    };
  }
  
  return {
    textColor: isIncluded ? 'text-green-600' : 'text-gray-400',
    bgColor: isIncluded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200', 
    icon: isIncluded ? 'Check' : 'X'
  };
}; 