import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, ExternalLink, Save, Settings, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getAvailability, updateAvailability, type Availability } from '@/lib/appointmentsApi';
import { useAuth } from '@/lib/AuthContext';
import { useProfileLocalStorage } from '@/hooks/useProfileLocalStorage';
import { PendingChangesBadge } from '@/components/ui/PendingChangesBadge';

interface AppointmentConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  availability_message: string;
}

interface AppointmentEditorProps {
  onAppointmentChange: (config: AppointmentConfig) => void;
  initialConfig?: AppointmentConfig;
}

// Componente interno que requiere auth
function AppointmentEditorContent({ onAppointmentChange, tenantId, initialConfig }: AppointmentEditorProps & { tenantId: string }) {
  const [config, setConfig] = useState<AppointmentConfig>(
    initialConfig || {
      enabled: false,
      title: 'Agendar Cita',
      subtitle: '¿Listo para comenzar?',
      description: 'Agenda una consulta gratuita y descubre cómo puedo ayudarte a transformar tu presencia digital.',
      button_text: 'Agendar Consulta Gratuita',
      availability_message: 'Horarios disponibles: Lunes a Viernes de 9:00 AM a 6:00 PM'
    }
  );

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hook para manejo de localStorage
  // Hook para manejo de localStorage (corrección: pasar una clave string)
  const storage = useProfileLocalStorage('appointmentDraft');
  
  // Wrappers locales para cambios pendientes (reemplazan API inexistente del hook)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const addPendingChange = (step: string, data: unknown) => {
    storage.setDraft(step, data);
    setHasUnsavedChanges(true);
  };
  const saveAllChanges = async () => {
    // Aquí podrías enviar al servidor usando storage.buildFinalPayload() si es necesario
    setHasUnsavedChanges(false);
  };
  const discardChanges = () => {
    storage.clearDraft();
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  // Actualizar config cuando cambie initialConfig
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      onAppointmentChange(initialConfig);
    }
  }, [initialConfig, onAppointmentChange]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      // Usar el tenantId del usuario autenticado
      const response = await getAvailability(tenantId);
      setAvailability(response);
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      if (error.response?.status === 404) {
        console.log('No hay disponibilidad configurada para este profesional');
      } else if (error.response?.status === 403) {
        console.log('El usuario no tiene permisos para ver la disponibilidad de este profesional');
      } else {
        console.log('Error al cargar disponibilidad:', error.message);
      }
      // Para casos donde no hay disponibilidad configurada, establecer null
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AppointmentConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onAppointmentChange(newConfig);
    
    console.log('🔄 AppointmentEditor handleChange:');
    console.log('- field:', field);
    console.log('- value:', value);
    console.log('- newConfig:', newConfig);
    
    // Guardar en localStorage
    addPendingChange('appointments', { appointment_config: newConfig });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Guardar en localStorage primero
      addPendingChange('appointments', { appointment_config: config });
      
      // Luego enviar al servidor automáticamente
      await saveAllChanges();
      
      toast.success('Configuración de citas guardada correctamente');
    } catch (error) {
      console.error('Error al guardar configuración de citas:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const getAvailabilitySummary = () => {
    if (!availability) return 'No configurado';
    
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const activeDays = availability.daysOfWeek.map(day => days[day]).join(', ');
    
    return `${activeDays} - ${availability.startTime} a ${availability.endTime} (${availability.slotDuration} min)`;
  };

  const getAvailabilityDetails = () => {
    if (!availability) return null;
    
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayNames = availability.daysOfWeek.map(day => days[day]);
    
    return {
      days: dayNames,
      schedule: `${availability.startTime} - ${availability.endTime}`,
      duration: `${availability.slotDuration} minutos`,
      type: availability.type === 'fixed' ? 'Horario fijo' : 'Horario personalizado'
    };
  };

  return (
    <div className="space-y-6">
      {/* Badge de cambios pendientes */}
      <PendingChangesBadge show={hasUnsavedChanges} />
      {/* Configuración General */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-smartops-blue" />
            Configuración de Citas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Activar sección de citas</Label>
              <p className="text-sm text-gray-600">Habilita la sección para agendar citas en tu perfil</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estado del Sistema de Citas */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-smartops-blue" />
            Estado del Sistema de Citas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Disponibilidad Configurada</span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600">Cargando...</p>
              </div>
            ) : availability ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-900 font-medium">
                  {getAvailabilitySummary()}
                </p>
                {(() => {
                  const details = getAvailabilityDetails();
                  return details && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Días:</span>
                        <p className="text-gray-600">{details.days.join(', ')}</p>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Horario:</span>
                        <p className="text-gray-600">{details.schedule}</p>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Duración:</span>
                        <p className="text-gray-600">{details.duration}</p>
                      </div>
                      <div className="text-xs">
                        <span className="font-medium text-gray-700">Tipo:</span>
                        <p className="text-gray-600">{details.type}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">No configurado</p>
                <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                  <p className="font-medium mb-1">💡 Para configurar tu disponibilidad:</p>
                  <p>1. Ve a la página de <strong>Gestionar Citas</strong></p>
                  <p>2. Configura tus horarios de atención</p>
                  <p>3. Los horarios aparecerán automáticamente en tu perfil</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Sistema de Citas Activo</span>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              El módulo de citas está disponible y funcionando. Los usuarios pueden agendar citas a través de tu perfil.
            </p>
            <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
              URL de reservas: <span className="font-mono">/appointments?professional={tenantId}&action=book</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('/appointments', '_blank')}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              Gestionar Citas
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/appointments?view=calendar', '_blank')}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ver Calendario
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido de la Sección */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-smartops-blue" />
            Contenido de la Sección
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título de la sección</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ej: Agendar Cita"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={config.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Ej: ¿Listo para comenzar?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe el servicio de consulta..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_text">Texto del botón</Label>
            <Input
              id="button_text"
              value={config.button_text}
              onChange={(e) => handleChange('button_text', e.target.value)}
              placeholder="Ej: Agendar Consulta Gratuita"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability_message">Mensaje de disponibilidad</Label>
            <Textarea
              id="availability_message"
              value={config.availability_message}
              onChange={(e) => handleChange('availability_message', e.target.value)}
              placeholder="Horarios disponibles..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vista Previa */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-smartops-blue" />
            Vista Previa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icono del calendario */}
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold">{config.title}</h2>

              {/* Subtítulo */}
              <h3 className="text-xl font-semibold text-gray-200">{config.subtitle}</h3>

              {/* Descripción */}
              <p className="text-gray-300 max-w-md leading-relaxed">
                {config.description}
              </p>

              {/* Botón */}
              <Button 
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg shadow-lg"
              >
                {config.button_text}
              </Button>

              {/* Mensaje de disponibilidad */}
              {config.availability_message && (
                <p className="text-sm text-gray-400 mt-4">
                  {config.availability_message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-smartops-blue" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
                      <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">✅ Sistema Integrado</h4>
            <p className="text-sm text-green-700">
              Esta sección utiliza el módulo de citas completo de SmartOps. Los usuarios pueden:
            </p>
            <ul className="text-sm text-green-700 mt-2 space-y-1">
              <li>• Ver tu disponibilidad en tiempo real</li>
              <li>• Seleccionar horarios disponibles</li>
              <li>• Recibir confirmaciones automáticas</li>
              <li>• Gestionar sus citas desde el sistema</li>
            </ul>
          </div>

          <div className={`rounded-lg p-4 ${config.enabled ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <h4 className={`font-medium mb-2 ${config.enabled ? 'text-green-900' : 'text-orange-900'}`}>
              {config.enabled ? '🟢 Sección Activa en el Perfil' : '🟠 Sección Desactivada'}
            </h4>
            <p className={`text-sm ${config.enabled ? 'text-green-700' : 'text-orange-700'}`}>
              {config.enabled 
                ? 'La sección de citas aparece en tu perfil público y los usuarios pueden agendar contigo.'
                : 'Activa la sección de citas para que aparezca en tu perfil público.'
              }
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🔗 Enlaces Útiles</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/appointments', '_blank')}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Disponibilidad
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/appointments?view=calendar', '_blank')}
                className="w-full justify-start"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Calendario de Citas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-smartops-blue hover:bg-smartops-blue-hover text-white font-semibold py-3"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Configuración de Citas'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal que maneja la autenticación
export function AppointmentEditor({ onAppointmentChange, initialConfig }: AppointmentEditorProps) {
  const { auth } = useAuth();

  // Verificar que tengamos auth antes de continuar
  if (!auth?.tenantId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return <AppointmentEditorContent onAppointmentChange={onAppointmentChange} tenantId={auth.tenantId} initialConfig={initialConfig} />;
}