import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createProductVariant, Product as APIProduct, ProductVariant, getProducts } from '@/lib/productApi';

interface VariantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: ProductVariant) => void;
}

export function VariantForm({ isOpen, onClose, onSave }: VariantFormProps) {
  const [allProducts, setAllProducts] = useState<APIProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<APIProduct | null>(null);
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrls, setImageUrls] = useState<string>(''); // Comma-separated URLs
  const [isActive, setIsActive] = useState(true);
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false); // New state for loading products

  useEffect(() => {
    if (isOpen) {
      // Reset form fields when modal opens
      setSku('');
      setPrice('');
      setStock('0');
      setImageUrls('');
      setIsActive(true);
      setOptionValues({}); // Reset option values
      setSelectedProduct(null); // Reset selected product
      setError(null);

      setLoadingProducts(true);
      getProducts({ includeVariants: true }) // Fetch all products with variants
        .then((data) => {
          setAllProducts(data); // Removed filter for hasVariants
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Error al cargar productos');
          setAllProducts([]);
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [isOpen]);

  // When selectedProduct changes, update initial option values for display
  useEffect(() => {
    // Only pre-fill option values if the selected product *already* has variant options defined
    if (selectedProduct && selectedProduct.hasVariants && selectedProduct.variantOptions && selectedProduct.variantOptions.length > 0) {
      const initialOptions: Record<string, string> = {};
      selectedProduct.variantOptions.forEach(option => {
        if (option.values && option.values.length > 0) {
          initialOptions[option.name] = option.values[0]; // Pre-select first option value
        }
      });
      setOptionValues(initialOptions);
    } else {
      setOptionValues({}); // Clear options if no product with variants is selected or product doesn't have defined variant options
    }
  }, [selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedProduct) {
      setError('Por favor, selecciona un producto.');
      setLoading(false);
      return;
    }
    if (!sku.trim() || !price.trim()) {
      setError('El SKU y el Precio son obligatorios.');
      setLoading(false);
      return;
    }

    // Validate that all variant options are selected ONLY IF the product has them defined
    if (selectedProduct.hasVariants && selectedProduct.variantOptions && selectedProduct.variantOptions.length > 0) {
      const allOptionsSelected = selectedProduct.variantOptions.every(option => 
          optionValues[option.name] !== undefined && optionValues[option.name] !== ''
      );
      if (!allOptionsSelected) {
          setError('Por favor, selecciona todos los valores de las opciones de variante.');
          setLoading(false);
          return;
      }
    }

    try {
      const newVariant: Partial<ProductVariant> = {
        sku,
        price: parseFloat(price),
        stock: parseInt(stock),
        isActive,
        images: imageUrls.split(',').map(url => url.trim()).filter(url => url !== ''),
        // Only send optionValues if the product has them defined
        ...(selectedProduct.hasVariants && selectedProduct.variantOptions && selectedProduct.variantOptions.length > 0 && { optionValues }),
      };

      const savedVariant = await createProductVariant(selectedProduct.id, newVariant); // Use selectedProduct.id
      onSave(savedVariant);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la variante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nueva Variante" className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 p-6 border border-smartops-gray rounded-lg bg-smartops-white shadow-md">
        {error && <div className="text-red-500 text-sm font-montserrat mb-4">{error}</div>}

        {/* Product Selection */}
        <div className="space-y-2 relative z-50">
          <Label htmlFor="product-select" className="font-montserrat text-smartops-dark">Producto al que añadir la variante</Label>
          <Select onValueChange={(productId) => {
            const product = allProducts.find(p => p.id === productId) || null;
            setSelectedProduct(product);
            // Reset option values when product changes (handled by useEffect based on selectedProduct)
          }} value={selectedProduct?.id || ''} disabled={loadingProducts}> 
            <SelectTrigger className="font-montserrat mt-1 text-smartops-dark">
              <SelectValue placeholder="Seleccionar producto" />
            </SelectTrigger>
            <SelectContent 
              className="z-[9999] max-h-60 overflow-auto bg-white shadow-lg rounded-md border" 
              position="popper"
              style={{ zIndex: 9999 }}
            >
              {loadingProducts && <SelectItem value="loading" disabled>Cargando productos...</SelectItem>}
              {allProducts.length === 0 && !loadingProducts && <SelectItem value="no-products" disabled>No hay productos disponibles</SelectItem>}
              {allProducts.map(product => (
                <SelectItem key={product.id} value={product.id} className="text-smartops-dark">
                  {product.name} ({product.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variant Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku" className="font-montserrat text-smartops-dark">SKU</Label>
            <Input id="sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)} required className="font-montserrat mt-1" />
          </div>
          <div>
            <Label htmlFor="price" className="font-montserrat text-smartops-dark">Precio</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="font-montserrat mt-1" step="0.01" />
          </div>
          <div>
            <Label htmlFor="stock" className="font-montserrat text-smartops-dark">Stock</Label>
            <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} required className="font-montserrat mt-1" min="0" />
          </div>
          <div>
            <Label htmlFor="imageUrls" className="font-montserrat text-smartops-dark">URLs de Imagen (separadas por coma)</Label>
            <Input id="imageUrls" type="text" value={imageUrls} onChange={(e) => setImageUrls(e.target.value)} className="font-montserrat mt-1" placeholder="ej. url1.jpg, url2.png" />
          </div>
        </div>

        {/* Dynamic Variant Options Selection (only if product has them) */}
        {selectedProduct && selectedProduct.hasVariants && selectedProduct.variantOptions && selectedProduct.variantOptions.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="font-semibold text-smartops-dark font-montserrat">Opciones de Variante:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedProduct.variantOptions.map(option => (
                <div key={option.name}>
                  <Label htmlFor={`option-${option.name}`} className="font-montserrat text-smartops-dark">{option.name}</Label>
                  <Select
                    value={optionValues[option.name] || ''}
                    onValueChange={(value) => {
                      setOptionValues(prev => ({ ...prev, [option.name]: value }));
                    }}
                  >
                    <SelectTrigger className="font-montserrat mt-1 text-smartops-dark">
                      <SelectValue placeholder={`Seleccionar ${option.name}`} />
                    </SelectTrigger>
                    <SelectContent 
                      className="z-[9999] max-h-60 overflow-auto bg-white shadow-lg rounded-md border" 
                      position="popper"
                      style={{ zIndex: 9999 }}
                    >
                      {option.values.map(val => (
                        <SelectItem key={val} value={val} className="text-smartops-dark">
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="isActive"
            checked={isActive}
            onCheckedChange={setIsActive}
            className="data-[state=checked]:bg-smartops-blue data-[state=unchecked]:bg-smartops-gray"
          />
          <Label htmlFor="isActive" className="font-montserrat text-smartops-dark">Activa</Label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="smartopsOutline" onClick={onClose} className="font-montserrat">
            Cancelar
          </Button>
          <Button type="submit" variant="smartops" disabled={loading} className="font-montserrat">
            {loading ? 'Guardando...' : 'Crear Variante'}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 