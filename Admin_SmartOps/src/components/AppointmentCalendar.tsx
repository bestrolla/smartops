import React, { useState, useEffect } from 'react';
import { Calendar } from './ui/calendar';
import { Modal } from './ui/modal';
import { AppointmentForm } from './forms/AppointmentForm';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Plus, Calendar as CalendarIcon, Clock, User, MapPin } from 'lucide-react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAppointments, type Appointment } from '../lib/appointmentsApi';

interface AppointmentCalendarProps {
  onAppointmentCreated?: () => void;
}

export function AppointmentCalendar({ onAppointmentCreated }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAppointments();
      setAppointments(response.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    // Filtrar citas del día seleccionado
    const dayAppointments = appointments.filter(appointment => 
      isSameDay(parseISO(appointment.start), selectedDate)
    );
    setSelectedAppointments(dayAppointments);
  }, [selectedDate, appointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  // Crear modifiers para el calendario
  const appointmentDays = appointments.reduce((acc, appointment) => {
    const date = startOfDay(parseISO(appointment.start));
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const modifiers = {
    hasAppointments: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return !!appointmentDays[dateKey]?.length;
    },
    hasMultipleAppointments: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return (appointmentDays[dateKey]?.length || 0) > 1;
    },
  };

  const modifiersStyles = {
    hasAppointments: {
      position: 'relative' as const,
    },
    hasMultipleAppointments: {
      fontWeight: 'bold' as const,
    },
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleCreateAppointment = () => {
    setShowCreateModal(true);
  };

  const handleAppointmentCreated = () => {
    setShowCreateModal(false);
    loadAppointments();
    onAppointmentCreated?.();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Calendario */}
      <div className="xl:col-span-3">
        <div className="bg-smartops-white rounded-lg shadow-md border border-smartops-gray p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-smartops-dark font-montserrat">
              Calendario de Citas
            </h2>
            <Button
              onClick={handleCreateAppointment}
              className="bg-gradient-to-r from-smartops-blue to-smartops-purple text-white hover:from-smartops-blue/90 hover:to-smartops-purple/90 font-montserrat"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </div>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border border-smartops-gray"
            />
          </div>

          {/* Indicadores de leyenda */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-smartops-dark/70 font-montserrat">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-smartops-blue to-smartops-purple"></div>
              <span>Día seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-smartops-blue/20 border-2 border-smartops-blue"></div>
              <span>Días con citas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de citas del día */}
      <div className="xl:col-span-1">
        <div className="bg-smartops-white rounded-lg shadow-md border border-smartops-gray p-6">
          <h3 className="text-lg font-semibold text-smartops-dark font-montserrat mb-4">
            Citas del {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </h3>

          {loading ? (
            <div className="text-center text-smartops-dark/60 font-montserrat">
              Cargando citas...
            </div>
          ) : selectedAppointments.length === 0 ? (
            <div className="text-center text-smartops-dark/60 font-montserrat">
              <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-smartops-gray" />
              <p>No hay citas programadas para este día</p>
              <Button
                onClick={handleCreateAppointment}
                variant="outline"
                className="mt-3 border-smartops-blue text-smartops-blue hover:bg-smartops-blue hover:text-white font-montserrat"
              >
                Programar cita
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedAppointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="p-3 border border-smartops-gray rounded-lg hover:bg-smartops-gray/5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={`${getStatusColor(appointment.status)} text-white font-montserrat text-xs`}>
                      {getStatusText(appointment.status)}
                    </Badge>
                    <span className="text-xs text-smartops-dark/60 font-montserrat">
                      {format(parseISO(appointment.start), 'HH:mm')} - {format(parseISO(appointment.end), 'HH:mm')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-smartops-dark font-montserrat">
                      <User className="w-3 h-3 text-smartops-blue" />
                      <span>
                        {typeof appointment.professionalId === 'object' && appointment.professionalId?.user 
                          ? `${appointment.professionalId.user.firstName} ${appointment.professionalId.user.lastName}`
                          : 'Profesional no disponible'}
                      </span>
                    </div>

                    {typeof appointment.userId === 'object' && appointment.userId && (
                      <div className="flex items-center gap-2 text-sm text-smartops-dark/70 font-montserrat">
                        <User className="w-3 h-3 text-smartops-gray" />
                        <span>
                          Cliente: {appointment.userId.firstName} {appointment.userId.lastName}
                        </span>
                      </div>
                    )}

                    {typeof appointment.serviceId === 'object' && appointment.serviceId && (
                      <div className="flex items-center gap-2 text-sm text-smartops-dark/70 font-montserrat">
                        <Clock className="w-3 h-3 text-smartops-gray" />
                        <span>{appointment.serviceId.name}</span>
                      </div>
                    )}

                    {appointment.location && (
                      <div className="flex items-center gap-2 text-sm text-smartops-dark/70 font-montserrat">
                        <MapPin className="w-3 h-3 text-smartops-gray" />
                        <span>{appointment.location}</span>
                      </div>
                    )}

                    {appointment.notes && (
                      <p className="text-xs text-smartops-dark/60 font-montserrat mt-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear nueva cita */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Cita"
        className="max-w-4xl"
      >
        <AppointmentForm 
          onSuccess={handleAppointmentCreated}
        />
      </Modal>
    </div>
  );
} 