import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, getCategories } from '@/lib/categoryApi';
import { Product, createProduct, updateProduct, getProductVariants, updateProductVariant, deleteProductVariant, ProductVariant } from '@/lib/productApi';
import { X, Plus, ImageIcon } from 'lucide-react';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
}

interface ProductVariantOption {
  name: string;
  values: string[];
}

export function ProductForm({ isOpen, onClose, onSave, editingProduct }: ProductFormProps) {
  const [name, setName] = useState(editingProduct?.name || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [sku, setSku] = useState(editingProduct?.sku || '');
  const [basePrice, setBasePrice] = useState(editingProduct?.price?.toString() || '');
  const [baseCost, setBaseCost] = useState(editingProduct?.baseCost?.toString() || '');
  const [hasVariants, setHasVariants] = useState(editingProduct?.hasVariants ?? false);
  const [stock, setStock] = useState(editingProduct?.stock?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    editingProduct?.category ? (typeof editingProduct.category === 'string' ? editingProduct.category : editingProduct.category._id) : ''
  );
  const [isDigital, setIsDigital] = useState(editingProduct?.isDigital ?? false);
  const [downloadUrl, setDownloadUrl] = useState(editingProduct?.digitalDetails?.downloadUrl || '');
  const [fileSize, setFileSize] = useState(editingProduct?.digitalDetails?.fileSize || '');
  const [fileType, setFileType] = useState(editingProduct?.digitalDetails?.fileType || '');
  const [images, setImages] = useState<string[]>(editingProduct?.images || []);
  const [isActive, setIsActive] = useState(editingProduct?.isActive ?? true);
  const [variantOptions, setVariantOptions] = useState<ProductVariantOption[]>(
    editingProduct?.variantOptions?.map(opt => ({ name: opt.name, values: opt.values.map(String) })) || []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [currentVariants, setCurrentVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Inicializar campos
    setName(editingProduct?.name || '');
    setDescription(editingProduct?.description || '');
    setSku(editingProduct?.sku || '');
    setBasePrice(editingProduct?.price?.toString() || '');
    setBaseCost(editingProduct?.baseCost?.toString() || '');
    setHasVariants(editingProduct?.hasVariants ?? false);
    setStock(editingProduct?.stock?.toString() || '');
    setSelectedCategory(editingProduct?.category ? (typeof editingProduct.category === 'string' ? editingProduct.category : editingProduct.category._id) : '');
    setIsDigital(editingProduct?.isDigital ?? false);
    setDownloadUrl(editingProduct?.digitalDetails?.downloadUrl || '');
    setFileSize(editingProduct?.digitalDetails?.fileSize || '');
    setFileType(editingProduct?.digitalDetails?.fileType || '');
    setImages(editingProduct?.images || []);
    setIsActive(editingProduct?.isActive ?? true);
    setVariantOptions(
      editingProduct?.variantOptions?.map(opt => ({ name: opt.name, values: opt.values.map(String) })) || []
    );

    // Cargar categorías
    setLoading(true);
    getCategories()
      .then(data => { setAllCategories(data); setError(null); })
      .catch(err => { setError(err.response?.data?.message || 'Error al cargar categorías'); setAllCategories([]); })
      .finally(() => setLoading(false));

    // Cargar variantes si aplica
    if (editingProduct?._id && editingProduct.hasVariants) {
      setLoadingVariants(true);
      getProductVariants(editingProduct._id)
        .then(data => { setCurrentVariants(data); setVariantError(null); })
        .catch(err => { setVariantError(err.response?.data?.message || 'Error al cargar variantes'); setCurrentVariants([]); })
        .finally(() => setLoadingVariants(false));
    } else {
      setCurrentVariants([]);
    }

  }, [isOpen, editingProduct]);

  /** IMÁGENES */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newImages = [...images];
    newImages[index] = e.target.value;
    setImages(newImages);
  };
  const handleAddImage = () => setImages([...images, '']);
  const handleRemoveImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  /** VARIANT OPTIONS */
  const handleVariantOptionNameChange = (value: string, index: number) => {
    const newOptions = [...variantOptions];
    newOptions[index].name = value;
    setVariantOptions(newOptions);
  };
  const handleVariantOptionValuesChange = (value: string, index: number) => {
    const newOptions = [...variantOptions];
    newOptions[index].values = value.split(',').map(v => v.trim()).filter(v => v !== '');
    setVariantOptions(newOptions);
  };
  const handleAddVariantOption = () => setVariantOptions([...variantOptions, { name: '', values: [] }]);
  const handleRemoveVariantOption = (index: number) => setVariantOptions(variantOptions.filter((_, i) => i !== index));

  /** VARIANTES EXISTENTES */
  const handleUpdateVariant = async (variantId: string, updatedFields: Partial<ProductVariant>) => {
    if (!editingProduct?._id) return;
    setLoading(true);
    try {
      const updatedVariant = await updateProductVariant(editingProduct._id, variantId, updatedFields);
      setCurrentVariants(prev => prev.map(v => v._id === updatedVariant._id ? updatedVariant : v));
      setError(null);
    } catch (err: any) {
      console.error('Error al actualizar variante:', err);
      setError(err.response?.data?.message || 'Error al actualizar la variante');
    } finally { setLoading(false); }
  };
  const handleDeleteVariant = async (variantId: string) => {
    if (!editingProduct?._id || !window.confirm('¿Estás seguro de eliminar esta variante?')) return;
    setLoading(true);
    try {
      await deleteProductVariant(editingProduct._id, variantId);
      setCurrentVariants(prev => prev.filter(v => v._id !== variantId));
      setError(null);
    } catch (err: any) {
      console.error('Error al eliminar variante:', err);
      setError(err.response?.data?.message || 'Error al eliminar la variante');
    } finally { setLoading(false); }
  };

  /** SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    // Convertir price y baseCost a enteros
    const parsedPrice = basePrice !== '' ? Math.round(parseFloat(basePrice)) : 0;
    const parsedCost  = baseCost !== '' ? Math.round(parseFloat(baseCost)) : 0;
  
    // Construir objeto de producto
    const productData: Partial<Product> = {
      name,
      description,
      sku,
      price: parsedPrice,
      baseCost: parsedCost,
      hasVariants,
      category: selectedCategory,
      isDigital,
      images: images.filter(img => img !== ''),
      isActive,
    };
  
    // Datos de producto digital
    if (isDigital) {
      productData.digitalDetails = {
        downloadUrl: downloadUrl.trim(),
        fileSize: fileSize.trim() || undefined,
        fileType: fileType.trim() || undefined,
      };
    }
  
    // Stock o variantes
    if (hasVariants && variantOptions.length > 0) {
      productData.variantOptions = variantOptions.map(opt => ({
        name: opt.name.trim(),
        values: opt.values.map(v => v.trim()).filter(v => v !== '')
      }));
    } else if (!hasVariants) {
      productData.stock = stock !== '' && !isNaN(parseInt(stock)) ? parseInt(stock) : 0;
    }
  
    console.log('Producto a crear/actualizar:', productData);
  
    try {
      let savedProduct: Product;
  
      if (editingProduct && editingProduct._id) {
        savedProduct = await updateProduct(editingProduct._id, productData);
      } else {
        savedProduct = await createProduct(productData);
      }
  
      console.log('Producto guardado:', savedProduct);
      onSave(savedProduct);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar producto:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };
  
  

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 border border-smartops-gray rounded-lg bg-smartops-white shadow-md">
      {error && <div className="text-red-500 text-sm font-montserrat">{error}</div>}

      {/* INFORMACIÓN BÁSICA */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-smartops-dark font-montserrat">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label htmlFor="name">Nombre</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div><Label htmlFor="sku">SKU</Label><Input id="sku" value={sku} onChange={e => setSku(e.target.value)} required /></div>
          <div><Label htmlFor="basePrice">Precio de Venta</Label><Input id="basePrice" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} required step="0.01" /></div>
          <div><Label htmlFor="baseCost">Costo del Producto</Label><Input id="baseCost" type="number" value={baseCost} onChange={e => setBaseCost(e.target.value)} step="0.01" /></div>
        </div>
        <div><Label htmlFor="description">Descripción</Label><Input id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
        <div className="relative z-50">
          <Label htmlFor="category">Categoría</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
            <SelectContent className="z-[9999] max-h-60 overflow-auto bg-white border rounded-md">
              {loading && <SelectItem value="loading-placeholder" disabled>Cargando...</SelectItem>}
              {allCategories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* CONFIGURACIÓN ADICIONAL */}
      <section className="space-y-4 border-t pt-6 border-smartops-gray-light">
        <h3 className="text-lg font-semibold">Configuración Adicional</h3>
        <div className="flex flex-wrap gap-6">
          <Switch id="hasVariants" checked={hasVariants} onCheckedChange={setHasVariants} /><Label htmlFor="hasVariants">Tiene Variantes</Label>
          <Switch id="isDigital" checked={isDigital} onCheckedChange={setIsDigital} /><Label htmlFor="isDigital">Es Digital</Label>
          <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} /><Label htmlFor="isActive">Activo</Label>
        </div>
        {!hasVariants && <div><Label htmlFor="stock">Stock / Cantidad MAX.</Label><Input id="stock" type="number" value={stock} onChange={e => setStock(e.target.value)} /></div>}
      </section>

      {/* VARIANTES */}
      {hasVariants && (
        <section className="space-y-6 border-t pt-6 border-smartops-gray-light">
          <h3 className="text-lg font-semibold">{editingProduct ? 'Gestión de Variantes' : 'Configuración de Variantes'}</h3>
          <div className="space-y-4 border rounded-md p-4 bg-gray-50">
            {variantOptions.map((option, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-2 md:items-center p-2 border rounded-md bg-white">
                <Input value={option.name} onChange={e => handleVariantOptionNameChange(e.target.value, i)} placeholder="Nombre de Opción" />
                <Input value={option.values.join(',')} onChange={e => handleVariantOptionValuesChange(e.target.value, i)} placeholder="Valores separados por coma" />
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVariantOption(i)}><X /></Button>
              </div>
            ))}
            <Button type="button" onClick={handleAddVariantOption} variant="smartopsOutline"><Plus /> Añadir Opción</Button>
          </div>
        </section>
      )}

      {/* PRODUCTO DIGITAL */}
      {isDigital && (
        <section className="space-y-4 border-t pt-6 border-smartops-gray-light">
          <h3 className="text-lg font-semibold">Detalles de Producto Digital</h3>
          <Input type="url" value={downloadUrl} onChange={e=>setDownloadUrl(e.target.value)} placeholder="URL de Descarga" required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={fileSize} onChange={e=>setFileSize(e.target.value)} placeholder="Tamaño del Archivo"/>
            <Input value={fileType} onChange={e=>setFileType(e.target.value)} placeholder="Tipo de Archivo"/>
          </div>
        </section>
      )}

      {/* IMÁGENES */}
      <section className="space-y-4 border-t pt-6 border-smartops-gray-light">
        <h3 className="text-lg font-semibold">Imágenes del Producto</h3>
        {images.map((img, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input type="url" value={img} onChange={e=>handleImageChange(e,i)} placeholder="URL de la imagen" />
            <Button type="button" variant="ghost" size="icon" onClick={()=>handleRemoveImage(i)}><X /></Button>
          </div>
        ))}
        <Button type="button" onClick={handleAddImage} variant="smartopsGradient"><ImageIcon /> Añadir Imagen</Button>
      </section>

      <div className="flex justify-end gap-2 pt-6 border-t border-smartops-gray-light">
        <Button type="button" variant="smartopsOutline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="smartops" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Producto'}</Button>
      </div>
    </form>
  );
}
