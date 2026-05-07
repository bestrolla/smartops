import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service, ServiceCategory, getServices, deleteService, getServiceCategories } from '@/lib/servicesApi';
import { ServiceForm } from '@/components/forms/ServiceForm';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // activo/inactivo
  const [selectedPackage, setSelectedPackage] = useState('all'); // servicio/paquete
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 1
  });

  // Cargar servicios
  const loadServices = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (selectedCategory !== 'all') filters.categoryId = selectedCategory;
      if (selectedType === 'active') filters.isActive = true;
      if (selectedType === 'inactive') filters.isActive = false;
      if (selectedPackage === 'service') filters.isPackage = false;
      if (selectedPackage === 'package') filters.isPackage = true;

      const response = await getServices(filters);

      // Filtrar por término de búsqueda en el frontend
      let filteredServices = response.docs;
      if (searchTerm) {
        filteredServices = filteredServices.filter(service =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setServices(filteredServices);
      setPagination(prev => ({
        ...prev,
        totalDocs: response.totalDocs,
        totalPages: response.totalPages
      }));
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías
  const loadCategories = async () => {
    try {
      const categoriesData = await getServiceCategories();
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('❌ Error al cargar categorías:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadServices();
  }, [pagination.page, selectedCategory, selectedType, selectedPackage]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        loadServices();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddService = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDeleteService = async (service: Service) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) {
      try {
        await deleteService(service._id);
        loadServices();
        toast.success('Servicio eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar servicio:', error);
        toast.error('Error al eliminar el servicio');
      }
    }
  };

  const handleServiceSaved = () => {
    loadServices();
    loadCategories();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(cat => cat._id === categoryId);
    return category?.name || 'Categoría desconocida';
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Settings className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">Gestión de Servicios</h1>
                <p className="text-blue-100 font-montserrat">Administra los servicios y paquetes de tu negocio</p>
              </div>
            </div>
            <Button 
              onClick={handleAddService}
              className="bg-white text-smartops-blue hover:bg-green-500 hover:text-white font-montserrat shadow-md"
            >
              + Agregar Servicio
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {/* Filtros */}
<Card className="shadow-lg border-0">
  <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
    <CardTitle className="flex items-center gap-3 font-montserrat">
      <Settings className="w-6 h-6" />
      Filtros de Búsqueda
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Input
        placeholder="Buscar servicios..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="font-montserrat h-11"
      />

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="font-montserrat h-11">
          <SelectValue placeholder="Todas las categorías" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map(category => (
            <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="font-montserrat h-11">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedPackage} onValueChange={setSelectedPackage}>
        <SelectTrigger className="font-montserrat h-11">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="service">Servicios</SelectItem>
          <SelectItem value="package">Paquetes</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </CardContent>
</Card>

        {/* Tabla */}
        <Card className="bg-smartops-white border-smartops-gray shadow-md">
          <CardHeader>
            <CardTitle className="font-montserrat text-smartops-dark">
              Servicios ({pagination.totalDocs})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-smartops-dark/60 font-montserrat">Cargando servicios...</div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-smartops-dark/60 font-montserrat">No se encontraron servicios</div>
            ) : (
              <div className="overflow-x-auto">
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Nombre</TableHeaderCell>
      <TableHeaderCell>Categoría</TableHeaderCell>
      <TableHeaderCell>Duración</TableHeaderCell>
      <TableHeaderCell>Precio</TableHeaderCell>
      <TableHeaderCell>Tipo</TableHeaderCell>
      <TableHeaderCell>Estado</TableHeaderCell>
      <TableHeaderCell>Profesionales</TableHeaderCell>
      <TableHeaderCell>Acciones</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {services.map(service => (
      <TableRow key={service._id}>
        <TableCell>{service.name}</TableCell>
        <TableCell>{getCategoryName(service.categoryId)}</TableCell>
        <TableCell>{formatDuration(service.duration)}</TableCell>
        <TableCell>{formatCurrency(service.price, service.currency)}</TableCell>
        <TableCell>
          <Badge variant={service.isPackage ? "destructive" : "secondary"}>
            {service.isPackage ? 'Paquete' : 'Servicio'}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={service.isActive ? "default" : "secondary"}>
            {service.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </TableCell>
        <TableCell>{service.professionals?.length || 0}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={() => handleEditService(service)}>
              <Edit className="w-4 h-4 text-smartops-dark"/>
            </Button>
            <Button size="icon" variant="ghost" onClick={() => handleDeleteService(service)}>
              <Trash2 className="w-4 h-4 text-red-500"/>
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>



              </div>
            )}

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-smartops-gray/30">
                <p className="text-sm text-smartops-dark/60 font-montserrat">
                  Página {pagination.page} de {pagination.totalPages} ({pagination.totalDocs} servicios en total)
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="smartopsOutline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="font-montserrat"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="smartopsOutline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="font-montserrat"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de formulario */}
      <ServiceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleServiceSaved}
        editingService={editingService}
      />
    </div>
  );
};

export default Services;
