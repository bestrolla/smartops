import api from './api';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  tenantId: string;
  parentCategory?: { _id: string; name: string } | string | null;
  isActive: boolean;
  createdAt: string;
}

// Obtener todas las categorías
export async function getCategories(): Promise<Category[]> {
  const response = await api.get('/products/categories');
  return response.data.data;
}

// Crear categoría
export async function createCategory(categoryData: Partial<Category>): Promise<Category> {
  const response = await api.post('/products/categories', categoryData);
  return response.data.data;
}

// Actualizar categoría
export async function updateCategory(id: string, updateData: Partial<Category>): Promise<Category> {
  const response = await api.patch(`/products/categories/${id}`, updateData);
  return response.data.data;
}

// Eliminar categoría
export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/products/categories/${id}`);
}
