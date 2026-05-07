import { api } from './api';

// Interfaces
export interface Appointment {
  _id: string;
  tenantId: string;
  professionalId: string | Professional;
  userId: string | User;
  start: string;
  end: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  type: 'in_person' | 'virtual';
  location?: string;
  notes?: string;
  reminders?: Reminder[];
  calendarEventId?: string;
  slotId?: string;
  createdBy?: string;
  updatedBy?: string;
  serviceId?: string | Service;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialties?: string[];
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Service {
  _id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export interface Reminder {
  method: 'email' | 'sms' | 'push';
  timeBefore: number;
  sent: boolean;
}

export interface AppointmentSlot {
  _id: string;
  professionalId: string;
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface Availability {
  _id: string;
  professionalId: string;
  type: 'fixed' | 'custom';
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export interface CreateAppointmentData {
  slotId: string;
  notes?: string;
  reminders?: Omit<Reminder, 'sent'>[];
  serviceId?: string;
}

export interface AppointmentFilters {
  professionalId?: string;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// API Functions
export const getAppointments = async (filters?: AppointmentFilters): Promise<{
  appointments: Appointment[];
  total: number;
  page: number;
  pages: number;
}> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
  }

  const response = await api.get(`/appointments${params.toString() ? `?${params.toString()}` : ''}`);
  return response.data;
};

export const createAppointment = async (data: CreateAppointmentData): Promise<Appointment> => {
  const response = await api.post('/appointments', data);
  return response.data;
};

export const cancelAppointment = async (appointmentId: string): Promise<Appointment> => {
  const response = await api.patch(`/appointments/${appointmentId}/cancel`);
  return response.data;
};

export const updateAppointmentStatus = async (
  appointmentId: string, 
  status: Appointment['status']
): Promise<Appointment> => {
  const response = await api.patch(`/appointments/${appointmentId}`, { status });
  return response.data;
};

// Slots API
export const getAvailableSlots = async (
  professionalId: string, 
  date: string
): Promise<AppointmentSlot[]> => {
  const response = await api.get(`/appointments/slots/available?professionalId=${professionalId}&date=${date}`);
  return response.data;
};

export const generateSlots = async (data: {
  professionalId: string;
  startDate: string;
  endDate: string;
}): Promise<void> => {
  await api.post('/appointments/slots/generate', data);
};

// Availability API  
export const getAvailability = async (professionalId: string): Promise<Availability> => {
  const response = await api.get(`/appointments/availability/${professionalId}`);
  return response.data;
};

export const updateAvailability = async (
  professionalId: string, 
  data: Partial<Availability>
): Promise<Availability> => {
  const response = await api.post(`/appointments/availability/${professionalId}`, data);
  return response.data;
}; 