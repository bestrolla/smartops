import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Modal } from '../ui/modal';
import { CustomerForm } from '../forms/CustomerForm';
import { Customer, getCustomers, deleteCustomer } from '../../lib/crmApi';

const statusColors = {
  lead: 'bg-blue-600 text-blue-100',
  prospect: 'bg-yellow-600 text-yellow-100',
  customer: 'bg-green-600 text-green-100',
  inactive: 'bg-gray-600 text-gray-100'
};

const statusLabels = {
  lead: 'Lead',
  prospect: 'Prospecto',
  customer: 'Cliente',
  inactive: 'Inactivo'
};

const statusIcons = {
  lead: Clock,
  prospect: Users,
  customer: UserCheck,
  inactive: UserX
};

export function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadCustomers();
  }, [pagination.page, selectedStatus]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadCustomers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (selectedStatus && selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      const response = await getCustomers(filters);
      
      // Filtrar por término de búsqueda en el frontend
      let filteredCustomers = response.customers;
      if (searchTerm) {
        filteredCustomers = response.customers.filter(customer =>
          customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setCustomers(filteredCustomers);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        pages: response.pages
      }));
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el cliente "${customer.firstName} ${customer.lastName}"?`)) {
      try {
        await deleteCustomer(customer._id);
        loadCustomers();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const handleCustomerSaved = () => {
    loadCustomers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-montserrat text-smartops-dark">Gestión de Clientes</h2>
          <p className="text-smartops-dark/60 font-montserrat">Administra tu base de clientes y prospectos</p>
        </div>
        <Button 
          variant="smartopsGradient" 
          onClick={handleAddCustomer}
          className="font-montserrat hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cliente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-smartops-white border-smartops-gray shadow-md">
        <CardHeader>
          <CardTitle className="font-montserrat text-smartops-dark">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-smartops-dark font-montserrat">Buscar cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
                <Input
                  placeholder="Nombre, email o empresa..."
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
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Todos los estados
                  </SelectItem>
                  <SelectItem value="lead" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Leads
                  </SelectItem>
                  <SelectItem value="prospect" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Prospectos
                  </SelectItem>
                  <SelectItem value="customer" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Clientes
                  </SelectItem>
                  <SelectItem value="inactive" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Inactivos
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

      {/* Lista de Clientes */}
      <Card className="bg-smartops-white border-smartops-gray shadow-md">
        <CardHeader>
          <CardTitle className="font-montserrat text-smartops-dark">
            Lista de Clientes
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
              <div className="text-smartops-dark/60 font-montserrat">Cargando clientes...</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-smartops-dark/30 mx-auto mb-4" />
              <p className="text-smartops-dark/60 font-montserrat">No se encontraron clientes</p>
              <Button 
                variant="smartopsGradient" 
                onClick={handleAddCustomer}
                className="mt-4 font-montserrat"
              >
                Agregar primer cliente
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Cliente</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Email</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Teléfono</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Empresa</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Estado</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Fecha Registro</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Acciones</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => {
                    const StatusIcon = statusIcons[customer.status];
                    return (
                      <TableRow key={customer._id} className="hover:bg-smartops-gray/20 transition-colors">
                        <TableCell className="font-montserrat text-smartops-dark font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-smartops-blue to-smartops-purple rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">{customer.email}</TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">{customer.phone || 'N/A'}</TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">{customer.company || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[customer.status]} font-montserrat`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusLabels[customer.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                              className="text-smartops-dark hover:bg-green-500 hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer)}
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
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
        className="max-w-2xl"
      >
        <CustomerForm
          customer={editingCustomer || undefined}
          onSuccess={() => {
            handleCustomerSaved();
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
        />
      </Modal>
    </div>
  );
} 