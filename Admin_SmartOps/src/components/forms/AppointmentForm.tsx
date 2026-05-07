import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { createAppointment, getAvailableSlots, type CreateAppointmentData, type AppointmentSlot } from '../../lib/appointmentsApi';
import { getProfessionals, type Professional } from '../../lib/professionalsApi';
import { getServices, type Service } from '../../lib/servicesApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'react-toastify';

interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ReminderForm {
  method: 'email' | 'sms' | 'push';
  timeBefore: number;
}

export function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const [formData, setFormData] = useState<CreateAppointmentData>({
    slotId: '',
    notes: '',
    reminders: [],
    serviceId: undefined
  });

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [reminders, setReminders] = useState<ReminderForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [professionalsData, servicesData] = await Promise.all([
          getProfessionals(),
          getServices()
        ]);
        setProfessionals(professionalsData.professionals || professionalsData);
        setServices(servicesData.docs || servicesData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Cargar slots disponibles cuando cambia el profesional o la fecha
  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedProfessional, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedProfessional || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const slots = await getAvailableSlots(selectedProfessional, selectedDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slotId) {
      alert('Por favor selecciona un horario disponible');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        ...formData,
        reminders: reminders.length > 0 ? reminders : undefined,
        serviceId: formData.serviceId || undefined
      };

      await createAppointment(appointmentData);
      onSuccess?.();
      toast.success('Cita guardada exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  const addReminder = () => {
    setReminders([...reminders, { method: 'email', timeBefore: 30 }]);
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const updateReminder = (index: number, field: keyof ReminderForm, value: any) => {
    const updated = [...reminders];
    updated[index] = { ...updated[index], [field]: value };
    setReminders(updated);
  };

  const formatSlotTime = (slot: AppointmentSlot) => {
    const start = new Date(slot.start).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const end = new Date(slot.end).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${start} - ${end}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-smartops-white border-smartops-gray shadow-md">
      <CardHeader>
        <CardTitle className="text-smartops-dark text-xl font-semibold font-montserrat">Nueva Cita</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Profesional */}
          <div className="space-y-2">
            <Label htmlFor="professional" className="text-smartops-dark font-montserrat">
              Profesional *
            </Label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-full bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                <SelectValue placeholder="Selecciona un profesional" />
              </SelectTrigger>
              <SelectContent className="bg-smartops-white border-smartops-gray">
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

          {/* Selección de Fecha */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-smartops-dark font-montserrat">
              Fecha *
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
            />
          </div>

          {/* Selección de Horario */}
          {selectedProfessional && selectedDate && (
            <div className="space-y-2">
              <Label htmlFor="slot" className="text-smartops-dark font-montserrat">
                Horario Disponible *
              </Label>
              {loadingSlots ? (
                <div className="text-smartops-dark/60 font-montserrat">Cargando horarios disponibles...</div>
              ) : (
                <Select value={formData.slotId} onValueChange={(value) => setFormData({...formData, slotId: value})}>
                  <SelectTrigger className="w-full bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                    <SelectValue placeholder="Selecciona un horario" />
                  </SelectTrigger>
                  <SelectContent className="bg-smartops-white border-smartops-gray">
                                          {availableSlots.length === 0 ? (
                        <div className="px-4 py-2 text-smartops-dark/60 text-sm font-montserrat">
                          No hay horarios disponibles
                        </div>
                      ) : (
                        availableSlots.map((slot) => (
                          <SelectItem 
                            key={slot._id} 
                            value={slot._id}
                            className="text-smartops-dark font-montserrat hover:bg-smartops-gray"
                          >
                            {formatSlotTime(slot)}
                          </SelectItem>
                        ))
                      )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Selección de Servicio (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="service" className="text-smartops-dark font-montserrat">
              Servicio (Opcional)
            </Label>
            <Select value={formData.serviceId || 'none'} onValueChange={(value) => setFormData({...formData, serviceId: value === 'none' ? undefined : value})}>
              <SelectTrigger className="w-full bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent className="bg-smartops-white border-smartops-gray">
                <SelectItem value="none" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">
                  Sin servicio específico
                </SelectItem>
                {services.map((service) => (
                  <SelectItem 
                    key={service._id} 
                    value={service._id}
                    className="text-smartops-dark font-montserrat hover:bg-smartops-gray"
                  >
                    {service.name} - ${service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-smartops-dark font-montserrat">
              Notas
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notas adicionales sobre la cita..."
              className="bg-smartops-white border-smartops-gray text-smartops-dark placeholder:text-smartops-dark/60 font-montserrat"
              rows={3}
            />
          </div>

          {/* Recordatorios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-smartops-dark font-montserrat">Recordatorios</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReminder}
                className="bg-smartops-white border-smartops-gray text-smartops-dark hover:bg-smartops-gray font-montserrat"
              >
                Agregar Recordatorio
              </Button>
            </div>
            
            {reminders.map((reminder, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-smartops-dark text-sm font-montserrat">Método</Label>
                  <Select 
                    value={reminder.method} 
                    onValueChange={(value) => updateReminder(index, 'method', value)}
                  >
                    <SelectTrigger className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-smartops-white border-smartops-gray">
                      <SelectItem value="email" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">Email</SelectItem>
                      <SelectItem value="sms" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">SMS</SelectItem>
                      <SelectItem value="push" className="text-smartops-dark font-montserrat hover:bg-smartops-gray">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-smartops-dark text-sm font-montserrat">Minutos antes</Label>
                  <Input
                    type="number"
                    value={reminder.timeBefore}
                    onChange={(e) => updateReminder(index, 'timeBefore', parseInt(e.target.value))}
                    min="1"
                    className="bg-smartops-white border-smartops-gray text-smartops-dark font-montserrat"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeReminder(index)}
                  className="bg-red-600 border-red-600 text-white hover:bg-red-700"
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.slotId || availableSlots.length === 0}
              variant="smartopsGradient"
              className="flex-1 font-montserrat"
            >
              {loading ? 'Creando...' : 'Crear Cita'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 bg-smartops-white border-smartops-gray text-smartops-dark hover:bg-smartops-gray font-montserrat"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
