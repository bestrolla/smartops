import api from './api';

export interface ProductOrder {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  priceAtPurchase: number;
  variantInfo?: {
    optionName: string;
    optionValue: string;
  }[];
  variantId?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string;
  items: ProductOrder[];
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    additionalInfo?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    additionalInfo?: string;
  };
  paymentDetails?: {
    cardLastFour: string;
    cardBrand: string;
  };
  notes?: string;
  metadata?: {
    tipoEnvio?: string;
    regaloPara?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetOrdersOptions {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: Record<string, any>;
}

export interface OrdersApiResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

export async function getOrders(options: GetOrdersOptions = {}): Promise<OrdersApiResponse> {
  const { page = 1, limit = 10, sort = '-createdAt', filter = {} } = options;
  const params: any = {
    page,
    limit,
    sort,
    ...filter
  };
  const response = await api.get('/orders', { params });
  return response.data.data; // This data.data now matches OrdersApiResponse
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await api.get(`/orders/${id}`);
  return response.data.data; // Assuming API returns { data: { data: {} } } for single item
}

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const response = await api.post('/orders', orderData);
  return response.data.data;
}

export async function updateOrder(id: string, updateData: Partial<Order>): Promise<Order> {
  const response = await api.put(`/orders/${id}`, updateData);
  return response.data.data;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete(`/orders/${id}`);
} 