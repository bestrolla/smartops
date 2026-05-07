import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit, Trash2, TrendingUp, DollarSign, Clock, CheckCircle2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Modal } from '../ui/modal';
import { OpportunityForm } from '../forms/OpportunityForm';
import { Opportunity, getOpportunities, deleteOpportunity, Customer, getCustomers } from '../../lib/crmApi';

const stageColors = {
  new: 'bg-blue-600 text-blue-100',
  qualified: 'bg-yellow-600 text-yellow-100',
  proposition: 'bg-purple-600 text-purple-100',
  won: 'bg-green-600 text-green-100',
  lost: 'bg-red-600 text-red-100'
};

const stageLabels = {
  new: 'Nueva',
  qualified: 'Calificada',
  proposition: 'Propuesta',
  won: 'Ganada',
  lost: 'Perdida'
};

const stageIcons = {
  new: Clock,
  qualified: TrendingUp,
  proposition: Edit,
  won: CheckCircle2,
  lost: X
};

export function OpportunitiesTab() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
  }, [pagination.page, selectedStage, selectedCustomer]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadOpportunities();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (selectedStage && selectedStage !== 'all') {
        filters.stage = selectedStage;
      }

      if (selectedCustomer && selectedCustomer !== 'all') {
        filters.customerId = selectedCustomer;
      }

      const response = await getOpportunities(filters);
      
      // Filtrar por término de búsqueda en el frontend
      let filteredOpportunities = response.opportunities;
      if (searchTerm) {
        filteredOpportunities = response.opportunities.filter(opportunity =>
          opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opportunity.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setOpportunities(filteredOpportunities);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        pages: response.pages
      }));
    } catch (error) {
      console.error('Error al cargar oportunidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await getCustomers({ limit: 100 }); // Cargar más clientes para el filtro
      setCustomers(response.customers);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleAddOpportunity = () => {
    setEditingOpportunity(null);
    setIsFormOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setIsFormOpen(true);
  };

  const handleDeleteOpportunity = async (opportunity: Opportunity) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la oportunidad "${opportunity.name}"?`)) {
      try {
        await deleteOpportunity(opportunity._id);
        loadOpportunities();
      } catch (error) {
        console.error('Error al eliminar oportunidad:', error);
        alert('Error al eliminar la oportunidad');
      }
    }
  };

  const handleOpportunitySaved = () => {
    loadOpportunities();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCustomerName = (customerId: string | Customer) => {
    if (typeof customerId === 'string') {
      const customer = customers.find(c => c._id === customerId);
      return customer ? `${customer.firstName} ${customer.lastName}` : 'Cliente desconocido';
    } else {
      return `${customerId.firstName} ${customerId.lastName}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-montserrat text-smartops-dark">Gestión de Oportunidades</h2>
          <p className="text-smartops-dark/60 font-montserrat">Administra tus oportunidades de venta</p>
        </div>
        <Button 
          variant="smartopsGradient" 
          onClick={handleAddOpportunity}
          className="font-montserrat hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Oportunidad
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-smartops-white border-smartops-gray shadow-md">
        <CardHeader>
          <CardTitle className="font-montserrat text-smartops-dark">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-smartops-dark font-montserrat">Buscar oportunidad</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
                <Input
                  placeholder="Nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat focus:border-smartops-blue"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-smartops-dark font-montserrat">Etapa</Label>
              <Select 
                value={selectedStage} 
                onValueChange={setSelectedStage}
              >
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Todas las etapas" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Todas las etapas
                  </SelectItem>
                  <SelectItem value="new" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Nuevas
                  </SelectItem>
                  <SelectItem value="qualified" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Calificadas
                  </SelectItem>
                  <SelectItem value="proposition" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Propuestas
                  </SelectItem>
                  <SelectItem value="won" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Ganadas
                  </SelectItem>
                  <SelectItem value="lost" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Perdidas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-smartops-dark font-montserrat">Cliente</Label>
              <Select 
                value={selectedCustomer} 
                onValueChange={setSelectedCustomer}
              >
                <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent className="bg-smartops-white border-smartops-gray">
                  <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                    Todos los clientes
                  </SelectItem>
                  {customers.map((customer) => (
                    <SelectItem 
                      key={customer._id} 
                      value={customer._id} 
                      className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white"
                    >
                      {customer.firstName} {customer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStage('all');
                  setSelectedCustomer('all');
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

      {/* Lista de Oportunidades */}
      <Card className="bg-smartops-white border-smartops-gray shadow-md">
        <CardHeader>
          <CardTitle className="font-montserrat text-smartops-dark">
            Lista de Oportunidades
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
              <div className="text-smartops-dark/60 font-montserrat">Cargando oportunidades...</div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-smartops-dark/30 mx-auto mb-4" />
              <p className="text-smartops-dark/60 font-montserrat">No se encontraron oportunidades</p>
              <Button 
                variant="smartopsGradient" 
                onClick={handleAddOpportunity}
                className="mt-4 font-montserrat"
              >
                Agregar primera oportunidad
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Oportunidad</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Cliente</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Valor</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Probabilidad</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Etapa</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Fecha Cierre</TableHeaderCell>
                    <TableHeaderCell className="font-montserrat text-smartops-dark">Acciones</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opportunities.map((opportunity) => {
                    const StageIcon = stageIcons[opportunity.stage];
                    return (
                      <TableRow key={opportunity._id} className="hover:bg-smartops-gray/20 transition-colors">
                        <TableCell className="font-montserrat text-smartops-dark font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-smartops-blue to-smartops-purple rounded-full flex items-center justify-center text-white text-sm">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium">{opportunity.name}</div>
                              <p className="text-sm text-smartops-dark/60 font-montserrat truncate max-w-xs">
                                {opportunity.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">
                          {getCustomerName(opportunity.customerId)}
                        </TableCell>
                        <TableCell className="font-montserrat text-smartops-dark font-medium">
                          {formatCurrency(opportunity.value)}
                        </TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-smartops-gray/30 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-smartops-blue to-smartops-purple h-2 rounded-full" 
                                style={{ width: `${opportunity.probability}%` }}
                              />
                            </div>
                            <span className="text-sm">{opportunity.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${stageColors[opportunity.stage]} font-montserrat`}>
                            <StageIcon className="w-3 h-3 mr-1" />
                            {stageLabels[opportunity.stage]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-montserrat text-smartops-dark">
                          {opportunity.expectedCloseDate 
                            ? formatDate(opportunity.expectedCloseDate) 
                            : 'No definida'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOpportunity(opportunity)}
                              className="text-smartops-dark hover:bg-green-500 hover:text-white transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOpportunity(opportunity)}
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
        title={editingOpportunity ? 'Editar Oportunidad' : 'Agregar Nueva Oportunidad'}
        className="max-w-3xl"
      >
        <OpportunityForm
          opportunity={editingOpportunity || undefined}
          customers={customers}
          onSuccess={() => {
            handleOpportunitySaved();
            setIsFormOpen(false);
            setEditingOpportunity(null);
          }}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingOpportunity(null);
          }}
        />
      </Modal>
    </div>
  );
} 