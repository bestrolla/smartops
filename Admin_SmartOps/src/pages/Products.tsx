import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Plus, Search, Layers, Edit, Trash2, Eye } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getProducts, deleteProduct, Product as ProductType } from '@/lib/productApi';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { ProductForm } from '@/components/forms/ProductForm';
import { SimpleProductForm } from '@/components/forms/SimpleProductForm';
import { VariantForm } from '@/components/forms/VariantForm';
import { Category } from '@/lib/categoryApi';

export default function Products() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [useSimpleForm, setUseSimpleForm] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Hooks para modal de ver producto
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<ProductType | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null); // Imagen principal del modal

  useEffect(() => { 
    fetchProducts(); 
  }, [pagination.page, selectedStatus, selectedType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) fetchProducts();
      else setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters: any = { 
        includeVariants: true, 
        page: pagination.page, 
        limit: pagination.limit,
        filter: {} // Objeto para filtros del backend
      };
      
      // Aplicar filtros de estado
      if (selectedStatus === 'active') {
        filters.filter.isActive = true;
      } else if (selectedStatus === 'inactive') {
        filters.filter.isActive = false;
      }
      
      // Aplicar filtros de tipo
      if (selectedType === 'variants') {
        filters.filter.hasVariants = true;
      } else if (selectedType === 'simple') {
        filters.filter.hasVariants = false;
      }

      console.log('Filtros aplicados:', filters);
      let response: any = await getProducts(filters);
      let filteredProducts = Array.isArray(response) ? response : [];
      
      // Aplicar filtro de búsqueda por texto en el frontend
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setProducts(filteredProducts);
      setError(null);

      const total = typeof response.total === 'number' ? response.total : filteredProducts.length;
      setPagination(prev => ({ ...prev, total, pages: Math.ceil(total / pagination.limit) }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar productos');
      setProducts([]);
    } finally { setLoading(false); }
  };

  // --- Función para abrir modal de ver producto ---
  const handleViewProduct = (id: string) => {
    const product = products.find(p => p._id === id || p.id === id);
    if (product) {
      console.log("Producto seleccionado:", product); // 👈 revisar aquí
      setViewProduct(product);
      setMainImage(product.images?.[0] || null);
      setIsViewModalOpen(true);
    } else {
      toast.error('Producto no encontrado');
    }
  };
  
  const handleSaveCategory = (savedCategory: Category) => {
    toast.success(`Categoría "${savedCategory.name}" guardada`);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveProduct = (savedProduct: ProductType) => {
    toast.success(`Producto "${savedProduct.name}" guardado`);
    fetchProducts();
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este producto?')) {
      try {
        await deleteProduct(id);
        fetchProducts();
        toast.success('Producto eliminado correctamente');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al eliminar el producto');
        toast.error('Error al eliminar el producto');
      }
    }
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Layers className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold font-montserrat">Gestión de Productos</h1>
              <p className="text-blue-100 font-montserrat">Administra tu catálogo y variantes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsProductModalOpen(true)} className="bg-white text-smartops-blue hover:bg-blue-50 font-montserrat shadow-md">
              <Plus className="w-4 h-4 mr-2" /> {useSimpleForm ? 'Nuevo Simple' : 'Nuevo Avanzado'}
            </Button>
            <Button onClick={() => setIsVariantModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-montserrat shadow-md">
              <Layers className="w-4 h-4 mr-2" /> Nueva Variante
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-smartops-white border-smartops-gray shadow-md">
          <CardHeader>
            <CardTitle className="font-montserrat text-smartops-dark">Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="font-montserrat">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
                  <Input placeholder="Nombre o SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 font-montserrat" />
                </div>
              </div>
              <div>
                <Label className="font-montserrat">Estado</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="font-montserrat"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-montserrat">Tipo</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="font-montserrat"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="variants">Con Variantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-montserrat">Modo Formulario</Label>
                <div className="flex items-center space-x-2">
                  <Switch checked={useSimpleForm} onCheckedChange={setUseSimpleForm} />
                  <span className="text-sm">{useSimpleForm ? 'Simplificado' : 'Avanzado'}</span>
                </div>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedStatus('all'); setSelectedType('all'); setPagination(prev => ({ ...prev, page: 1 })); }} className="w-full mt-2 font-montserrat">
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card className="bg-smartops-white border-smartops-gray shadow-md">
          <CardHeader>
            <CardTitle className="font-montserrat">
              Productos {pagination.total > 0 && (<span className="text-sm text-gray-500 ml-2">({pagination.total} encontrados)</span>)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6">Cargando...</div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">{error}</div>
            ) : products.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No hay productos</div>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Nombre</TableHeaderCell>
                      <TableHeaderCell>Precio de Venta</TableHeaderCell>
                      <TableHeaderCell>Categoría</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell className="text-center">Acciones</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p._id || p.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium text-gray-700">{p.name}</TableCell>
                        <TableCell className="text-gray-900">${p.price?.toFixed(2) ?? '-'}</TableCell>
                        <TableCell>
                          {p.category && (
                            <Badge variant="outline" className="text-sm">
                              {typeof p.category === 'object' ? p.category.name : p.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              p.isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {p.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {/* Botón Ver */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-2 border-gray-400 text-gray-600 hover:bg-gray-100"
                              onClick={() => handleViewProduct(p._id || p.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {/* Botón Editar */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-2 border-blue-500 text-blue-500 hover:bg-blue-50"
                              onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {/* Botón Eliminar */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-2 border-red-500 text-red-500 hover:bg-red-50"
                              onClick={() => handleDeleteProduct(p._id || p.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500">
                      Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>Anterior</Button>
                      <Button size="sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>Siguiente</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal Ver Producto Mejorado */}
{/* Modal Ver Producto */}
<Modal
  isOpen={isViewModalOpen}
  onClose={() => setIsViewModalOpen(false)}
  title={viewProduct?.name || 'Producto'}
  size="lg"
>
  {viewProduct && (
    <div className="space-y-6 px-6 py-4">

      {/* Imagen principal y miniaturas */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="flex flex-col items-center md:items-start">
          <img
            src={viewProduct.images?.[0] || 'https://via.placeholder.com/300'}
            alt={viewProduct.name}
            className="w-64 h-64 object-cover rounded-xl shadow-lg border border-gray-200 transition-transform duration-300 hover:scale-105"
          />
          {viewProduct.images && viewProduct.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {viewProduct.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${viewProduct.name} ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded-md cursor-pointer border border-gray-300 hover:ring-2 hover:ring-blue-500"
                  onClick={(e: any) => {
                    const mainImg = e.target.src;
                    const mainImageEl = e.target.closest('div')!.previousElementSibling as HTMLImageElement;
                    if (mainImageEl) mainImageEl.src = mainImg;
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-gray-500 font-semibold uppercase text-sm">Nombre:</div>
            <div className="text-gray-900 font-medium text-lg">{viewProduct.name}</div>

            <div className="text-gray-500 font-semibold uppercase text-sm">SKU:</div>
            <div className="text-gray-900">{viewProduct.sku ?? '-'}</div>

            <div className="text-gray-500 font-semibold uppercase text-sm">Costo del Producto:</div>
            <div className="text-gray-900 font-medium">${viewProduct.baseCost?.toFixed(2) ?? '0.00'}</div>


            <div className="text-gray-500 font-semibold uppercase text-sm">Precio de Venta:</div>
            <div className="text-green-600 font-bold text-xl">${viewProduct.price?.toFixed(2) ?? '-'}</div>
          </div>

          <div className="space-y-2">
            <div className="text-gray-500 font-semibold uppercase text-sm">Categoría:</div>
            <div>
              {viewProduct.category ? (
                <Badge variant="outline">{typeof viewProduct.category === 'object' ? viewProduct.category.name : viewProduct.category}</Badge>
              ) : '-'}
            </div>

            <div className="text-gray-500 font-semibold uppercase text-sm">Estado:</div>
            <div>
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${
      viewProduct.isActive
        ? "bg-green-100 text-green-600"
        : "bg-red-100 text-red-600"
    }`}
  >
    {viewProduct.isActive ? "Activo" : "Inactivo"}
  </span>
</div>


            {/* Variantes */}
            {viewProduct.variants && viewProduct.variants.length > 0 && (
              <>
                <div className="text-gray-500 font-semibold uppercase text-sm">Variantes:</div>
                <div className="flex flex-wrap gap-2">
                  {viewProduct.variants.map((v: any, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {typeof v === "object" 
                        ? `${v.name ?? 'Sin nombre'} - $${v.price?.toFixed(2) ?? '-'}`
                        : v
                      }
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {viewProduct.weight && (
              <>
                <div className="text-gray-500 font-semibold uppercase text-sm">Peso</div>
                <div>{viewProduct.weight} kg</div>
              </>
            )}

            {viewProduct.dimensions && (
              <>
                <div className="text-gray-500 font-semibold uppercase text-sm">Dimensiones (LxAxH)</div>
                <div>
                  {viewProduct.dimensions.length ?? '-'} x {viewProduct.dimensions.width ?? '-'} x {viewProduct.dimensions.height ?? '-'} cm
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Descripción */}
      {viewProduct.description && (
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-gray-700 font-semibold mb-2">Descripción:</h3>
          <p className="text-gray-600">{viewProduct.description}</p>
        </div>
      )}

    </div>
  )}
</Modal>


        {/* Modales existentes */}
        <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} size="xl">
          {useSimpleForm ? (
            <SimpleProductForm isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} editingProduct={editingProduct} />
          ) : (
            <ProductForm isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} editingProduct={editingProduct} />
          )}
        </Modal>

        <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'} size="md">
          <CategoryForm isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSave={handleSaveCategory} editingCategory={editingCategory} />
        </Modal>

        <Modal isOpen={isVariantModalOpen} onClose={() => setIsVariantModalOpen(false)} title="Nueva Variante" size="md">
          <VariantForm isOpen={isVariantModalOpen} onClose={() => setIsVariantModalOpen(false)} onSave={() => { setIsVariantModalOpen(false); fetchProducts(); }} />
        </Modal>

      </div>
    </div>
  );
}
