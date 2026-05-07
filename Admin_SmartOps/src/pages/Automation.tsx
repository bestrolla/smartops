import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Zap, 
  Clock, 
  Settings, 
  Play, 
  Pause, 
  Plus,
  Workflow,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Sparkles,
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { automationApi, type Automation } from '@/lib/automationApi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Automation() {
  const navigate = useNavigate();
  
  // Estados
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  // Cargar automatizaciones al montar el componente
  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: any = await automationApi.getAutomations();
      
      // Manejar diferentes estructuras de respuesta
      let automatizaciones: Automation[] = [];
      if (Array.isArray(response)) {
        automatizaciones = response;
      } else if (response && Array.isArray(response.data)) {
        automatizaciones = response.data;
      } else if (response && response.success && Array.isArray(response.data)) {
        automatizaciones = response.data;
      }
      
      // Agregar propiedades calculadas que faltan
      automatizaciones = automatizaciones.map(auto => ({
        ...auto,
        isActive: auto.status === 'active',
        platforms: auto.config?.platforms || []
      }));
      
      console.log('📊 Automatizaciones cargadas:', automatizaciones);
      setAutomations(automatizaciones);
    } catch (err: any) {
      setError(err.message || 'Error al cargar automatizaciones');
      console.error('Error fetching automations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutomation = async (automation: Automation) => {
    try {
      setLoadingActions(prev => ({ ...prev, [automation._id]: true }));
      const nextActive = automation.status !== 'active';
      const updatedAutomation = await automationApi.toggleAutomation(automation._id, nextActive);
      setAutomations(prev => {
        const prevList = Array.isArray(prev) ? prev : [];
        return prevList.map(auto =>
          auto._id === automation._id
            ? { ...auto, isActive: updatedAutomation.status === 'active', status: updatedAutomation.status }
            : auto
        );
      });
      toast.success(`La automatización ha sido ${updatedAutomation.status === 'active' ? 'activada' : 'pausada'} exitosamente.`);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Error cambiando estado de la automatización';
      toast.error(`Error: ${msg}`);
    } finally {
      setLoadingActions(prev => ({ ...prev, [automation._id]: false }));
    }
  };

  const handleDeleteAutomation = async (automationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta automatización?')) {
      return;
    }

    try {
      setLoadingActions(prev => ({ ...prev, [automationId]: true }));
      
      await automationApi.deleteAutomation(automationId);
      
      setAutomations(prev => {
        const prevList = Array.isArray(prev) ? prev : [];
        return prevList.filter(auto => auto._id !== automationId);
      });

      toast.success('Automatización eliminada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar automatización');
    } finally {
      setLoadingActions(prev => ({ ...prev, [automationId]: false }));
    }
  };

  const getAutomationStats = () => {
    // Asegurar que automations siempre sea un array
    const automationsList = Array.isArray(automations) ? automations : [];
    
    const active = automationsList.filter(auto => auto.isActive).length;
    const totalMessages = automationsList.reduce((acc, auto) => acc + (auto.metrics?.totalInteractions || 0), 0);
    const avgResponseTime = automationsList.length > 0 
      ? automationsList.reduce((acc, auto) => acc + (auto.metrics?.avgResponseTime || 0), 0) / automationsList.length / 1000
      : 0;
    const totalWorkflows = automationsList.length;

    return [
      {
        title: 'Automatizaciones Activas',
        value: active.toString(),
        icon: Play,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Mensajes Hoy',
        value: totalMessages.toString(),
        icon: Zap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Tiempo Promedio',
        value: `${avgResponseTime.toFixed(1)}s`,
        icon: Clock,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Workflows',
        value: totalWorkflows.toString(),
        icon: Workflow,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ];
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500 text-white font-montserrat">Activa</Badge>;
    }
    return <Badge variant="secondary" className="font-montserrat">Inactiva</Badge>;
  };

  const getPlatformIcons = (platforms: string[]) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'whatsapp': MessageSquare,
      'telegram': MessageSquare,
      'instagram': MessageSquare,
      'facebook': MessageSquare,
      'email': Mail
    };

    return platforms.map((platform, index) => {
      const Icon = iconMap[platform] || MessageSquare;
      return (
        <div key={index} className="w-6 h-6 rounded bg-smartops-gray/20 flex items-center justify-center">
          <Icon className="w-3 h-3 text-smartops-dark/70" />
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-smartops-blue" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-smartops-dark mb-2">Error al cargar automatizaciones</h3>
              <p className="text-smartops-dark/60 mb-4">{error}</p>
              <Button onClick={fetchAutomations} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Bot className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">Automatización</h1>
                <p className="text-blue-100 font-montserrat">Optimiza tus procesos con automatizaciones inteligentes</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/templates')}
                className="bg-white text-smartops-blue hover:bg-green-500 hover:text-white font-montserrat shadow-md"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ver Templates
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getAutomationStats().map((stat, index) => (
            <Card key={index} className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium font-montserrat text-smartops-dark/70 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold font-montserrat text-smartops-dark">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Automatizaciones */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Bot className="w-6 h-6" />
              Automatizaciones Configuradas ({Array.isArray(automations) ? automations.length : 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!Array.isArray(automations) || automations.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-smartops-dark/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium font-montserrat text-smartops-dark mb-2">
                  No tienes automatizaciones configuradas
                </h3>
                <p className="text-smartops-dark/60 font-montserrat mb-6">
                  Comienza creando tu primera automatización desde nuestros templates
                </p>
                <Button 
                  onClick={() => navigate('/templates')}
                  className="font-montserrat"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Explorar Templates
                </Button>
              </div>
            ) : (
              (Array.isArray(automations) ? automations : []).map((automation) => (
                <div 
                  key={automation._id}
                  className="flex items-center justify-between p-4 border border-smartops-gray-light rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-smartops-gray/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-smartops-dark/70" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold font-montserrat text-smartops-dark">
                          {automation.name}
                        </h3>
                        {getStatusBadge(automation.isActive)}
                        <div className="flex items-center gap-1">
                          {getPlatformIcons(automation.platforms)}
                        </div>
                      </div>
                      <p className="text-sm text-smartops-dark/60 font-montserrat mb-2">
                        {automation.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-smartops-dark/50 font-montserrat">
                        <span>Mensajes: {automation.metrics?.totalInteractions || 0}</span>
                        <span>•</span>
                        <span>Exitosos: {automation.metrics?.successfulResponses || 0}</span>
                        <span>•</span>
                        <span>Éxito: {automation.metrics?.totalInteractions > 0 ? ((automation.metrics.successfulResponses / automation.metrics.totalInteractions) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/automation/${automation._id}/settings`)}
                      className="font-montserrat text-smartops-dark/70 hover:text-smartops-dark"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteAutomation(automation._id)}
                      disabled={loadingActions[automation._id]}
                      className="font-montserrat text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {loadingActions[automation._id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                    {!automation.isActive && (
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleToggleAutomation(automation)}
                        disabled={loadingActions[automation._id]}
                        className="font-montserrat"
                      >
                        {loadingActions[automation._id] ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximamente */}
        <Card className="shadow-md border-smartops-gray">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
              <Zap className="w-5 h-5" />
              Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold font-montserrat text-smartops-dark mb-2">
                  IA Predictiva
                </h4>
                <p className="text-sm text-smartops-dark/70 font-montserrat">
                  Predicción de demanda y comportamiento de clientes
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-semibold font-montserrat text-smartops-dark mb-2">
                  Chatbot Avanzado
                </h4>
                <p className="text-sm text-smartops-dark/70 font-montserrat">
                  Conversaciones naturales con IA integrada
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold font-montserrat text-smartops-dark mb-2">
                  Analytics Avanzado
                </h4>
                <p className="text-sm text-smartops-dark/70 font-montserrat">
                  Métricas detalladas y reportes automáticos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 