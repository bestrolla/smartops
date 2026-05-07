import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, createOrder, updateOrder, ProductOrder } from '@/lib/ordersApi';
import { getProducts, Product as APIProduct, ProductVariant, getProductVariants } from '@/lib/productApi';
import { X, Plus } from 'lucide-react';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  editingOrder?: Order | null;
}

export function OrderForm({ isOpen, onClose, onSave, editingOrder }: OrderFormProps) {
  const [customer, setCustomer] = useState(editingOrder?.customer || '');
  const [shippingAddress, setShippingAddress] = useState({
    street: editingOrder?.shippingAddress?.street || '',
    city: editingOrder?.shippingAddress?.city || '',
    state: editingOrder?.shippingAddress?.state || '',
    zipCode: editingOrder?.shippingAddress?.zipCode || '',
    country: editingOrder?.shippingAddress?.country || '',
    additionalInfo: editingOrder?.shippingAddress?.additionalInfo || ''
  });
  const [billingAddress, setBillingAddress] = useState({
    street: editingOrder?.billingAddress?.street || '',
    city: editingOrder?.billingAddress?.city || '',
    state: editingOrder?.billingAddress?.state || '',
    zipCode: editingOrder?.billingAddress?.zipCode || '',
    country: editingOrder?.billingAddress?.country || '',
    additionalInfo: editingOrder?.billingAddress?.additionalInfo || ''
  });
  const [paymentMethod, setPaymentMethod] = useState(editingOrder?.paymentMethod || 'credit_card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardLastFour: editingOrder?.paymentDetails?.cardLastFour || '',
    cardBrand: editingOrder?.paymentDetails?.cardBrand || ''
  });
  const [notes, setNotes] = useState(editingOrder?.notes || '');
  const [metadata, setMetadata] = useState({
    tipoEnvio: editingOrder?.metadata?.tipoEnvio || '',
    regaloPara: editingOrder?.metadata?.regaloPara || ''
  });
  const [status, setStatus] = useState<Order['status']>(editingOrder?.status || 'pending');
  const [allProducts, setAllProducts] = useState<APIProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<APIProduct | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<Order['items']>(editingOrder?.items || []);
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantsError, setVariantsError] = useState<string | null>(null);

  // Función para generar ObjectId compatible con el navegador
  const generateObjectId = () => {
    // Generar 24 caracteres hexadecimales (12 bytes = 24 caracteres hex)
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    if (isOpen) {
      // Generar ObjectId automáticamente si no hay orden editando
      const customerId = editingOrder?.customer || generateObjectId();
      setCustomer(customerId);
      
      setShippingAddress({
        street: editingOrder?.shippingAddress?.street || '',
        city: editingOrder?.shippingAddress?.city || '',
        state: editingOrder?.shippingAddress?.state || '',
        zipCode: editingOrder?.shippingAddress?.zipCode || '',
        country: editingOrder?.shippingAddress?.country || '',
        additionalInfo: editingOrder?.shippingAddress?.additionalInfo || ''
      });
      setBillingAddress({
        street: editingOrder?.billingAddress?.street || '',
        city: editingOrder?.billingAddress?.city || '',
        state: editingOrder?.billingAddress?.state || '',
        zipCode: editingOrder?.billingAddress?.zipCode || '',
        country: editingOrder?.billingAddress?.country || '',
        additionalInfo: editingOrder?.billingAddress?.additionalInfo || ''
      });
      setPaymentMethod(editingOrder?.paymentMethod || 'credit_card');
      setPaymentDetails({
        cardLastFour: editingOrder?.paymentDetails?.cardLastFour || '',
        cardBrand: editingOrder?.paymentDetails?.cardBrand || ''
      });
      setNotes(editingOrder?.notes || '');
      setMetadata({
        tipoEnvio: editingOrder?.metadata?.tipoEnvio || '',
        regaloPara: editingOrder?.metadata?.regaloPara || ''
      });
      setStatus(editingOrder?.status || 'pending');
      setOrderItems(editingOrder?.items || []);
      setSelectedProduct(null);
      setItemQuantity(1);
      setVariantQuantities({});
      setError(null);
      setVariantsError(null);
      
      setLoading(true);
      getProducts()
        .then((data) => {
          setAllProducts(data);
          setError(null);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Error al cargar productos');
          setAllProducts([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, editingOrder]);

  // NEW useEffect to load variants dynamically
  useEffect(() => {
    if (selectedProduct && selectedProduct.hasVariants) {
      setLoadingVariants(true);
      setVariantsError(null);
      getProductVariants(selectedProduct.id!) // <-- asegurar string
        .then(variants => {
          setSelectedProduct(prev => prev ? { ...prev, variants } : null);
          setVariantsError(null);
        })
        .catch(err => {
          setVariantsError(err.response?.data?.message || 'Error al cargar variantes.');
          setSelectedProduct(prev => prev ? { ...prev, variants: [] } : null);
        })
        .finally(() => {
          setLoadingVariants(false);
        });
    } else if (selectedProduct && !selectedProduct.hasVariants) {
      setSelectedProduct(prev => prev ? { ...prev, variants: [] } : null);
    }
  }, [selectedProduct?.id, selectedProduct?.hasVariants]);

  const handleAddSimpleOrderItem = () => {
    if (selectedProduct && !selectedProduct.hasVariants && itemQuantity > 0) {
      if (selectedProduct.stock !== undefined && selectedProduct.stock < itemQuantity) {
        setError(`Stock insuficiente para el producto. Disponible: ${selectedProduct.stock}`);
        return;
      }

      console.log('Selected product:', selectedProduct);
      console.log('Product price:', selectedProduct.price);
      console.log('Product basePrice:', selectedProduct.basePrice);

      const newItem: ProductOrder = {
        productId: selectedProduct.id!, // <-- asegurar string
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: itemQuantity,
        priceAtPurchase: selectedProduct.price || 0,
      };

      console.log('New item created:', newItem);

      setOrderItems((prevItems) => [...prevItems, newItem]);
      setSelectedProduct(null);
      setItemQuantity(1);
      setError(null);
    } else if (selectedProduct?.hasVariants) {
        setError('Por favor, selecciona una variante específica para productos con variantes.'); // User guidance
    }
  };

  const handleAddSpecificVariantOrderItem = (variant: ProductVariant, quantity: number) => {
    if (!selectedProduct) {
        setError('No se ha seleccionado un producto.');
        return;
    }
    if (quantity <= 0) {
        setError('La cantidad debe ser mayor que cero.');
        return;
    }
    if (variant.stock < quantity) {
        setError(`Stock insuficiente para la variante ${variant.sku}. Disponible: ${variant.stock}`);
        return;
    }

    console.log('Selected variant:', variant);
    console.log('Variant price:', variant.price);

    const newItem: ProductOrder = {
        productId: selectedProduct.id!, // <-- asegurar string
        name: selectedProduct.name,
        sku: variant.sku,
        quantity: quantity,
        priceAtPurchase: variant.price,
        variantId: variant._id,
        variantInfo: Object.entries(variant.optionValues || {}).map(([optionName, optionValue]) => ({
            optionName: optionName,
            optionValue: optionValue
        })),
    };

    console.log('New variant item created:', newItem);

    setOrderItems((prevItems) => [...prevItems, newItem]);
    setVariantQuantities(prev => ({ ...prev, [variant._id]: 1 })); // Reset quantity for this variant
    setError(null);
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar que hay al menos un item en la orden
    if (orderItems.length === 0) {
      setError('Debe agregar al menos un producto a la orden');
      setLoading(false);
      return;
    }

    // Validar dirección de envío
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      setError('La dirección de envío es requerida');
      setLoading(false);
      return;
    }

    // Validar que el customer sea un ObjectId válido o generar uno temporal
    let customerId = customer;
    if (!customer || customer.trim() === '') {
      customerId = generateObjectId();
    } else if (!/^[0-9a-fA-F]{24}$/.test(customer)) {
      setError('El ID del cliente debe ser un ObjectId válido de 24 caracteres');
      setLoading(false);
      return;
    }

    const orderData: Partial<Order> = {
      customer: customerId,
      items: orderItems, // usar directamente ProductOrder[]
      shippingAddress,
      billingAddress: billingAddress.street ? billingAddress : undefined,
      paymentMethod,
      paymentDetails: paymentDetails.cardLastFour ? paymentDetails : undefined,
      notes: notes || undefined,
      metadata: (metadata.tipoEnvio || metadata.regaloPara) ? metadata : undefined,
      status
    };

    try {
      console.log('Enviando datos de orden:', orderData);
      let savedOrder: Order;
      if (editingOrder) {
        savedOrder = await updateOrder(editingOrder._id, orderData);
      } else {
        savedOrder = await createOrder(orderData);
      }
      console.log('Orden guardada exitosamente:', savedOrder);
      onSave(savedOrder);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar la orden:', err);
      console.error('Respuesta del servidor:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Error al guardar la orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && <div className="text-red-500 text-sm font-montserrat mb-4">{error}</div>}
        {/* Información del Cliente */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-smartops-dark font-montserrat">Información del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer" className="font-montserrat text-smartops-dark">ID del Cliente</Label>
              <div className="flex gap-2">
                <Input 
                  id="customer" 
                  type="text" 
                  value={customer} 
                  onChange={(e) => setCustomer(e.target.value)} 
                  className="font-montserrat mt-1 flex-1" 
                  placeholder="ID generado automáticamente (puedes editarlo)"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomer(generateObjectId());
                  }}
                  className="mt-1"
                >
                  Generar ID
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ID generado automáticamente. Puedes editarlo o generar uno nuevo con el botón.
              </p>
            </div>
            <div>
              <Label htmlFor="status" className="font-montserrat text-smartops-dark">Estado</Label>
              <Select value={status} onValueChange={(value: Order['status']) => setStatus(value)}>
                <SelectTrigger className="font-montserrat mt-1">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Dirección de Envío */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-smartops-dark font-montserrat">Dirección de Envío</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="shippingStreet" className="font-montserrat text-smartops-dark">Calle</Label>
              <Input 
                id="shippingStreet" 
                type="text" 
                value={shippingAddress.street} 
                onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))} 
                required 
                className="font-montserrat mt-1" 
              />
            </div>
            <div>
              <Label htmlFor="shippingCity" className="font-montserrat text-smartops-dark">Ciudad</Label>
              <Input 
                id="shippingCity" 
                type="text" 
                value={shippingAddress.city} 
                onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))} 
                required 
                className="font-montserrat mt-1" 
              />
            </div>
            <div>
              <Label htmlFor="shippingState" className="font-montserrat text-smartops-dark">Estado/Provincia</Label>
              <Input 
                id="shippingState" 
                type="text" 
                value={shippingAddress.state} 
                onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))} 
                required 
                className="font-montserrat mt-1" 
              />
            </div>
            <div>
              <Label htmlFor="shippingZipCode" className="font-montserrat text-smartops-dark">Código Postal</Label>
              <Input 
                id="shippingZipCode" 
                type="text" 
                value={shippingAddress.zipCode} 
                onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))} 
                required 
                className="font-montserrat mt-1" 
              />
            </div>
            <div>
              <Label htmlFor="shippingCountry" className="font-montserrat text-smartops-dark">País</Label>
              <Input 
                id="shippingCountry" 
                type="text" 
                value={shippingAddress.country} 
                onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))} 
                required 
                className="font-montserrat mt-1" 
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="shippingAdditionalInfo" className="font-montserrat text-smartops-dark">Información Adicional</Label>
              <Input 
                id="shippingAdditionalInfo" 
                type="text" 
                value={shippingAddress.additionalInfo} 
                onChange={(e) => setShippingAddress(prev => ({ ...prev, additionalInfo: e.target.value }))} 
                className="font-montserrat mt-1" 
                placeholder="Apartamento, piso, etc."
              />
            </div>
          </div>
        </div>

        {/* Información de Pago */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-smartops-dark font-montserrat">Información de Pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod" className="font-montserrat text-smartops-dark">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as Order['paymentMethod'])}>
                <SelectTrigger className="font-montserrat mt-1">
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="font-montserrat text-smartops-dark">Notas</Label>
              <Input 
                id="notes" 
                type="text" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="font-montserrat mt-1" 
                placeholder="Notas adicionales sobre la orden"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border rounded-md p-4 bg-smartops-white/10">
          <h3 className="text-lg font-semibold text-smartops-dark font-montserrat">Productos de la Orden</h3>
          
          <div className="flex flex-col md:flex-row gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="product-select" className="font-montserrat text-smartops-dark">Seleccionar Producto</Label>
              <Select onValueChange={(productId) => {
                const product = allProducts.find(p => p.id === productId) || null;
                setSelectedProduct(product);
                setItemQuantity(1); // Reset quantity for simple product
                setVariantQuantities({}); // Reset variant quantities
              }} value={selectedProduct?.id || ''}>
                <SelectTrigger className="font-montserrat mt-1 text-smartops-dark">
                  <SelectValue placeholder="Buscar o seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {loading && <SelectItem value="loading-products" disabled>Cargando productos...</SelectItem>}
                  {allProducts.length === 0 && !loading && <SelectItem value="no-products" disabled>No hay productos disponibles</SelectItem>}
                  {allProducts.map(product => (
                    <SelectItem key={product.id!} value={product.id!} className="text-smartops-dark">
                      {product.name} ({product.sku}) - ${product.price?.toFixed(2) || '0.00'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!selectedProduct?.hasVariants && selectedProduct && (
                <>
                  <div className="w-24">
                    <Label htmlFor="item-quantity" className="font-montserrat text-smartops-dark">Cantidad</Label>
                    <Input
                      id="item-quantity"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="font-montserrat mt-1 text-smartops-dark"
                    />
                  </div>
                  <div className="w-32">
                    <Label className="font-montserrat text-smartops-dark">Precio Unitario</Label>
                    <div className="mt-1 p-2 bg-gray-100 rounded border font-montserrat text-smartops-dark font-medium">
                      ${selectedProduct.price?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="w-32">
                    <Label className="font-montserrat text-smartops-dark">Total</Label>
                    <div className="mt-1 p-2 bg-blue-100 rounded border font-montserrat text-smartops-dark font-bold">
                      ${((selectedProduct.price || 0) * itemQuantity).toFixed(2)}
                    </div>
                  </div>
                </>
            )}
            {!selectedProduct?.hasVariants && (
                <Button type="button" variant="smartopsGradient" onClick={handleAddSimpleOrderItem} className="flex-shrink-0">
                    <Plus className="w-4 h-4" /> Añadir
                </Button>
            )}
          </div>

          {selectedProduct && selectedProduct.hasVariants && (
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold text-smartops-dark font-montserrat">Variantes Disponibles:</h4>
              {loadingVariants && <p className="text-smartops-dark/70">Cargando variantes...</p>}
              {variantsError && <p className="text-red-500 text-sm font-montserrat">{variantsError}</p>}
              {!loadingVariants && !variantsError && selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                <div className="space-y-4">
                  {selectedProduct.variants.map(variant => (
                    <div key={variant._id} className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 border border-smartops-gray rounded-md bg-smartops-white/5">
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <p className="font-semibold text-smartops-dark">
                          {selectedProduct.name}
                          <span className="ml-1 text-sm text-smartops-dark/80">
                            ({Object.entries(variant.optionValues || {}).map(([optName, optValue]) => `${optName}: ${optValue}`).join(', ')})
                          </span>
                        </p>
                        <div className="text-sm text-smartops-dark/80 space-y-1">
                          <p><strong>SKU:</strong> {variant.sku}</p>
                          <p><strong>Precio:</strong> <span className="text-green-600 font-semibold">${variant.price?.toFixed(2)}</span></p>
                          <p><strong>Stock:</strong> {variant.stock} unidades</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24">
                          <Label htmlFor={`variant-quantity-${variant._id}`} className="sr-only">Cantidad para {variant.sku}</Label>
                          <Input
                            id={`variant-quantity-${variant._id}`}
                            type="number"
                            min="1"
                            value={variantQuantities[variant._id] || 1}
                            onChange={(e) => setVariantQuantities(prev => ({ ...prev, [variant._id]: parseInt(e.target.value) || 1 }))}
                            className="font-montserrat text-smartops-dark"
                          />
                        </div>
                        <div className="w-32 text-center">
                          <div className="text-xs text-smartops-dark/60">Total</div>
                          <div className="text-sm font-bold text-blue-600">
                            ${((variant.price || 0) * (variantQuantities[variant._id] || 1)).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="smartopsGradient"
                          onClick={() => handleAddSpecificVariantOrderItem(variant, variantQuantities[variant._id] || 1)}
                          className="flex-shrink-0"
                          disabled={variant.stock === 0} // Disable if stock is 0
                        >
                          <Plus className="w-4 h-4" /> Añadir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !loadingVariants && !variantsError && selectedProduct.variants && selectedProduct.variants.length === 0 && (
                  <p className="text-smartops-dark/70">No hay variantes disponibles para este producto.</p>
                )
              )}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="space-y-2 bg-smartops-white/20 p-3 rounded-md mt-4">
              <h4 className="font-semibold text-smartops-dark font-montserrat">Ítems en la Orden:</h4>
              <ul className="text-sm text-smartops-dark">
                {orderItems.map((item, index) => (
                  <li key={index} className="flex items-center justify-between py-2 border-b border-smartops-white/10 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-smartops-dark">{item.name}</span>
                          <span className="text-sm text-smartops-dark/60 ml-2">({item.sku})</span>
                          {item.variantInfo && item.variantInfo.length > 0 && (
                            <span className="ml-2 text-xs text-smartops-dark/80">
                              ({item.variantInfo.map(v => `${v.optionName}: ${v.optionValue}`).join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-smartops-dark/60">
                            {item.quantity} x ${item.priceAtPurchase?.toFixed(2)}
                          </div>
                          <div className="font-bold text-green-600">
                            ${((item.priceAtPurchase || 0) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOrderItem(index)} className="text-smartops-dark hover:text-red-400 ml-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              
              {/* Resumen del total */}
              <div className="border-t border-smartops-white/20 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-smartops-dark">Subtotal:</span>
                  <span className="font-bold text-lg text-green-600">
                    ${orderItems.reduce((total, item) => total + ((item.priceAtPurchase || 0) * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-smartops-dark/60">
                  <span>Impuestos (16%):</span>
                  <span>
                    ${(orderItems.reduce((total, item) => total + ((item.priceAtPurchase || 0) * item.quantity), 0) * 0.16).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-smartops-white/20 pt-2 mt-2">
                  <span className="font-bold text-lg text-smartops-dark">Total:</span>
                  <span className="font-bold text-xl text-blue-600">
                    ${(orderItems.reduce((total, item) => total + ((item.priceAtPurchase || 0) * item.quantity), 0) * 1.16).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="smartopsOutline" onClick={onClose} className="font-montserrat">
            Cancelar
          </Button>
          <Button type="submit" variant="smartops" disabled={loading} className="font-montserrat">
            {loading ? 'Guardando...' : 'Guardar Orden'}
          </Button>
        </div>
      </form>
  );
}