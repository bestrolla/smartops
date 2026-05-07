'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { Image as ImageIcon } from 'lucide-react';

interface Theme {
  id?: string;
  name?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  layout?: {
    header?: string;
    stats?: string;
    services?: string;
    testimonials?: string;
    products?: string;
  };
}

interface ProductsSectionProps {
  products?: Product[];
  theme?: Theme | null;
}

export function ProductsSection({ products = [] }: { products?: Product[] }) {
  // Hooks al tope, nunca condicionales
  const [expanded, setExpanded] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);

  const hasProducts = Array.isArray(products) && products.length > 0;
  if (!hasProducts) {
    return null;
  }

  const total = products.length;
  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div className="px-6 py-4 bg-white relative">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-4 h-4 text-gray-700" />
        <h3 className="font-bold text-gray-900 font-montserrat text-sm">Productos</h3>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex" style={{ transform: `translateX(-${index * 100}%)`, transition: 'transform 300ms ease' }}>
          {products.map((product) => (
            <div key={product.id} className="min-w-full p-4 border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={getImageUrl(product.images[0])}
                    alt={product.name}
                    className="w-20 h-20 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-base font-bold font-montserrat text-gray-900">{product.name}</h4>
                  {product.description && (
                    <p className="text-sm text-gray-600 font-montserrat mt-1 line-clamp-3">{product.description}</p>
                  )}
                  <div className="flex items-center justify-end mt-3">
                    {typeof (product as any).stock === 'number' && (
                      <span className={`text-xs font-montserrat ${(product as any).stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(product as any).stock > 0 ? `${(product as any).stock} en stock` : 'Sin stock'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={prev}
          className="absolute -left-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow w-7 h-7 rounded-full flex items-center justify-center"
          aria-label="Anterior"
        >
          <span className="sr-only">Anterior</span>
          <span className="text-gray-700">‹</span>
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute -right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow w-7 h-7 rounded-full flex items-center justify-center"
          aria-label="Siguiente"
        >
          <span className="sr-only">Siguiente</span>
          <span className="text-gray-700">›</span>
        </button>
      </div>
    </div>
  );
}

// Función para formatear el precio del producto (soporta string/number)
const formatProductPrice = (product: Product): string => {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const basePrice = (product as unknown as { basePrice?: number | string }).basePrice;
  const price = (product as unknown as { price?: number | string }).price;
  const raw = typeof basePrice !== 'undefined' ? basePrice : price;

  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
      ? Number.parseFloat(raw)
      : 0;

  return formatter.format(Number.isFinite(value) ? value : 0);
};

// Función para obtener la URL de la imagen
const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
  const origin = baseUrl.replace(/\/$/, '');
  return `${origin}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
};