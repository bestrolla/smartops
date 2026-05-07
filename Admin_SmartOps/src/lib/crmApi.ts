import api from './api';

// Interfaces
export interface Customer {
  _id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  assignedTo?: string;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  _id: string;
  tenantId: string;
  customerId: string | Customer;
  name: string;
  description?: string;
  stage: 'new' | 'qualified' | 'proposition' | 'won' | 'lost';
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: string;
  assignedTo?: string;
  notes?: string;
  status: 'open' | 'closed' | 'cancelled';
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  tenantId: string;
  type: 'call' | 'meeting' | 'task' | 'email' | 'other';
  title: string;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'cancelled';
  relatedTo?: {
    customerId?: string;
    opportunityId?: string;
  };
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  tenantId: string;
  text: string;
  relatedTo?: {
    customerId?: string;
    opportunityId?: string;
    activityId?: string;
  };
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  _id: string;
  tenantId: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  name: string;
  order: number;
  color?: string;
}

export interface Tag {
  _id: string;
  tenantId: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmFilters {
  status?: string;
  assignedTo?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

// Customer API - Stub temporal
export const getCustomers = async (filters?: CrmFilters): Promise<{
  customers: Customer[];
  total: number;
  page: number;
  pages: number;
}> => {
  // Datos de prueba temporales
  const mockCustomers: Customer[] = [
    {
      _id: '1',
      tenantId: 'tenant1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      phone: '+34 600 123 456',
      company: 'Tech Solutions SL',
      notes: 'Cliente potencial interesado en nuestros servicios',
      status: 'lead',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      _id: '2',
      tenantId: 'tenant1',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@example.com',
      phone: '+34 600 789 012',
      company: 'Digital Marketing Pro',
      notes: 'Cliente activo desde hace 6 meses',
      status: 'customer',
      createdAt: '2024-01-10T15:30:00Z',
      updatedAt: '2024-01-10T15:30:00Z'
    }
  ];

  return {
    customers: mockCustomers,
    total: mockCustomers.length,
    page: 1,
    pages: 1
  };
};

export const getCustomer = async (customerId: string): Promise<Customer> => {
  // Stub temporal
  const mockCustomers = await getCustomers();
  const customer = mockCustomers.customers.find(c => c._id === customerId);
  if (!customer) throw new Error('Customer not found');
  return customer;
};

export const createCustomer = async (customerData: Omit<Customer, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
  // Stub temporal - simula creación
  console.log('Creating customer:', customerData);
  return {
    _id: Date.now().toString(),
    tenantId: 'tenant1',
    ...customerData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateCustomer = async (customerId: string, customerData: Partial<Customer>): Promise<Customer> => {
  // Stub temporal - simula actualización
  console.log('Updating customer:', customerId, customerData);
  const customer = await getCustomer(customerId);
  return { ...customer, ...customerData, updatedAt: new Date().toISOString() };
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  // Stub temporal - simula eliminación
  console.log('Deleting customer:', customerId);
};

// Opportunity API - Stub temporal
export const getOpportunities = async (filters?: CrmFilters): Promise<{
  opportunities: Opportunity[];
  total: number;
  page: number;
  pages: number;
}> => {
  // Datos de prueba temporales
  const mockOpportunities: Opportunity[] = [
    {
      _id: '1',
      tenantId: 'tenant1',
      customerId: '1',
      name: 'Venta de Software CRM',
      description: 'Implementación completa de sistema CRM',
      stage: 'qualified',
      value: 45000,
      currency: 'EUR',
      probability: 75,
      expectedCloseDate: '2024-03-15T00:00:00Z',
      notes: 'Cliente muy interesado, necesita aprobación del comité',
      status: 'open',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z'
    },
    {
      _id: '2',
      tenantId: 'tenant1',
      customerId: '2',
      name: 'Consultoría Digital',
      description: 'Servicios de consultoría en transformación digital',
      stage: 'proposition',
      value: 25000,
      currency: 'EUR',
      probability: 60,
      expectedCloseDate: '2024-02-28T00:00:00Z',
      notes: 'Propuesta enviada, esperando respuesta',
      status: 'open',
      createdAt: '2024-01-18T14:30:00Z',
      updatedAt: '2024-01-18T14:30:00Z'
    }
  ];

  return {
    opportunities: mockOpportunities,
    total: mockOpportunities.length,
    page: 1,
    pages: 1
  };
};

export const getOpportunity = async (opportunityId: string): Promise<Opportunity> => {
  const mockOpportunities = await getOpportunities();
  const opportunity = mockOpportunities.opportunities.find(o => o._id === opportunityId);
  if (!opportunity) throw new Error('Opportunity not found');
  return opportunity;
};

export const createOpportunity = async (opportunityData: Omit<Opportunity, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Opportunity> => {
  console.log('Creating opportunity:', opportunityData);
  return {
    _id: Date.now().toString(),
    tenantId: 'tenant1',
    ...opportunityData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateOpportunity = async (opportunityId: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
  console.log('Updating opportunity:', opportunityId, opportunityData);
  const opportunity = await getOpportunity(opportunityId);
  return { ...opportunity, ...opportunityData, updatedAt: new Date().toISOString() };
};

export const deleteOpportunity = async (opportunityId: string): Promise<void> => {
  console.log('Deleting opportunity:', opportunityId);
};

// Activity API - Stubs temporales
export const getActivities = async (filters?: CrmFilters): Promise<{
  activities: Activity[];
  total: number;
  page: number;
  pages: number;
}> => {
  return {
    activities: [],
    total: 0,
    page: 1,
    pages: 1
  };
};

export const createActivity = async (activityData: Omit<Activity, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Activity> => {
  console.log('Creating activity:', activityData);
  return {
    _id: Date.now().toString(),
    tenantId: 'tenant1',
    ...activityData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateActivity = async (activityId: string, activityData: Partial<Activity>): Promise<Activity> => {
  console.log('Updating activity:', activityId, activityData);
  throw new Error('Not implemented');
};

export const deleteActivity = async (activityId: string): Promise<void> => {
  console.log('Deleting activity:', activityId);
};

// Notes API - Stubs temporales
export const getNotes = async (relatedTo?: { customerId?: string; opportunityId?: string; activityId?: string }): Promise<Note[]> => {
  return [];
};

export const createNote = async (noteData: Omit<Note, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
  console.log('Creating note:', noteData);
  return {
    _id: Date.now().toString(),
    tenantId: 'tenant1',
    ...noteData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateNote = async (noteId: string, noteData: Partial<Note>): Promise<Note> => {
  console.log('Updating note:', noteId, noteData);
  throw new Error('Not implemented');
};

export const deleteNote = async (noteId: string): Promise<void> => {
  console.log('Deleting note:', noteId);
};

// Pipeline API - Stubs temporales
export const getPipelines = async (): Promise<Pipeline[]> => {
  return [];
};

export const createPipeline = async (pipelineData: Omit<Pipeline, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Pipeline> => {
  console.log('Creating pipeline:', pipelineData);
  return {
    _id: Date.now().toString(),
    tenantId: 'tenant1',
    ...pipelineData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updatePipeline = async (pipelineId: string, pipelineData: Partial<Pipeline>): Promise<Pipeline> => {
  console.log('Updating pipeline:', pipelineId, pipelineData);
  throw new Error('Not implemented');
};

export const deletePipeline = async (pipelineId: string): Promise<void> => {
  console.log('Deleting pipeline:', pipelineId);
};

// Tags API - Stubs temporales
export const getTags = async (): Promise<Tag[]> => {
  return [];
};

export const createTag = async (tagData: Omit<Tag, '_id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Tag> => {
  console.log('Creating tag:', tagData);
  return {
    _id: Date.now().toString(),
    tenantId: 'tenant1',
    ...tagData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const updateTag = async (tagId: string, tagData: Partial<Tag>): Promise<Tag> => {
  console.log('Updating tag:', tagId, tagData);
  throw new Error('Not implemented');
};

export const deleteTag = async (tagId: string): Promise<void> => {
  console.log('Deleting tag:', tagId);
};

// Stats API - Stub temporal
export const getCrmStats = async (): Promise<{
  totalCustomers: number;
  totalOpportunities: number;
  totalValue: number;
  conversionRate: number;
  customersByStatus: Record<string, number>;
  opportunitiesByStage: Record<string, number>;
  recentActivities: Activity[];
}> => {
  // Datos de prueba temporales
  return {
    totalCustomers: 45,
    totalOpportunities: 12,
    totalValue: 125000,
    conversionRate: 23.5,
    customersByStatus: {
      lead: 15,
      prospect: 10,
      customer: 18,
      inactive: 2
    },
    opportunitiesByStage: {
      new: 3,
      qualified: 4,
      proposition: 3,
      won: 1,
      lost: 1
    },
    recentActivities: []
  };
}; 