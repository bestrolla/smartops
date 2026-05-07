import api  from './api';

// Interfaces simplificadas
export interface SimpleProduct {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  brand?: string;
  condition: 'new' | 'used' | 'refurbished';
  hasVariants: boolean;
  
  // Para productos simples
  price?: number;
  stock?: number;
  
  // Para productos con variantes
  variantAttributes?: VariantAttribute[];
  variants?: ProductVariant[];
  
  // Información adicional
  images: string[];
  isActive: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  
  // Información calculada (solo lectura)
  priceRange?: { min: number; max: number };
  totalStock?: number;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface ProductVariant {
  _id?: string;
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  images?: string[];
  isActive: boolean;
  sortOrder?: number;
  displayName?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  hasVariants?: boolean;
  isActive?: boolean;
  includeVariants?: boolean;
}

export interface ProductsResponse {
  status: string;
  results: number;
  total: number;
  totalPages: number;
  currentPage: number;
  data: SimpleProduct[];
}

// API Functions
export const getSimpleProducts = async (filters: ProductFilters = {}): Promise<SimpleProduct[]> => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/products/simple?${params.toString()}`);
    
    // Manejar tanto respuesta con paginación como array directo
    if (response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching simple products:', error);
    throw error;
  }
};

export const getSimpleProduct = async (id: string): Promise<SimpleProduct> => {
  try {
    const response = await api.get(`/products/simple/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching simple product:', error);
    throw error;
  }
};

export const createSimpleProduct = async (productData: Partial<SimpleProduct>): Promise<SimpleProduct> => {
  try {
    // Validaciones básicas
    if (!productData.name || !productData.sku || !productData.category) {
      throw new Error('Nombre, SKU y categoría son requeridos');
    }

    if (!productData.hasVariants && (!productData.price || productData.price <= 0)) {
      throw new Error('El precio es requerido para productos sin variantes');
    }

    if (productData.hasVariants && (!productData.variants || productData.variants.length === 0)) {
      throw new Error('Las variantes son requeridas para productos con variantes');
    }

    const response = await api.post('/products/simple', productData);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error creating simple product:', error);
    throw error;
  }
};

export const updateSimpleProduct = async (id: string, productData: Partial<SimpleProduct>): Promise<SimpleProduct> => {
  try {
    const response = await api.put(`/products/simple/${id}`, productData);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error updating simple product:', error);
    throw error;
  }
};

export const deleteSimpleProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/products/simple/${id}`);
  } catch (error) {
    console.error('Error deleting simple product:', error);
    throw error;
  }
};

export const searchSimpleProducts = async (query: string, limit: number = 10): Promise<SimpleProduct[]> => {
  try {
    const response = await api.get(`/products/simple/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error searching simple products:', error);
    throw error;
  }
};

export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const response = await api.get(`/products/simple/${productId}/variants`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching product variants:', error);
    throw error;
  }
};

// Utilidades
export const generateVariantCombinations = (attributes: VariantAttribute[]): Record<string, string>[] => {
  if (!attributes || attributes.length === 0) return [];

  const combinations: Record<string, string>[] = [];
  
  function generate(index: number, current: Record<string, string>) {
    if (index === attributes.length) {
      combinations.push({ ...current });
      return;
    }

    const attribute = attributes[index];
    for (const value of attribute.values) {
      current[attribute.name] = value;
      generate(index + 1, current);
    }
  }

  generate(0, {});
  return combinations;
};

export const generateVariantSku = (baseSku: string, attributes: Record<string, string>): string => {
  const attributeValues = Object.values(attributes)
    .map(value => value.substring(0, 3).toUpperCase())
    .join('-');
  return `${baseSku}-${attributeValues}`;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};

export const formatPriceRange = (min: number, max: number): string => {
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

// Validaciones
export const validateProductData = (product: Partial<SimpleProduct>): string[] => {
  const errors: string[] = [];

  if (!product.name?.trim()) {
    errors.push('El nombre es requerido');
  }

  if (!product.sku?.trim()) {
    errors.push('El SKU es requerido');
  }

  if (!product.category) {
    errors.push('La categoría es requerida');
  }

  if (!product.hasVariants) {
    if (!product.price || product.price <= 0) {
      errors.push('El precio debe ser mayor a 0 para productos sin variantes');
    }
  } else {
    if (!product.variantAttributes || product.variantAttributes.length === 0) {
      errors.push('Debe definir al menos un atributo para productos con variantes');
    }

    if (!product.variants || product.variants.length === 0) {
      errors.push('Debe crear al menos una variante');
    } else {
      product.variants.forEach((variant, index) => {
        if (!variant.sku?.trim()) {
          errors.push(`La variante ${index + 1} debe tener un SKU`);
        }
        if (!variant.price || variant.price <= 0) {
          errors.push(`La variante ${index + 1} debe tener un precio válido`);
        }
      });
    }
  }

  return errors;
};
