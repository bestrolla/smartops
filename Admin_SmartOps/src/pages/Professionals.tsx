import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Professional, getProfessionals, deleteProfessional, ProfessionalsApiResponse } from '@/lib/professionalsApi';
import { ProfessionalForm } from '@/components/forms/ProfessionalForm';
import { Plus, Search, Edit, Trash2, Users, UserCheck, UserX, Star, Filter, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchProfessionals();
  }, [pagination.page, selectedStatus, selectedType]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchProfessionals();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProfessionals = async () => {
    setLoading(true);
    setError(null);
    try {
      // Crear objeto de filtros según lo que espera la API
      const filter: any = {};
      
      if (selectedStatus === 'active') filter.isActive = true;
      if (selectedStatus === 'inactive') filter.isActive = false;
      if (selectedType && selectedType !== 'all') filter.professionalType = selectedType;

      const response: ProfessionalsApiResponse = await getProfessionals({
        page: pagination.page,
        limit: pagination.limit,
        filter: filter // Los filtros deben ir dentro del objeto 'filter'
      });
      
      // Filtrar por término de búsqueda en el frontend
      let filteredProfessionals = response.professionals || [];
      if (searchTerm) {
        filteredProfessionals = filteredProfessionals.filter((professional: Professional) =>
          professional.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          professional.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          professional.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          professional.professionalTypeDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          professional.specialties?.some(specialty => 
            specialty.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      }

      setProfessionals(filteredProfessionals);
      setPagination(prev => ({
        ...prev,
        total: response.total || filteredProfessionals.length,
        pages: response.pages || Math.ceil(filteredProfessionals.length / pagination.limit)
      }));
    } catch (err: any) {
      console.error('Error fetching professionals:', err);
      setError(err.response?.data?.message || 'Error al cargar profesionales');
      toast.error(err.response?.data?.message || 'Error al cargar profesionales');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfessional = (professional: Professional) => {
    setIsModalOpen(false);
    setEditingProfessional(null);
    fetchProfessionals();
    toast.success(editingProfessional ? 'Profesional actualizado correctamente' : 'Profesional creado correctamente');
  };

  const handleEditProfessional = (professional: Professional) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleDeleteProfessional = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este profesional?')) {
      setLoading(true);
      try {
        await deleteProfessional(id);
        fetchProfessionals();
        toast.success('Profesional eliminado correctamente');
      } catch (err: any) {
        console.error('Error deleting professional:', err);
        setError(err.response?.data?.message || 'Error al eliminar el profesional');
        toast.error(err.response?.data?.message || 'Error al eliminar el profesional');
      } finally {
        setLoading(false);
      }
    }
  };

  const getProfessionalName = (professional: Professional) => {
    if (professional.user) {
      return `${professional.user.firstName} ${professional.user.lastName}`;
    }
    return professional.userId || 'Nombre no disponible';
  };

  const getProfessionalUsername = (professional: Professional) => {
    return professional.user?.username || 'N/A';
  };

  const getProfessionalTypeName = (professional: Professional) => {
    return professional.professionalTypeDetails?.name || professional.professionalType || 'N/A';
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-3 sm:p-6">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 10000 }}
      />
      
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-4 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-montserrat">Gestión de Profesionales</h1>
                <p className="text-blue-100 font-montserrat text-sm sm:text-base">Administra los profesionales de tu organización</p>
              </div>
            </div>
            <Button 
              onClick={() => { setEditingProfessional(null); setIsModalOpen(true); }}
              className="bg-white text-smartops-blue hover:bg-green-500 hover:text-white font-montserrat shadow-md w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Agregar Profesional</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>
        </div>

        {/* Filtros - Mobile Toggle */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showMobileFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>

        {/* Filtros */}
        <Card className={`shadow-lg border-0 ${showMobileFilters ? 'block' : 'hidden sm:block'}`}>
          <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
            <CardTitle className="flex items-center justify-between font-montserrat">
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6" />
                <span className="hidden sm:inline">Filtros de Búsqueda</span>
                <span className="sm:hidden">Filtros</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
                className="sm:hidden text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat text-sm">Buscar profesional</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smartops-dark/40 w-4 h-4" />
                  <Input
                    placeholder="Nombre, usuario o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat focus:border-smartops-blue text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat text-sm">Estado</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat text-sm">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-smartops-white border-smartops-gray">
                    <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Todos los estados
                    </SelectItem>
                    <SelectItem value="active" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Activos
                    </SelectItem>
                    <SelectItem value="inactive" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Inactivos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat text-sm">Tipo de Profesional</Label>
                <Select 
                  value={selectedType} 
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat text-sm">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent className="bg-smartops-white border-smartops-gray">
                    <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Todos los tipos
                    </SelectItem>
                    <SelectItem value="doctor" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Doctor
                    </SelectItem>
                    <SelectItem value="nurse" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Enfermero/a
                    </SelectItem>
                    <SelectItem value="therapist" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Terapeuta
                    </SelectItem>
                    <SelectItem value="specialist" className="text-smartops-dark font-montserrat hover:bg-green-500 hover:text-white">
                      Especialista
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
                    setSelectedType('all');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500 w-full sm:w-auto text-sm"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Profesionales */}
        <Card className="bg-smartops-white border-smartops-gray shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-montserrat text-smartops-dark text-lg sm:text-xl">
              Lista de Profesionales
              {pagination.total > 0 && (
                <span className="text-sm font-normal text-smartops-dark/60 ml-2">
                  ({pagination.total} profesional{pagination.total !== 1 ? 'es' : ''})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 font-montserrat mx-4 sm:mx-0" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-smartops-dark/60 font-montserrat">Cargando profesionales...</div>
              </div>
            ) : professionals.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Users className="w-12 h-12 text-smartops-dark/30 mx-auto mb-4" />
                <p className="text-smartops-dark/60 font-montserrat">No se encontraron profesionales</p>
                <Button 
                  variant="smartopsGradient" 
                  onClick={() => { setEditingProfessional(null); setIsModalOpen(true); }}
                  className="mt-4 font-montserrat w-full sm:w-auto"
                >
                  Agregar primer profesional
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Profesional</TableHeaderCell>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Usuario</TableHeaderCell>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Tipo</TableHeaderCell>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Especialidades</TableHeaderCell>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Experiencia</TableHeaderCell>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Estado</TableHeaderCell>
                        <TableHeaderCell className="font-montserrat text-smartops-dark">Acciones</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {professionals.map((professional) => (
                        <TableRow key={professional._id} className="hover:bg-smartops-gray/20 transition-colors">
                          <TableCell className="font-montserrat text-smartops-dark font-medium">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-smartops-blue to-smartops-purple rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {professional.user?.firstName?.charAt(0) || 'P'}
                                {professional.user?.lastName?.charAt(0) || ''}
                              </div>
                              <div>
                                <div className="font-medium">{getProfessionalName(professional)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark/80">
                            @{getProfessionalUsername(professional)}
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark">
                            <Badge variant="outline" className="font-montserrat">
                              {getProfessionalTypeName(professional)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark/80">
                            <div className="flex flex-wrap gap-1">
                              {professional.specialties?.length ? (
                                professional.specialties.slice(0, 2).map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="font-montserrat text-xs">
                                    {specialty}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-smartops-dark/40">Sin especialidades</span>
                              )}
                              {professional.specialties && professional.specialties.length > 2 && (
                                <Badge variant="outline" className="font-montserrat text-xs">
                                  +{professional.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-montserrat text-smartops-dark/80">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-smartops-dark/60" />
                              {professional.experienceYears || 0} años
                            </div>
                          </TableCell>
                          <TableCell>
                            {professional.isActive ? (
                              <Badge className="bg-green-600 text-green-100 font-montserrat">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Activo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-600 text-red-100 font-montserrat">
                                <UserX className="w-3 h-3 mr-1" />
                                Inactivo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProfessional(professional)}
                                className="text-smartops-dark hover:bg-green-500 hover:text-white transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProfessional(professional._id)}
                                className="text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-4 px-4">
                  {professionals.map((professional) => (
                    <Card key={professional._id} className="border-smartops-gray shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-smartops-blue to-smartops-purple rounded-full flex items-center justify-center text-white text-lg font-bold">
                              {professional.user?.firstName?.charAt(0) || 'P'}
                              {professional.user?.lastName?.charAt(0) || ''}
                            </div>
                            <div>
                              <div className="font-medium text-smartops-dark text-base">{getProfessionalName(professional)}</div>
                              <div className="text-smartops-dark/60 text-sm">@{getProfessionalUsername(professional)}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {professional.isActive ? (
                              <Badge className="bg-green-600 text-green-100 font-montserrat text-xs">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Activo
                              </Badge>
                            ) : (
                              <Badge className="bg-red-600 text-red-100 font-montserrat text-xs">
                                <UserX className="w-3 h-3 mr-1" />
                                Inactivo
                              </Badge>
                            )}
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProfessional(professional)}
                                className="text-smartops-dark hover:bg-green-500 hover:text-white transition-colors p-2"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProfessional(professional._id)}
                                className="text-red-600 hover:bg-red-500 hover:text-white transition-colors p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-smartops-dark/60 text-sm">Tipo:</span>
                            <Badge variant="outline" className="font-montserrat text-xs">
                              {getProfessionalTypeName(professional)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-smartops-dark/60 text-sm">Experiencia:</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-smartops-dark/60" />
                              <span className="text-smartops-dark/80 text-sm">{professional.experienceYears || 0} años</span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-smartops-dark/60 text-sm">Especialidades:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {professional.specialties?.length ? (
                                professional.specialties.slice(0, 3).map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="font-montserrat text-xs">
                                    {specialty}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-smartops-dark/40 text-sm">Sin especialidades</span>
                              )}
                              {professional.specialties && professional.specialties.length > 3 && (
                                <Badge variant="outline" className="font-montserrat text-xs">
                                  +{professional.specialties.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Paginación */}
                {pagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-6 pt-4 border-t border-smartops-gray px-4 sm:px-0">
                    <div className="text-sm text-smartops-dark/60 font-montserrat text-center sm:text-left">
                      Página {pagination.page} de {pagination.pages}
                    </div>
                    <div className="flex justify-center sm:justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1 || loading}
                        className="font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50 min-w-[80px]"
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages || loading}
                        className="font-montserrat border-smartops-gray text-smartops-dark hover:bg-green-500 hover:text-white hover:border-green-500 disabled:opacity-50 min-w-[80px]"
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
        {isModalOpen && (
          <ProfessionalForm
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveProfessional}
            editingProfessional={editingProfessional}
            // title={editingProfessional ? 'Editar Profesional' : 'Agregar Nuevo Profesional'}
          />
        )}
      </div>
    </div>
  );
}