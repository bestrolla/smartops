import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Package, ShoppingCart, Clock, Truck, CheckCircle2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Order as OrderType,
  getOrders,
  deleteOrder,
} from '@/lib/ordersApi';
import { OrderForm } from '@/components/forms/OrderForm';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const statusColors = {
  draft: 'bg-gray-600 text-gray-100',
  pending: 'bg-yellow-600 text-yellow-100',
  processing: 'bg-blue-600 text-blue-100',
  completed: 'bg-green-600 text-green-100',
  cancelled: 'bg-red-600 text-red-100'
};

const statusLabels = {
  draft: 'Borrador',
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

const statusIcons = {
  draft: Clock,
  pending: Clock,
  processing: Package,
  completed: CheckCircle2,
  cancelled: X
};

export default function Orders() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderType | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderType['status'] | 'all'>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, selectedStatus]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchOrders();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (selectedStatus && selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      const response = await getOrders(filters);
      
      // Filtrar por término de búsqueda en el frontend
      let filteredOrders = response.orders || [];
      if (searchTerm) {
        filteredOrders = filteredOrders.filter((order: OrderType) =>
          order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order._id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setOrders(filteredOrders);
      setPagination(prev => ({
        ...prev,
        total: response.total || filteredOrders.length,
        pages: response.pages || Math.ceil(filteredOrders.length / pagination.limit)
      }));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar órdenes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrderClick = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrderClick = (order: OrderType) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = (savedOrder: OrderType) => {
    console.log('Orden guardada:', savedOrder);
    fetchOrders();
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
      try {
        await deleteOrder(id);
        fetchOrders();
        toast.success('Orden eliminada correctamente');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al eliminar la orden');
        toast.error('Error al eliminar la orden');
      }
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">Gestión de Órdenes</h1>
                <p className="text-blue-100 font-montserrat">Administra las órdenes de compra de tus clientes</p>
              </div>
            </div>
            <Button 
              onClick={handleAddOrderClick}
              className="bg-white text-smartops-blue hover:bg-green-500 hover:text-white font-montserrat shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Orden
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Search className="w-6 h-6" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat">Buscar orden</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
                  <Input
                    placeholder="Cliente, email o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat focus:border-smartops-blue"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat">Estado</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={(value) => setSelectedStatus(value as OrderType['status'] | 'all')}
                >
                  <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-smartops-white border-smartops-gray">
                    <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Todos los estados
                    </SelectItem>
                    <SelectItem value="draft" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Borradores
                    </SelectItem>
                    <SelectItem value="pending" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Pendientes
                    </SelectItem>
                    <SelectItem value="processing" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Procesando
                    </SelectItem>
                    <SelectItem value="completed" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Completados
                    </SelectItem>
                    <SelectItem value="cancelled" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Cancelados
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Órdenes */}
        <Card className="bg-smartops-white border-smartops-gray shadow-md">
          <CardHeader>
            <CardTitle className="font-montserrat text-smartops-dark">
              Lista de Órdenes
              {pagination.total > 0 && (
                <span className="text-sm font-normal text-smartops-dark/60 ml-2">
                  ({pagination.total} total{pagination.total !== 1 ? 'es' : ''})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-smartops-dark/60 font-montserrat">Cargando órdenes...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-8 text-red-500 font-montserrat">{error}</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-smartops-dark/30 mx-auto mb-4" />
                <p className="text-smartops-dark/60 font-montserrat">No se encontraron órdenes</p>
                <Button 
                  variant="smartopsGradient" 
                  onClick={handleAddOrderClick}
                  className="mt-4 font-montserrat"
                >
                  Agregar primera orden
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Número de Orden</TableHeaderCell>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Cliente</TableHeaderCell>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Total</TableHeaderCell>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Estado</TableHeaderCell>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Productos</TableHeaderCell>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Fecha</TableHeaderCell>
                      <TableHeaderCell className="font-montserrat text-smartops-dark">Acciones</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => {
                      // Validación robusta del status
                      const validStatus = order.status && typeof order.status === 'string' 
                        ? order.status as keyof typeof statusIcons 
                        : 'pending' as keyof typeof statusIcons;
                      
                      const StatusIcon = statusIcons[validStatus] || Clock;
                      const statusColor = statusColors[validStatus] || 'bg-gray-600 text-gray-100';
                      const statusLabel = statusLabels[validStatus] || validStatus;
                      
                      return (
                        <TableRow key={order._id} className="hover:bg-smartops-gray/20 transition-colors">
                          <TableCell className="font-montserrat text-smartops-dark font-medium">
                            {order.orderNumber || `#${order._id.substring(0, 8)}...`}
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark">
                            {order.customer || 'N/A'}
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark font-medium">
                            {formatCurrency(order.total || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColor} font-montserrat`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark/80">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-smartops-dark/60" />
                              {order.items?.length || 0} productos
                            </div>
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark/80">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-smartops-dark/60" />
                              {formatDateTime(order.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOrderClick(order)}
                                className="text-smartops-dark hover:bg-green-500 hover:text-white transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOrder(order._id)}
                                className="text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-smartops-gray">
                    <div className="text-sm text-smartops-dark/60 font-montserrat">
                      Página {pagination.page} de {pagination.pages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50"
                      >
                        Siguiente
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
          onClose={() => setIsModalOpen(false)}
          title={editingOrder ? 'Editar Orden' : 'Agregar Nueva Orden'}
          size="xl"
        >
          <OrderForm
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveOrder}
            editingOrder={editingOrder}
          />
        </Modal>
      </div>
    </div>
  );
} 