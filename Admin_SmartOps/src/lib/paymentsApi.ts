import api from './api';

export interface Payment {
  _id: string;
  tenant: string;
  user: string;
  order?: string;
  subscription?: string;
  amount: number;
  currency: string;
  type: 'order_payment' | 'subscription' | 'refund';
  method: 'credit_card' | 'debit_card' | 'cash' | 'transfer';
  status: 'pending' | 'completed' | 'verified' | 'rejected' | 'refunded';
  transactionId?: string;
  proofImage?: {
    fileName: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    url: string;
  };
  verifiedBy?: string;
  verificationDate?: string;
  rejectionReason?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  type: 'order_payment' | 'subscription' | 'refund';
  method: 'credit_card' | 'debit_card' | 'cash' | 'transfer';
  currency?: string;
  order?: string;
  subscription?: string;
  transactionId?: string;
  notes?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

// Crear un nuevo pago (con comprobante opcional)
export const createPayment = async (data: FormData | CreatePaymentRequest): Promise<Payment> => {
  const config = data instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  
  const response = await api.post('/payments', data, config);
  return response.data;
};

// Obtener pagos del tenant actual
export const getPayments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}): Promise<PaymentsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.type) queryParams.append('type', params.type);
  
  const response = await api.get(`/payments?${queryParams.toString()}`);
  return response.data;
};

// Obtener un pago específico por ID
export const getPayment = async (id: string): Promise<Payment> => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

// Verificar un pago de suscripción (solo admin/superadmin)
export const verifySubscriptionPayment = async (id: string): Promise<Payment> => {
  const response = await api.patch(`/payments/${id}/verify-subscription`);
  return response.data;
};

// Rechazar un pago (solo admin/superadmin)
export const rejectPayment = async (id: string, reason: string): Promise<Payment> => {
  const response = await api.patch(`/payments/${id}/reject`, { reason });
  return response.data;
};

// Actualizar un pago manual
export const updatePayment = async (id: string, data: Partial<CreatePaymentRequest>): Promise<Payment> => {
  const response = await api.patch(`/payments/${id}`, data);
  return response.data;
};

// Aprobar un pago manual (solo admin/superadmin)
export const approvePayment = async (id: string, notes?: string): Promise<Payment> => {
  const response = await api.patch(`/payments/${id}/approve`, { notes });
  return response.data;
};

// Funciones auxiliares
export const getPaymentStatusLabel = (status: Payment['status']): {
  label: string;
  color: string;
  description: string;
} => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendiente',
        color: 'orange',
        description: 'Pago pendiente de verificación'
      };
    case 'completed':
      return {
        label: 'Completado',
        color: 'green',
        description: 'Pago completado exitosamente'
      };
    case 'verified':
      return {
        label: 'Verificado',
        color: 'green',
        description: 'Pago verificado por el administrador'
      };
    case 'rejected':
      return {
        label: 'Rechazado',
        color: 'red',
        description: 'Pago rechazado'
      };
    case 'refunded':
      return {
        label: 'Reembolsado',
        color: 'gray',
        description: 'Pago reembolsado'
      };
    default:
      return {
        label: 'Desconocido',
        color: 'gray',
        description: 'Estado desconocido'
      };
  }
};

export const getPaymentMethodLabel = (method: Payment['method']): string => {
  switch (method) {
    case 'credit_card':
      return 'Tarjeta de Crédito';
    case 'debit_card':
      return 'Tarjeta de Débito';
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia Bancaria';
    default:
      return method;
  }
};

export const formatAmount = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency
  }).format(amount);
}; 