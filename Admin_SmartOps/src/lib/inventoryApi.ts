import api from './api';

export interface ProductDetailsForInventory {
  _id: string;
  name: string;
  sku: string;
  price: number;
  hasVariants?: boolean;
  isActive?: boolean;
  variantOptions?: {
    name: string;
    values: string[];
  }[];
  // If inventory items are linked to specific variants, you might need variant details here
  // For now, assuming product_id refers to the main product for simplicity.
}

export interface InventoryItem {
  _id: string;
  product_id: ProductDetailsForInventory; // This could be product or variant ID, adjust as per backend
  current_stock: number;
  reserved_stock: number;
  low_stock_threshold: number;
  last_updated: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetInventoryOptions {
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
  search?: string; // Adding a search option for future filtering
}

export interface InventoryApiResponse {
  inventory: InventoryItem[];
  total: number;
  page: number;
  pages: number;
}

export async function getInventory(options: GetInventoryOptions = {}): Promise<InventoryApiResponse> {
  const { page = 1, limit = 10, lowStockOnly = false, search } = options;
  const params: any = {
    page,
    limit,
    lowStockOnly,
  };
  if (search) {
    params.search = search;
  }
  const response = await api.get('/inventory', { params });
  // Backend returns { status: 'success', data: { inventory: [], total, pages, page } }
  return response.data.data;
}

export async function adjustStock(productId: string, data: { 
  delta: number; 
  reason: string; 
  currentStock?: number; 
  lowStockThreshold?: number; 
}): Promise<InventoryItem> {
  const response = await api.post(`/inventory/products/${productId}/adjust`, data);
  // Backend returns { status: 'success', data: inventoryItem }
  return response.data.data;
}

// export async function initializeInventory(productId: string, initialStock: number): Promise<InventoryItem> {
//   const response = await api.post(`/inventory/products/${productId}/initialize`, { initialStock });
//   return response.data.data;
// } 