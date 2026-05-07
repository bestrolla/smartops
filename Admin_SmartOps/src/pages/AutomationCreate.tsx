import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot, 
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Mail,
  Workflow,
  Zap,
  Settings
} from 'lucide-react';
import WorkflowCreateForm from '@/components/forms/WorkflowCreateForm';
import { type Automation } from '@/lib/automationApi';

export default function AutomationCreate() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSuccess = (workflow: Automation) => {
    // Navegar de vuelta a la página de automatización
    navigate('/automation');
  };

  const quickTemplates = [
    {
      id: 'chatbot-basic',
      name: 'Chatbot Básico',
      description: 'Bot simple para responder preguntas frecuentes',
      icon: Bot,
      color: 'bg-blue-500',
      type: 'chatbot' as const,
      platforms: ['whatsapp'],
      estimatedTime: '5 min'
    },
    {
      id: 'social-media-auto',
      name: 'Respuesta Automática Social',
      description: 'Respuestas automáticas para redes sociales',
      icon: MessageSquare,
      color: 'bg-purple-500',
      type: 'social_media' as const,
      platforms: ['instagram', 'facebook'],
      estimatedTime: '10 min'
    },
    {
      id: 'email-welcome',
      name: 'Email de Bienvenida',
      description: 'Serie de emails para nuevos usuarios',
      icon: Mail,
      color: 'bg-green-500',
      type: 'email' as const,
      platforms: ['website'],
      estimatedTime: '15 min'
    },
    {
      id: 'custom-workflow',
      name: 'Workflow Personalizado',
      description: 'Crea un flujo de trabajo desde cero',
      icon: Workflow,
      color: 'bg-orange-500',
      type: 'workflow' as const,
      platforms: [],
      estimatedTime: '20 min'
    }
  ];

  const handleQuickTemplate = (template: any) => {
    // Para futuras versiones: prellenar el formulario con el template seleccionado
    setShowCreateForm(true);
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/automation')}
                className="text-white hover:bg-white/20 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-4">
                <Sparkles className="w-10 h-10" />
                <div>
                  <h1 className="text-3xl font-bold font-montserrat">Crear Nueva Automatización</h1>
                  <p className="text-blue-100 font-montserrat">
                    Elige un template rápido o configura desde cero
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-smartops-blue hover:bg-gray-50 font-montserrat shadow-md"
            >
              <Workflow className="w-4 h-4 mr-2" />
              Configuración Avanzada
            </Button>
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-6">
            Templates Rápidos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickTemplates.map((template) => (
              <Card 
                key={template.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-smartops-blue"
                onClick={() => handleQuickTemplate(template)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg ${template.color} flex items-center justify-center`}>
                      <template.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-montserrat text-smartops-dark/60 bg-smartops-gray/20 px-2 py-1 rounded">
                      {template.estimatedTime}
                    </span>
                  </div>
                  <CardTitle className="font-montserrat text-smartops-dark">
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-smartops-dark/70 font-montserrat mb-4">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.platforms.map((platform) => (
                      <span 
                        key={platform}
                        className="text-xs bg-smartops-blue/10 text-smartops-blue px-2 py-1 rounded font-montserrat"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-montserrat text-smartops-dark">
              <Zap className="w-6 h-6 text-smartops-blue" />
              ¿Qué puedes hacer con las automatizaciones?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-montserrat text-smartops-dark mb-1">
                    Chatbots Inteligentes
                  </h3>
                  <p className="text-sm text-smartops-dark/70 font-montserrat">
                    Responde automáticamente en WhatsApp, Telegram y más
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-montserrat text-smartops-dark mb-1">
                    Email Marketing
                  </h3>
                  <p className="text-sm text-smartops-dark/70 font-montserrat">
                    Campañas automáticas de seguimiento y bienvenida
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-montserrat text-smartops-dark mb-1">
                    Redes Sociales
                  </h3>
                  <p className="text-sm text-smartops-dark/70 font-montserrat">
                    Gestión automática de comentarios y mensajes directos
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Workflow className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-montserrat text-smartops-dark mb-1">
                    Workflows Personalizados
                  </h3>
                  <p className="text-sm text-smartops-dark/70 font-montserrat">
                    Flujos de trabajo adaptados a tu negocio específico
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-montserrat text-smartops-dark mb-1">
                    Triggers Automáticos
                  </h3>
                  <p className="text-sm text-smartops-dark/70 font-montserrat">
                    Activación basada en eventos y comportamientos
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold font-montserrat text-smartops-dark mb-1">
                    Configuración Avanzada
                  </h3>
                  <p className="text-sm text-smartops-dark/70 font-montserrat">
                    Horarios, límites, y opciones de personalización
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold font-montserrat text-smartops-dark mb-2">
                  💡 Consejos para crear automatizaciones efectivas
                </h3>
                <ul className="text-sm text-smartops-dark/70 font-montserrat space-y-1">
                  <li>• Comienza con templates simples y personalízalos gradualmente</li>
                  <li>• Define horarios de trabajo para evitar respuestas fuera de horario</li>
                  <li>• Usa palabras clave específicas para mejores respuestas automáticas</li>
                  <li>• Monitorea las métricas regularmente para optimizar el rendimiento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Create Form Modal */}
      <WorkflowCreateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleSuccess}
        templateData={{
          name: '',
          description: '',
          type: 'chatbot',
          platforms: ['whatsapp']
        }}
      />
    </div>
  );
} 