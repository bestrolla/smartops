import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  MessageSquare, 
  Mail, 
  Workflow, 
  Zap,
  Settings,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { automationApi, type Automation } from '@/lib/automationApi';

interface WorkflowCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workflow: Automation) => void;
  templateData: {
    name: string;
    description: string;
    type: WorkflowType;
    platforms: Platform[];
  };
}

type WorkflowType = 'chatbot' | 'social_media' | 'email' | 'workflow' | 'trigger';
type Platform = 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'website';

interface WorkflowFormData {
  // Información básica
  name: string;
  description: string;
  type: WorkflowType;
  platforms: Platform[];
  
  // Configuración de respuestas
  defaultResponse: string;
  fallbackResponse: string;
  
  // Horarios de trabajo
  workingHoursEnabled: boolean;
  timezone: string;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
  
  // Configuración de redes sociales
  autoResponse: boolean;
  responseDelay: number;
  maxResponsesPerUser: number;
  blacklistedWords: string[];
  
  // Configuración avanzada
  retryAttempts: number;
  timeout: number;
  rateLimitingEnabled: boolean;
  maxRequests: number;
  windowMs: number;
  
  // Tags
  tags: string[];
}

const WORKFLOW_TYPES = [
  {
    value: 'chatbot' as WorkflowType,
    label: 'Chatbot',
    description: 'Bot automático para responder mensajes',
    icon: Bot,
    color: 'bg-blue-500'
  },
  {
    value: 'social_media' as WorkflowType,
    label: 'Redes Sociales',
    description: 'Automatización para plataformas sociales',
    icon: MessageSquare,
    color: 'bg-purple-500'
  },
  {
    value: 'email' as WorkflowType,
    label: 'Email Marketing',
    description: 'Campañas automáticas de correo',
    icon: Mail,
    color: 'bg-green-500'
  },
  {
    value: 'workflow' as WorkflowType,
    label: 'Workflow Personalizado',
    description: 'Flujo de trabajo personalizado',
    icon: Workflow,
    color: 'bg-orange-500'
  },
  {
    value: 'trigger' as WorkflowType,
    label: 'Trigger Automático',
    description: 'Activador basado en eventos',
    icon: Zap,
    color: 'bg-red-500'
  }
];

const PLATFORMS = [
  { value: 'whatsapp' as Platform, label: 'WhatsApp', icon: MessageSquare },
  { value: 'telegram' as Platform, label: 'Telegram', icon: MessageSquare },
  { value: 'instagram' as Platform, label: 'Instagram', icon: MessageSquare },
  { value: 'facebook' as Platform, label: 'Facebook', icon: MessageSquare },
  { value: 'website' as Platform, label: 'Sitio Web', icon: Bot }
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

export default function WorkflowCreateForm({ isOpen, onClose, onSuccess, templateData }: WorkflowCreateFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: templateData.name,
    description: templateData.description,
    type: templateData.type,
    platforms: templateData.platforms,
    defaultResponse: '¡Hola! ¿En qué puedo ayudarte?',
    fallbackResponse: 'Lo siento, no entendí tu mensaje. ¿Podrías ser más específico?',
    workingHoursEnabled: true,
    timezone: 'America/Mexico_City',
    schedule: DAYS_OF_WEEK.map(day => ({
      day: day.value,
      startTime: '09:00',
      endTime: '18:00',
      enabled: day.value !== 'saturday' && day.value !== 'sunday'
    })),
    autoResponse: true,
    responseDelay: 2,
    maxResponsesPerUser: 10,
    blacklistedWords: [],
    retryAttempts: 3,
    timeout: 30000,
    rateLimitingEnabled: true,
    maxRequests: 100,
    windowMs: 60000,
    tags: []
  });

  const steps = [
    {
      title: 'Configuración Básica',
      description: 'Información general y respuestas',
      icon: Settings
    },
    {
      title: 'Horarios y Límites',
      description: 'Horarios de trabajo y limitaciones',
      icon: Clock
    },
    {
      title: 'Configuración Avanzada',
      description: 'Opciones avanzadas y finalización',
      icon: Zap
    }
  ];

  const updateFormData = (field: keyof WorkflowFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSchedule = (dayIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const addBlacklistedWord = () => {
    const word = prompt('Ingresa una palabra a bloquear:');
    if (word && word.trim()) {
      updateFormData('blacklistedWords', [...formData.blacklistedWords, word.trim()]);
    }
  };

  const removeBlacklistedWord = (index: number) => {
    updateFormData('blacklistedWords', formData.blacklistedWords.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = prompt('Ingresa un tag:');
    if (tag && tag.trim() && !formData.tags.includes(tag.trim())) {
      updateFormData('tags', [...formData.tags, tag.trim()]);
    }
  };

  const removeTag = (index: number) => {
    updateFormData('tags', formData.tags.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 0:
        if (!formData.name.trim()) return 'El nombre es requerido';
        if (!formData.defaultResponse.trim()) return 'La respuesta por defecto es requerida';
        break;
      case 1:
        if (formData.workingHoursEnabled) {
          const enabledDays = formData.schedule.filter(day => day.enabled);
          if (enabledDays.length === 0) return 'Debe haber al menos un día habilitado';
        }
        break;
    }
    return null;
  };

  const nextStep = () => {
    const error = validateStep(currentStep);
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const error = validateStep(currentStep);
    if (error) {
      setError(error);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Preparar datos para la API
      const automationData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        status: 'draft' as const,
        config: {
          platforms: formData.platforms,
          defaultResponse: formData.defaultResponse,
          fallbackResponse: formData.fallbackResponse,
          workingHours: {
            enabled: formData.workingHoursEnabled,
            timezone: formData.timezone,
            schedule: formData.schedule
          },
          socialMediaConfig: {
            autoResponse: formData.autoResponse,
            responseDelay: formData.responseDelay,
            maxResponsesPerUser: formData.maxResponsesPerUser,
            blacklistedWords: formData.blacklistedWords,
            whitelistedUsers: [] // <-- Agregado para cumplir con el tipo
          }
        },
        advanced: {
          retryAttempts: formData.retryAttempts,
          timeout: formData.timeout,
          rateLimiting: {
            enabled: formData.rateLimitingEnabled,
            maxRequests: formData.maxRequests,
            windowMs: formData.windowMs
          },
          logging: {
            enabled: true,
            level: 'info' as const
          }
        },
        tags: formData.tags
      };

      // Crear automatización en la API
      const createdAutomation = await automationApi.createAutomation(automationData);
      
      onSuccess(createdAutomation);
      onClose();
      
      // Reset form
      setCurrentStep(0);
      setFormData({
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        platforms: templateData.platforms,
        defaultResponse: '¡Hola! ¿En qué puedo ayudarte?',
        fallbackResponse: 'Lo siento, no entendí tu mensaje. ¿Podrías ser más específico?',
        workingHoursEnabled: true,
        timezone: 'America/Mexico_City',
        schedule: DAYS_OF_WEEK.map(day => ({
          day: day.value,
          startTime: '09:00',
          endTime: '18:00',
          enabled: day.value !== 'saturday' && day.value !== 'sunday'
        })),
        autoResponse: true,
        responseDelay: 2,
        maxResponsesPerUser: 10,
        blacklistedWords: [],
        retryAttempts: 3,
        timeout: 30000,
        rateLimitingEnabled: true,
        maxRequests: 100,
        windowMs: 60000,
        tags: []
      });
      
    } catch (err: any) {
      setError(err.message || 'Error al crear la automatización');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-montserrat">Crear Nueva Automatización</h2>
              <p className="text-blue-100 font-montserrat">
                {steps[currentStep].description}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-white text-smartops-blue' 
                    : 'bg-white/20 text-white/60'
                  }
                `}>
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-1 mx-2
                    ${index < currentStep ? 'bg-white' : 'bg-white/20'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: '60vh' }}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-montserrat">{error}</span>
            </div>
          )}

          {/* Step 0: Configuración Básica */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold font-montserrat mb-4 block">
                  Selecciona la(s) plataforma(s) de entrada
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {templateData.platforms.map((platform) => (
                    <Card 
                      key={platform}
                      className={`cursor-pointer transition-all border-2 ${
                        formData.platforms.includes(platform)
                          ? 'border-smartops-blue bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        const newPlatforms = formData.platforms.includes(platform)
                          ? formData.platforms.filter(p => p !== platform)
                          : [...formData.platforms, platform];
                        updateFormData('platforms', newPlatforms);
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <span className="text-lg">{platform}</span>
                        <span className="text-xs font-montserrat block mt-1 capitalize">{platform}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="defaultResponse" className="font-montserrat">Respuesta por Defecto *</Label>
                <Textarea
                  id="defaultResponse"
                  value={formData.defaultResponse}
                  onChange={(e) => updateFormData('defaultResponse', e.target.value)}
                  placeholder="Mensaje que se enviará como saludo inicial"
                  className="font-montserrat"
                  rows={3}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="fallbackResponse" className="font-montserrat">Respuesta de Fallback</Label>
                <Textarea
                  id="fallbackResponse"
                  value={formData.fallbackResponse}
                  onChange={(e) => updateFormData('fallbackResponse', e.target.value)}
                  placeholder="Mensaje cuando no se entiende la consulta del usuario"
                  className="font-montserrat"
                  rows={3}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoResponse"
                    checked={formData.autoResponse}
                    onCheckedChange={(checked) => updateFormData('autoResponse', checked)}
                    disabled
                  />
                  <Label htmlFor="autoResponse" className="font-montserrat">Respuesta Automática</Label>
                </div>
                <div>
                  <Label htmlFor="responseDelay" className="font-montserrat">Delay (segundos)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    value={formData.responseDelay}
                    onChange={(e) => updateFormData('responseDelay', parseInt(e.target.value) || 2)}
                    min="1"
                    max="60"
                    className="font-montserrat"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="maxResponsesPerUser" className="font-montserrat">Máx. Respuestas/Usuario</Label>
                  <Input
                    id="maxResponsesPerUser"
                    type="number"
                    value={formData.maxResponsesPerUser}
                    onChange={(e) => updateFormData('maxResponsesPerUser', parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                    className="font-montserrat"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Horarios y Límites */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="workingHoursEnabled"
                  checked={formData.workingHoursEnabled}
                  onCheckedChange={(checked) => updateFormData('workingHoursEnabled', checked)}
                />
                <Label htmlFor="workingHoursEnabled" className="font-montserrat font-semibold">
                  Habilitar Horarios de Trabajo
                </Label>
              </div>

              {formData.workingHoursEnabled && (
                <>
                  <div>
                    <Label htmlFor="timezone" className="font-montserrat">Zona Horaria</Label>
                    <Select value={formData.timezone} onValueChange={(value) => updateFormData('timezone', value)}>
                      <SelectTrigger className="font-montserrat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles (GMT-8)</SelectItem>
                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-montserrat font-semibold mb-3 block">Horarios por Día</Label>
                    <div className="space-y-3">
                      {formData.schedule.map((daySchedule, index) => (
                        <div key={daySchedule.day} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={daySchedule.enabled}
                              onCheckedChange={(checked) => updateSchedule(index, 'enabled', checked)}
                            />
                            <span className="w-20 font-montserrat text-sm">
                              {DAYS_OF_WEEK.find(d => d.value === daySchedule.day)?.label}
                            </span>
                          </div>
                          {daySchedule.enabled && (
                            <>
                              <Input
                                type="time"
                                value={daySchedule.startTime}
                                onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                                className="w-32"
                                disabled
                              />
                              <span className="text-gray-500">a</span>
                              <Input
                                type="time"
                                value={daySchedule.endTime}
                                onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                                className="w-32"
                                disabled
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label className="font-montserrat font-semibold mb-3 block">Palabras Bloqueadas</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.blacklistedWords.map((word, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeBlacklistedWord(index)}>
                      {word} ✕
                    </Badge>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addBlacklistedWord} className="font-montserrat" disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Palabra
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Configuración Avanzada */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="retryAttempts" className="font-montserrat">Intentos de Reintento</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={formData.retryAttempts}
                    onChange={(e) => updateFormData('retryAttempts', parseInt(e.target.value) || 3)}
                    min="1"
                    max="10"
                    className="font-montserrat"
                  />
                </div>
                <div>
                  <Label htmlFor="timeout" className="font-montserrat">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeout}
                    onChange={(e) => updateFormData('timeout', parseInt(e.target.value) || 30000)}
                    min="5000"
                    max="120000"
                    className="font-montserrat"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="rateLimitingEnabled"
                  checked={formData.rateLimitingEnabled}
                  onCheckedChange={(checked) => updateFormData('rateLimitingEnabled', checked)}
                />
                <Label htmlFor="rateLimitingEnabled" className="font-montserrat font-semibold">
                  Habilitar Rate Limiting
                </Label>
              </div>

              {formData.rateLimitingEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="maxRequests" className="font-montserrat">Máximo de Requests</Label>
                    <Input
                      id="maxRequests"
                      type="number"
                      value={formData.maxRequests}
                      onChange={(e) => updateFormData('maxRequests', parseInt(e.target.value) || 100)}
                      min="10"
                      max="1000"
                      className="font-montserrat"
                    />
                  </div>
                  <div>
                    <Label htmlFor="windowMs" className="font-montserrat">Ventana de Tiempo (ms)</Label>
                    <Input
                      id="windowMs"
                      type="number"
                      value={formData.windowMs}
                      onChange={(e) => updateFormData('windowMs', parseInt(e.target.value) || 60000)}
                      min="1000"
                      max="3600000"
                      className="font-montserrat"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="font-montserrat font-semibold mb-3 block">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(index)}>
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addTag} className="font-montserrat" disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Tag
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="font-montserrat"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="font-montserrat">
              Cancelar
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={nextStep} className="font-montserrat">
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading} className="font-montserrat">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Crear Automatización
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 