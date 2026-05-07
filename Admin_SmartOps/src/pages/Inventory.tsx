import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Plus, Search, Edit, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  InventoryItem as InventoryItemType,
  getInventory,
} from '@/lib/inventoryApi';
import { InventoryForm } from '@/components/forms/InventoryForm';
import * as productApi from '@/lib/productApi';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemType | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockLevel, setSelectedStockLevel] = useState('all'); // all, low, normal, high
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchInventory();
  }, [pagination.page, selectedStockLevel]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Instead of fetching inventory, fetch all active products
      const allActiveProducts = await productApi.getProducts({ 
        includeVariants: true, 
        filter: { isActive: true } 
      });

      // Create inventory items for all active products
      let inventoryItems: InventoryItemType[] = allActiveProducts.map(product => {
        if (product.hasVariants && product.variants) {
          // For products with variants, create inventory items for each variant
          return product.variants
            .filter(variant => variant.isActive)
            .map(variant => ({
              _id: `temp_${variant._id}`,
              product_id: {
                _id: variant._id,
                name: `${product.name} - ${Object.entries(variant.optionValues || {}).map(([optName, optValue]) => `${optName}: ${optValue}`).join(', ')}`,
                sku: variant.sku,
                price: variant.price,
                hasVariants: false,
                isActive: variant.isActive
              },
              current_stock: variant.stock || 0,
              reserved_stock: 0,
              low_stock_threshold: 50,
              last_updated: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));
        } else {
          // For simple products, create a single inventory item
          return [{
            _id: `temp_${product._id}`,
            product_id: {
              _id: product._id || product.id,
              name: product.name,
              sku: product.sku,
              price: product.price,
              hasVariants: false,
              isActive: product.isActive
            },
            current_stock: product.stock || 0,
            reserved_stock: 0,
            low_stock_threshold: 50,
            last_updated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }];
        }
      }).flat();

      // Apply search filter
      let filteredInventory = inventoryItems;
      if (searchTerm) {
        filteredInventory = inventoryItems.filter(item => 
          item.product_id.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product_id.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply stock level filter
      if (selectedStockLevel !== 'all') {
        filteredInventory = filteredInventory.filter((item: InventoryItemType) => {
          const stockLevel = getStockLevel(item);
          return stockLevel === selectedStockLevel;
        });
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

      setInventory(paginatedInventory);
      setPagination(prev => ({
        ...prev,
        total: filteredInventory.length,
        pages: Math.ceil(filteredInventory.length / pagination.limit)
      }));
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar inventario');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStockClick = (item?: InventoryItemType) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleSaveInventory = (savedItem: InventoryItemType) => {
    console.log('Inventario guardado:', savedItem);
    fetchInventory();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockLevel = (item: InventoryItemType) => {
    if (item.current_stock <= item.low_stock_threshold) return 'low';
    if (item.current_stock <= item.low_stock_threshold * 2) return 'normal';
    return 'high';
  };

  const getStockBadge = (item: InventoryItemType) => {
    const level = getStockLevel(item);
    
    if (level === 'low') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 font-medium">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Bajo Stock
        </Badge>
      );
    } else if (level === 'normal') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-medium">
          <Clock className="w-3 h-3 mr-1" />
          Stock Normal
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 font-medium">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Stock Alto
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Inventario</h1>
                <p className="text-blue-100 text-sm sm:text-base">Controla el stock de tus productos y variantes</p>
              </div>
            </div>
            <Button 
              onClick={() => handleAdjustStockClick()}
              className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Gestionar Stock
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Buscar producto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Nivel de Stock</Label>
                <Select 
                  value={selectedStockLevel} 
                  onValueChange={setSelectedStockLevel}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500">
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">
                      Todos los niveles
                    </SelectItem>
                    <SelectItem value="low" className="text-gray-900 hover:bg-red-50">
                      Bajo Stock
                    </SelectItem>
                    <SelectItem value="normal" className="text-gray-900 hover:bg-yellow-50">
                      Stock Normal
                    </SelectItem>
                    <SelectItem value="high" className="text-gray-900 hover:bg-green-50">
                      Stock Alto
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end sm:col-span-2 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStockLevel('all');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inventario */}
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 flex items-center justify-between">
              <span className="text-lg font-semibold">Lista de Inventario</span>
              {pagination.total > 0 && (
                <Badge variant="outline" className="text-sm font-normal text-gray-600 border-gray-300">
                  {pagination.total} producto{pagination.total !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-gray-600">Cargando inventario...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar inventario</h3>
                <div className="text-red-600 text-center mb-8 max-w-md mx-auto">{error}</div>
                <Button 
                  variant="outline" 
                  onClick={fetchInventory}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 px-6 py-3 font-medium transition-all duration-200"
                >
                  Reintentar
                </Button>
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos en inventario</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Comienza agregando productos a tu inventario para gestionar el stock de manera eficiente.
                </p>
                <Button 
                  onClick={() => handleAdjustStockClick()}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Gestionar inventario
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <Table>
                    <TableHead>
                      <TableRow className="bg-gray-50">
                        <TableHeaderCell className="text-gray-700 font-semibold text-left py-3 px-4">Producto</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-left py-3 px-4">SKU</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-center py-3 px-4">Stock Actual</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-center py-3 px-4">Stock Reservado</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-center py-3 px-4">Umbral Bajo Stock</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-center py-3 px-4">Estado</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-left py-3 px-4">Última Actualización</TableHeaderCell>
                        <TableHeaderCell className="text-gray-700 font-semibold text-center py-3 px-4">Acciones</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventory.map((item) => (
                        <TableRow key={item._id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                          <TableCell className="text-gray-900 font-medium py-3 px-4">
                            <div className="max-w-xs truncate" title={item.product_id?.name || 'Producto sin nombre'}>
                              {item.product_id?.name || 'Producto sin nombre'}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 py-3 px-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {item.product_id?.sku || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell className="text-gray-900 font-semibold text-center py-3 px-4">
                            <span className="text-lg font-bold text-blue-600">{item.current_stock}</span>
                          </TableCell>
                          <TableCell className="text-gray-600 text-center py-3 px-4">
                            {item.reserved_stock || 0}
                          </TableCell>
                          <TableCell className="text-gray-600 text-center py-3 px-4">
                            {item.low_stock_threshold}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {getStockBadge(item)}
                          </TableCell>
                          <TableCell className="text-gray-600 text-sm py-3 px-4">
                            {formatDateTime(item.last_updated)}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAdjustStockClick(item)}
                                className="text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                title="Ajustar stock"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-4">
                    <div className="text-sm text-gray-600">
                      Mostrando página {pagination.page} de {pagination.pages} ({pagination.total} productos)
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de Formulario */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? 'Ajustar Stock' : 'Gestionar Stock'}
          size="lg"
        >
          <InventoryForm
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
            onSave={handleSaveInventory}
            editingItem={editingItem}
            existingInventoryItems={inventory}
          />
        </Modal>
      </div>
    </div>
  );
}