import React, { useState, useEffect } from 'react';
import { List, CalendarDays, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Modal } from '../components/ui/modal';
import { AppointmentForm } from '../components/forms/AppointmentForm';
import { AppointmentCalendar } from '../components/AppointmentCalendar';
import { 
  getAppointments, 
  updateAppointmentStatus, 
  cancelAppointment,
  type Appointment, 
  type AppointmentFilters 
} from '../lib/appointmentsApi';
import { getProfessionals, type Professional } from '../lib/professionalsApi';

const statusColors = {
  pending: 'bg-yellow-600 text-yellow-100',
  confirmed: 'bg-green-600 text-green-100',
  cancelled: 'bg-red-600 text-red-100',
  completed: 'bg-blue-600 text-blue-100',
  no_show: 'bg-gray-600 text-gray-100'
};

const statusLabels = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  no_show: 'No asistió'
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<AppointmentFilters>({
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
    loadProfessionals();
  }, [filters]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading appointments with filters:', filters);
      const response = await getAppointments(filters);
      console.log('✅ Appointments loaded:', response);
      setAppointments(response.appointments || []);
      setTotalPages(response.pages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
      setError('Error al cargar las citas. Por favor, verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionals = async () => {
    try {
      console.log('🔄 Loading professionals...');
      const response = await getProfessionals();
      console.log('✅ Professionals loaded:', response);
      setProfessionals(response.professionals || response || []);
    } catch (error) {
      console.error('❌ Error loading professionals:', error);
      // No mostrar alerta aquí para no interrumpir la carga
    }
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      loadAppointments(); // Recargar la lista
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Error al actualizar el estado de la cita');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      try {
        await cancelAppointment(appointmentId);
        loadAppointments(); // Recargar la lista
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Error al cancelar la cita');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProfessionalName = (appointment: Appointment) => {
    if (typeof appointment.professionalId === 'object' && appointment.professionalId) {
      return appointment.professionalId.user ? `${appointment.professionalId.user.firstName} ${appointment.professionalId.user.lastName}` : 'N/A';
    }
    const professional = professionals.find(p => p._id === appointment.professionalId);
    return professional && professional.user ? `${professional.user.firstName} ${professional.user.lastName}` : 'N/A';
  };

  const getClientName = (appointment: Appointment) => {
    if (typeof appointment.userId === 'object' && appointment.userId) {
      return `${appointment.userId.firstName} ${appointment.userId.lastName}`;
    }
    return 'Cliente'; // Podrías cargar los datos del cliente si es necesario
  };

  const getServiceName = (appointment: Appointment) => {
    if (typeof appointment.serviceId === 'object' && appointment.serviceId) {
      return appointment.serviceId.name;
    }
    return 'Sin servicio específico';
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">Gestión de Citas</h1>
                <p className="text-blue-100 font-montserrat">Administra las citas de tus profesionales</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              {/* Botones de vista */}
              <div className="flex bg-white/20 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={`font-montserrat ${viewMode === 'list' ? 'bg-white text-smartops-blue' : 'text-white hover:bg-white/20'}`}
                >
                  <List className="w-4 h-4 mr-2" />
                  Lista
                </Button>
                <Button
                  onClick={() => setViewMode('calendar')}
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  className={`font-montserrat ${viewMode === 'calendar' ? 'bg-white text-smartops-blue' : 'text-white hover:bg-white/20'}`}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Calendario
                </Button>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-smartops-blue hover:bg-green-500 hover:text-white font-montserrat shadow-md"
              >
                Nueva Cita
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros - Solo mostrar en vista de lista */}
        {viewMode === 'list' && (
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 font-montserrat">
                <CalendarDays className="w-6 h-6" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat">Profesional</Label>
                <Select 
                  value={filters.professionalId || 'all'} 
                  onValueChange={(value) => setFilters({...filters, professionalId: value === 'all' ? undefined : value, page: 1})}
                >
                  <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                    <SelectValue placeholder="Todos los profesionales" />
                  </SelectTrigger>
                  <SelectContent className="bg-smartops-white border-smartops-gray">
                    <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                      Todos los profesionales
                    </SelectItem>
                    {professionals.map((professional) => (
                      <SelectItem 
                        key={professional._id} 
                        value={professional._id}
                        className="text-smartops-dark font-montserrat hover:bg-smartops-gray"
                      >
                        {professional.user?.firstName} {professional.user?.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat">Estado</Label>
                <Select 
                  value={filters.status || 'all'} 
                  onValueChange={(value) => setFilters({...filters, status: value === 'all' ? undefined : value, page: 1})}
                >
                  <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-smartops-white border-smartops-gray">
                    <SelectItem value="all" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                      Todos los estados
                    </SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem 
                        key={value} 
                        value={value}
                        className="text-smartops-dark font-montserrat hover:bg-smartops-gray"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat">Fecha desde</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value || undefined, page: 1})}
                  className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-smartops-dark font-montserrat">Fecha hasta</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value || undefined, page: 1})}
                  className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenido principal */}
      {viewMode === 'list' ? (
        /* Vista de Lista */
        <Card className="bg-smartops-white border-smartops-gray shadow-md">
          <CardHeader>
            <CardTitle className="text-smartops-dark font-montserrat">
              Citas ({total} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-lg font-semibold font-montserrat">{error}</p>
                </div>
                <Button 
                  onClick={() => {
                    setError(null);
                    loadAppointments();
                  }}
                  className="bg-smartops-blue hover:bg-smartops-blue-hover text-white font-montserrat"
                >
                  Reintentar
                </Button>
              </div>
            ) : loading ? (
              <div className="text-center py-8 text-smartops-dark/60 font-montserrat">
                Cargando citas...
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-smartops-dark/60 font-montserrat">
                No se encontraron citas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-smartops-gray">
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Fecha</th>
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Hora</th>
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Profesional</th>
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Cliente</th>
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Servicio</th>
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Estado</th>
                      <th className="text-left py-3 px-4 text-smartops-dark font-medium font-montserrat">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment._id} className="border-b border-smartops-gray hover:bg-smartops-gray/20">
                        <td className="py-3 px-4 text-smartops-dark font-montserrat">
                          {formatDate(appointment.start)}
                        </td>
                        <td className="py-3 px-4 text-smartops-dark font-montserrat">
                          {formatTime(appointment.start)} - {formatTime(appointment.end)}
                        </td>
                        <td className="py-3 px-4 text-smartops-dark font-montserrat">
                          {getProfessionalName(appointment)}
                        </td>
                        <td className="py-3 px-4 text-smartops-dark font-montserrat">
                          {getClientName(appointment)}
                        </td>
                        <td className="py-3 px-4 text-smartops-dark font-montserrat">
                          {getServiceName(appointment)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusColors[appointment.status]}>
                            {statusLabels[appointment.status]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {appointment.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                                  className="bg-green-500 border-green-500 text-white hover:bg-green-600 font-montserrat"
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelAppointment(appointment._id)}
                                  className="bg-red-500 border-red-500 text-white hover:bg-red-600 font-montserrat"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {appointment.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                  className="bg-smartops-blue border-smartops-blue text-white hover:bg-smartops-blue/80 font-montserrat"
                                >
                                  Completar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusUpdate(appointment._id, 'no_show')}
                                  className="bg-gray-500 border-gray-500 text-white hover:bg-gray-600 font-montserrat"
                                >
                                  No asistió
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Vista de Calendario */
        <AppointmentCalendar 
          onAppointmentCreated={() => {
            loadAppointments();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Paginación - Solo en vista de lista */}
      {viewMode === 'list' && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={filters.page === 1}
            onClick={() => setFilters({...filters, page: (filters.page || 1) - 1})}
            className="bg-smartops-white border-smartops-gray text-smartops-dark hover:bg-smartops-gray font-montserrat"
          >
            Anterior
          </Button>
          <span className="text-smartops-dark font-montserrat">
            Página {filters.page || 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={filters.page === totalPages}
            onClick={() => setFilters({...filters, page: (filters.page || 1) + 1})}
            className="bg-smartops-white border-smartops-gray text-smartops-dark hover:bg-smartops-gray font-montserrat"
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Modal para crear nueva cita */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Cita"
      >
        <AppointmentForm
          onSuccess={() => {
            setShowCreateModal(false);
            loadAppointments();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
      </div>
    </div>
  );
} 