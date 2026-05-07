// lib/productApi.ts
import api from './api';

export interface ProductVariant {
  _id: string;
  sku: string;
  price: number;
  baseCost?: number; // Costo de la variante
  stock: number;
  optionValues?: Record<string, string>; // { Color: "Rojo", Talla: "M" }
  images?: string[];
  isActive: boolean;
}

export interface Product {
  _id?: string;
  id: string; // id requerido en frontend
  name: string;
  sku: string;
  price: number;
  baseCost?: number; // Costo del producto general
  description?: string;
  hasVariants: boolean;
  category: string | { _id: string; name: string };
  isActive: boolean;
  images?: string[];
  stock?: number;
  isDigital?: boolean;
  digitalDetails?: { downloadUrl: string; fileSize?: string; fileType?: string };
  variantOptions?: { name: string; values: string[] }[];
  variants?: ProductVariant[];
  [key: string]: any;
}

// Opciones para listar productos
export interface GetProductsOptions {
  page?: number;
  limit?: number;
  sort?: string;
  includeVariants?: boolean;
  filter?: Record<string, any>;
}

// Obtener todos los productos
export async function getProducts(options: GetProductsOptions = {}): Promise<Product[]> {
  const { page = 1, limit = 10, sort = '-createdAt', includeVariants = false, filter = {} } = options;
  const response = await api.get('/products/simple', { params: { page, limit, sort, includeVariants, ...filter } });

  return response.data.data.map((product: Product) => ({
    ...product,
    id: product._id || product.id, // normalización
    baseCost: product.baseCost || 0,
    variants: includeVariants ? product.variants || [] : undefined
  }));
}

// Obtener un producto por ID
export async function getProductById(id: string, includeVariants = true): Promise<Product> {
  const response = await api.get(`/products/simple/${id}`, { params: { includeVariants } });
  const product: Product = response.data.data;
  return {
    ...product,
    id: product._id || product.id, // normalización
    baseCost: product.baseCost || 0,
    variants: includeVariants ? product.variants || [] : undefined
  };
}

// Funciones de variantes
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const response = await api.get(`/products/${productId}/variants`);
  return response.data.data.map((variant: ProductVariant) => ({
    ...variant,
    baseCost: variant.baseCost || 0
  }));
}

// Crear/actualizar/eliminar productos
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const response = await api.post('/products/simple', productData);
  const product: Product = response.data.data;
  return { ...product, id: product._id || product.id, baseCost: product.baseCost || 0, variants: product.variants || [] };
}

export async function updateProduct(id: string, updateData: Partial<Product>): Promise<Product> {
  const response = await api.put(`/products/simple/${id}`, updateData);
  const product: Product = response.data.data;
  return { ...product, id: product._id || product.id, baseCost: product.baseCost || 0, variants: product.variants || [] };
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/simple/${id}`);
}

// Variantes
export async function createProductVariant(productId: string, variantData: Partial<ProductVariant>): Promise<ProductVariant> {
  const response = await api.post(`/products/${productId}/variants`, variantData);
  return { ...response.data.data, baseCost: response.data.data.baseCost || 0 };
}

export async function updateProductVariant(productId: string, variantId: string, updateData: Partial<ProductVariant>): Promise<ProductVariant> {
  const response = await api.put(`/products/${productId}/variants/${variantId}`, updateData);
  return { ...response.data.data, baseCost: response.data.data.baseCost || 0 };
}

export async function deleteProductVariant(productId: string, variantId: string): Promise<void> {
  await api.delete(`/products/${productId}/variants/${variantId}`);
}