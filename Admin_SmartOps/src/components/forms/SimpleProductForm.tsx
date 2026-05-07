import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Category, getCategories } from '@/lib/categoryApi';
import { Product, createProduct, updateProduct } from '@/lib/productApi';
import { X, Plus, ImageIcon, Package, Layers, DollarSign, AlertCircle } from 'lucide-react';

interface SimpleProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
}

interface VariantAttribute {
  name: string;
  values: string[];
}

interface ProductVariant {
  id?: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export function SimpleProductForm({ isOpen, onClose, onSave, editingProduct }: SimpleProductFormProps) {
  // Campos básicos del producto
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('new');
  const [images, setImages] = useState<string[]>(['']);
  const [isActive, setIsActive] = useState(true);

  // Control de variantes
  const [hasVariants, setHasVariants] = useState(false);
  
  // Para productos simples
  const [simplePrice, setSimplePrice] = useState('');
  const [simpleBaseCost, setSimpleBaseCost] = useState('');
  const [simpleStock, setSimpleStock] = useState('');

  // Para productos con variantes
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<ProductVariant[]>([]);

  // Estados del formulario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset o cargar datos si es edición
      if (editingProduct) {
        setName(editingProduct.name || '');
        setDescription(editingProduct.description || '');
        setSku(editingProduct.sku || '');
        setCategory(editingProduct.category ? (typeof editingProduct.category === 'string' ? editingProduct.category : editingProduct.category._id) : '');
        setBrand(editingProduct.brand || '');
        setCondition(editingProduct.condition || 'new');
        setImages(editingProduct.images?.length ? editingProduct.images : ['']);
        setIsActive(editingProduct.isActive ?? true);
        setHasVariants(editingProduct.hasVariants ?? false);
        
        if (!editingProduct.hasVariants) {
          setSimplePrice(editingProduct.price?.toString() || '');
          setSimpleBaseCost(editingProduct.baseCost?.toString() || '');
          setSimpleStock(editingProduct.stock?.toString() || '');
        } else {
          setVariantAttributes(editingProduct.variantAttributes || []);
        }
      } else {
        // Reset para nuevo producto
        setName('');
        setDescription('');
        setSku('');
        setCategory('');
        setBrand('');
        setCondition('new');
        setImages(['']);
        setIsActive(true);
        setHasVariants(false);
        setSimplePrice('');
        setSimpleBaseCost('');
        setSimpleStock('');
        setVariantAttributes([]);
        setGeneratedVariants([]);
      }

      // Cargar categorías
      getCategories()
        .then(setAllCategories)
        .catch(() => setError('Error al cargar categorías'));
    }
  }, [isOpen, editingProduct]);

  // Generar variantes automáticamente cuando cambian los atributos
  useEffect(() => {
    if (hasVariants && variantAttributes.length > 0) {
      generateVariants();
    } else {
      setGeneratedVariants([]);
    }
  }, [hasVariants, variantAttributes]);

  const generateVariants = () => {
    if (!variantAttributes.length) return;

    const combinations: Record<string, string>[] = [];
    
    function generateCombinations(index: number, current: Record<string, string>) {
      if (index === variantAttributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attribute = variantAttributes[index];
      for (const value of attribute.values) {
        current[attribute.name] = value;
        generateCombinations(index + 1, current);
      }
    }

    generateCombinations(0, {});

    const variants: ProductVariant[] = combinations.map((attributes, index) => {
      const variantSku = generateVariantSku(sku, attributes);
      const existingVariant = generatedVariants.find(v => 
        JSON.stringify(v.attributes) === JSON.stringify(attributes)
      );

      return {
        id: existingVariant?.id || `variant-${index}`,
        attributes,
        sku: variantSku,
        price: existingVariant?.price || parseFloat(simplePrice) || 0,
        stock: existingVariant?.stock || parseInt(simpleStock) || 0,
        isActive: existingVariant?.isActive ?? true
      };
    });

    setGeneratedVariants(variants);
  };

  const generateVariantSku = (baseSku: string, attributes: Record<string, string>) => {
    const attributeValues = Object.values(attributes)
      .map(value => value.substring(0, 3).toUpperCase())
      .join('-');
    return `${baseSku}-${attributeValues}`;
  };

  const handleAddAttribute = () => {
    setVariantAttributes([...variantAttributes, { name: '', values: [] }]);
  };

  const handleAttributeNameChange = (index: number, name: string) => {
    const newAttributes = [...variantAttributes];
    newAttributes[index].name = name;
    setVariantAttributes(newAttributes);
  };

  const handleAttributeValuesChange = (index: number, valuesText: string) => {
    const newAttributes = [...variantAttributes];
    newAttributes[index].values = valuesText
      .split(',')
      .map(v => v.trim())
      .filter(v => v !== '');
    setVariantAttributes(newAttributes);
  };

  const handleRemoveAttribute = (index: number) => {
    setVariantAttributes(variantAttributes.filter((_, i) => i !== index));
  };

  const handleVariantChange = (variantIndex: number, field: string, value: any) => {
    const newVariants = [...generatedVariants];
    newVariants[variantIndex] = { ...newVariants[variantIndex], [field]: value };
    setGeneratedVariants(newVariants);
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleAddImage = () => {
    setImages([...images, '']);
  };

  const handleRemoveImage = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productData: any = {
        name: name.trim(),
        description: description.trim(),
        sku: sku.trim(),
        category,
        brand: brand.trim() || undefined,
        condition,
        images: images.filter(img => img.trim() !== ''),
        isActive,
        hasVariants
      };

      if (!hasVariants) {
        // Producto simple
        productData.price = parseFloat(simplePrice);
        productData.baseCost = parseFloat(simpleBaseCost) || 0;
        productData.stock = parseInt(simpleStock) || 0;
      } else {
        // Producto con variantes
        productData.variantAttributes = variantAttributes.filter(attr => 
          attr.name.trim() !== '' && attr.values.length > 0
        );
        productData.variants = generatedVariants.filter(variant => variant.isActive);
      }

      let savedProduct: Product;
      if (editingProduct) {
        savedProduct = await updateProduct(editingProduct._id || editingProduct.id, productData);
      } else {
        savedProduct = await createProduct(productData);
      }

      onSave(savedProduct);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  // No renderizar nada si no está abierto
  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Nombre del producto *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: iPhone 15 Pro Max"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sku" className="text-sm font-medium">SKU *</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ej: IPHONE15PM"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe tu producto..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative z-50">
                <Label htmlFor="category" className="text-sm font-medium">Categoría *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent 
                    className="z-[9999] max-h-60 overflow-auto bg-white shadow-lg rounded-md border" 
                    position="popper"
                    style={{ zIndex: 9999 }}
                  >
                    {allCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand" className="text-sm font-medium">Marca</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ej: Apple"
                  className="mt-1"
                />
              </div>
              <div className="relative z-50">
                <Label htmlFor="condition" className="text-sm font-medium">Condición</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent 
                    className="z-[9999] max-h-60 overflow-auto bg-white shadow-lg rounded-md border" 
                    position="popper"
                    style={{ zIndex: 9999 }}
                  >
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="used">Usado</SelectItem>
                    <SelectItem value="refurbished">Reacondicionado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipo de Producto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="w-5 h-5" />
              Tipo de Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Switch
                id="hasVariants"
                checked={hasVariants}
                onCheckedChange={setHasVariants}
              />
              <Label htmlFor="hasVariants" className="font-medium">
                Mi producto tiene variantes (color, talla, etc.)
              </Label>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {hasVariants 
                ? "Podrás definir diferentes precios y stock para cada variante"
                : "Tendrá un solo precio y stock"
              }
            </p>
          </CardContent>
        </Card>

        {/* Precio y Stock (Solo para productos simples) */}
        {!hasVariants && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Precio, Costo y Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">Precio de venta *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={simplePrice}
                    onChange={(e) => setSimplePrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="baseCost" className="text-sm font-medium">Costo del producto</Label>
                  <Input
                    id="baseCost"
                    type="number"
                    value={simpleBaseCost}
                    onChange={(e) => setSimpleBaseCost(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="stock" className="text-sm font-medium">Stock / Cantidad MAX.</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={simpleStock}
                    onChange={(e) => setSimpleStock(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Variantes */}
        {hasVariants && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5" />
                Configuración de Variantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Atributos de Variantes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Atributos (Color, Talla, etc.)</Label>
                {variantAttributes.map((attribute, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <Input
                        placeholder="Nombre (ej: Color)"
                        value={attribute.name}
                        onChange={(e) => handleAttributeNameChange(index, e.target.value)}
                        className="mb-2"
                      />
                      <Input
                        placeholder="Valores separados por coma (ej: Rojo, Azul, Verde)"
                        value={attribute.values.join(', ')}
                        onChange={(e) => handleAttributeValuesChange(index, e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttribute(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAttribute}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Atributo
                </Button>
              </div>

              {/* Variantes Generadas */}
              {generatedVariants.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Variantes Generadas ({generatedVariants.length})
                  </Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {generatedVariants.map((variant, index) => (
                      <div key={variant.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded bg-white">
                        <div className="col-span-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variant.attributes).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                            className="text-xs"
                            placeholder="SKU"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="text-xs"
                            placeholder="Precio"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                            className="text-xs"
                            placeholder="Stock"
                            min="0"
                          />
                        </div>
                        <div className="col-span-1">
                          <Switch
                            checked={variant.isActive}
                            onCheckedChange={(checked) => handleVariantChange(index, 'isActive', checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="w-5 h-5" />
              Imágenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  type="url"
                  value={image}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder="URL de la imagen"
                  className="flex-1"
                />
                {images.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddImage}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Imagen
            </Button>
          </CardContent>
        </Card>

        {/* Estado */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="font-medium">
                Producto activo
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Crear Producto')}
          </Button>
        </div>
      </form>
  );
}
