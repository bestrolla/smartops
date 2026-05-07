import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { adjustStock, InventoryItem } from '@/lib/inventoryApi';
import { getProducts, Product as APIProduct, ProductVariant } from '@/lib/productApi';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { toast } from 'react-toastify';

interface InventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  // editingItem will contain product_id and potentially variant_id for pre-selection
  editingItem?: InventoryItem | null;
  // existingInventoryItems to filter out products already in inventory
  existingInventoryItems?: InventoryItem[];
}

export function InventoryForm({ isOpen, onClose, onSave, editingItem, existingInventoryItems = [] }: InventoryFormProps) {
  const [allProducts, setAllProducts] = useState<APIProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<APIProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [delta, setDelta] = useState<string>('0');
  const [currentStock, setCurrentStock] = useState<string>('0');
  const [reason, setReason] = useState<string>('');
  const [customThreshold, setCustomThreshold] = useState<string>('50');
  const [savedReasons, setSavedReasons] = useState<string[]>([]);
  const [isEditingReason, setIsEditingReason] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  // const [loadingVariants, setLoadingVariants] = useState(false); // No longer needed as variants loaded with products

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoadingProducts(true);
      // Load only active products
      getProducts({ includeVariants: true, filter: { isActive: true } })
        .then((data) => {
          // Filter out inactive variants as well
          const activeProducts = data.map(product => ({
            ...product,
            variants: product.variants?.filter(variant => variant.isActive) || []
          }));
          
          // Show all active products (no filtering by existing inventory)
          const availableProducts = activeProducts;
          
          setAllProducts(availableProducts);
          
          // Load saved reasons from localStorage
          const saved = localStorage.getItem('inventory_reasons');
          if (saved) {
            try {
              setSavedReasons(JSON.parse(saved));
            } catch (e) {
              console.error('Error loading saved reasons:', e);
            }
          }
          
          if (editingItem) {
            // First, try to find a direct product match for the editing item
            let foundProduct: APIProduct | null = null;
            let foundVariant: ProductVariant | null = null;

            // Case 1: editingItem.product_id._id is a main product ID
            const directProduct = activeProducts.find(p => p._id === editingItem.product_id._id || p.id === editingItem.product_id._id);
            if (directProduct && !directProduct.hasVariants) {
              foundProduct = directProduct;
            } else if (directProduct && directProduct.hasVariants) {
              // Case 2: editingItem.product_id._id could be a variant ID within a product
              // Iterate through products to find the variant
              for (const product of activeProducts) {
                if (product.variants) {
                  const variant = product.variants.find(v => v._id === editingItem.product_id._id);
                  if (variant) {
                    foundProduct = product;
                    foundVariant = variant;
                    break;
                  }
                }
              }
            }
            
            setSelectedProduct(foundProduct);
            setSelectedVariant(foundVariant);
            setCurrentStock(editingItem.current_stock.toString());
            setCustomThreshold(editingItem.low_stock_threshold.toString());
            setDelta('0'); // Reset delta for new adjustment
          } else {
            // Reset for new item
            setSelectedProduct(null);
            setSelectedVariant(null);
            setDelta('0');
            setCurrentStock('0');
            setReason('');
            setCustomThreshold('50');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Error al cargar productos');
        })
        .finally(() => setLoadingProducts(false));
    } else {
      // Clean up when modal closes
      setError(null);
      setDelta('0');
      setCurrentStock('0');
      setReason('');
      setSelectedProduct(null);
      setSelectedVariant(null);
      setCustomThreshold('50');
    }
  }, [isOpen, editingItem]);

  // When selectedProduct changes, if it has variants, auto-select first variant
  useEffect(() => {
    if (selectedProduct && selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0) {
        setSelectedVariant(selectedProduct.variants[0]);
    } else if (selectedProduct && !selectedProduct.hasVariants) {
        setSelectedVariant(null); // No variant for simple product
    }
    
    // Update current stock when product/variant changes
    if (selectedProduct) {
      if (selectedVariant) {
        setCurrentStock(selectedVariant.stock.toString());
      } else {
        setCurrentStock(selectedProduct.stock?.toString() || '0');
      }
    }
  }, [selectedProduct, selectedVariant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const adjustedDelta = delta.trim() === '' ? 0 : parseInt(delta);
    const currentStockValue = parseInt(currentStock);
    const thresholdValue = parseInt(customThreshold);
    
    if (delta.trim() !== '' && isNaN(adjustedDelta)) {
      setError('Por favor, ingresa una cantidad de ajuste válida.');
      setLoading(false);
      return;
    }
    if (isNaN(currentStockValue) || currentStockValue < 0) {
      setError('Por favor, ingresa un stock actual válido.');
      setLoading(false);
      return;
    }
    if (isNaN(thresholdValue) || thresholdValue < 0) {
      setError('Por favor, ingresa un umbral válido.');
      setLoading(false);
      return;
    }
    if (!reason.trim()) {
        setError('Por favor, ingresa una razón para el ajuste de inventario.');
        setLoading(false);
        return;
    }
    if (reason.trim().length < 3) {
        setError('La razón debe tener al menos 3 caracteres.');
        setLoading(false);
        return;
    }
    if (!selectedProduct) {
        setError('Por favor, selecciona un producto.');
        setLoading(false);
        return;
    }

    const baseId = selectedProduct._id ?? selectedProduct.id;
    if (!baseId) {
      setError('Producto seleccionado inválido.');
      setLoading(false);
      return;
    }

    let productIdToAdjust: string;
    if (selectedProduct.hasVariants) {
      if (!selectedVariant) {
        setError('Por favor, selecciona una variante para el producto.');
        setLoading(false);
        return;
      }
      productIdToAdjust = selectedVariant._id;
    } else {
      productIdToAdjust = baseId;
    }

    try {
      const savedItem = await adjustStock(productIdToAdjust, {
        delta: adjustedDelta,
        reason: reason.trim(),
        currentStock: currentStockValue,
        lowStockThreshold: thresholdValue
      });
      toast.success('Inventario guardado exitosamente');
      
      // Reset form state after successful save
      setSelectedProduct(null);
      setSelectedVariant(null);
      setDelta('0');
      setCurrentStock('0');
      setReason('');
      setCustomThreshold('50');
      setError(null);
      
      onSave(savedItem);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al guardar el inventario';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-4">{error}</div>}

        {/* Product/Variant Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-select" className="text-gray-700 font-medium">Producto</Label>
            <Select onValueChange={(productId) => {
              const product = allProducts.find(p => p.id === productId || p._id === productId) || null;
              setSelectedProduct(product);
              setSelectedVariant(null);
            }} value={selectedProduct?.id || selectedProduct?._id || ''} disabled={loadingProducts}>
              <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300 focus:border-blue-500">
                <SelectValue placeholder={editingItem ? "Producto seleccionado" : "Seleccionar producto"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                {loadingProducts && <SelectItem value="loading" disabled>Cargando productos...</SelectItem>}
                {allProducts.length === 0 && !loadingProducts && <SelectItem value="no-products" disabled>No hay productos disponibles</SelectItem>}
                {allProducts.map(product => (
                  <SelectItem key={product.id} value={product.id} className="text-gray-900 hover:bg-blue-50">
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && selectedProduct.hasVariants && selectedProduct.variants && selectedProduct.variants.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="variant-select" className="text-gray-700 font-medium">Variante</Label>
                <Select onValueChange={(variantId) => {
                  const variant = selectedProduct.variants?.find(v => v._id === variantId) || null;
                  setSelectedVariant(variant);
                }} value={selectedVariant?._id || ''} disabled={loadingProducts || !selectedProduct}>
                  <SelectTrigger className="mt-1 text-gray-900 bg-white border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Seleccionar variante" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {selectedProduct.variants.map(variant => (
                      <SelectItem key={variant._id} value={variant._id} className="text-gray-900 hover:bg-blue-50">
                        {Object.entries(variant.optionValues || {}).map(([optName, optValue]) => `${optName}: ${optValue}`).join(', ')} (SKU: {variant.sku}, Stock: {variant.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Stock Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentStock" className="text-gray-700 font-medium">Stock Actual</Label>
            <Input
              id="currentStock"
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              required
              min="0"
              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Stock actual del producto"
            />
            <p className="text-xs text-gray-500 mt-1">Cantidad actual en inventario</p>
          </div>
          <div>
            <Label htmlFor="delta" className="text-gray-700 font-medium">Cantidad de Ajuste (Delta) <span className="text-gray-400 font-normal">(Opcional)</span></Label>
            <Input
              id="delta"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ej. 5 para añadir, -3 para quitar (dejar vacío = sin ajuste)"
            />
            <p className="text-xs text-gray-500 mt-1">Positivo para agregar, negativo para quitar. Dejar vacío para solo actualizar stock actual.</p>
          </div>
        </div>

        {/* Threshold and Reason */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customThreshold" className="text-gray-700 font-medium">Umbral Bajo Stock</Label>
            <Input
              id="customThreshold"
              type="number"
              value={customThreshold}
              onChange={(e) => setCustomThreshold(e.target.value)}
              required
              min="0"
              className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="50"
            />
            <p className="text-xs text-gray-500 mt-1">Alerta cuando el stock esté por debajo de este valor</p>
          </div>
          <div>
            <Label htmlFor="reason" className="text-gray-700 font-medium">Razón del Ajuste</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select onValueChange={(value) => {
                  if (value === 'custom') {
                    setIsEditingReason(true);
                    setReason('');
                  } else {
                    setReason(value);
                    setIsEditingReason(false);
                  }
                }} value={isEditingReason ? 'custom' : reason}>
                  <SelectTrigger className="flex-1 text-gray-900 bg-white border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Seleccionar razón guardada" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    {savedReasons.map((savedReason, index) => (
                      <SelectItem key={index} value={savedReason} className="text-gray-900 hover:bg-blue-50">
                        {savedReason}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-gray-900 hover:bg-blue-50 font-medium">
                      + Escribir nueva razón
                    </SelectItem>
                  </SelectContent>
                </Select>
                {savedReasons.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingReason(!isEditingReason);
                      if (!isEditingReason) {
                        setReason('');
                      }
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {isEditingReason ? 'Seleccionar' : 'Editar'}
                  </Button>
                )}
              </div>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej. Ajuste por inventario físico, Devolución de cliente, etc."
              />
              {savedReasons.length > 0 && (
                <div className="text-xs text-gray-500">
                  💡 Las razones se guardan automáticamente y se pueden reutilizar
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              // Reset all form state
              setError(null);
              setDelta('0');
              setCurrentStock('0');
              setReason('');
              setCustomThreshold('50');
              setSelectedProduct(null);
              setSelectedVariant(null);
              onClose();
            }} 
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar Ajuste'}
          </Button>
        </div>
      </form>
  );
}