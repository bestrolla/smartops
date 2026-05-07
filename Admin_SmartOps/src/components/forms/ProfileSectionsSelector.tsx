import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
// Removido Alert - usamos toast notifications
import { 
  Settings, 
  CheckCircle2, 
  Lock, 
  Briefcase, 
  ShoppingCart, 
  Calendar,
  BarChart3,
  Quote,
  Mail,
  Share2,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { 
  getProfileSections, 
  updateProfileSections, 
  ProfileSectionsResponse,
  ProfileSectionsConfig 
} from '@/lib/profileSectionsApi';
import { toast } from 'react-toastify';

interface ProfileSectionsSelectorProps {
  onSectionsChange?: (sections: ProfileSectionsConfig) => void;
}

const SECTION_ICONS = {
  show_services: Briefcase,
  show_products: ShoppingCart,
  show_appointments: Calendar,
  show_stats: BarChart3,
  show_testimonials: Quote,
  show_contact: Mail,
  show_social: Share2
};

export function ProfileSectionsSelector({ onSectionsChange }: ProfileSectionsSelectorProps) {
  const { auth } = useAuth();
  const [sectionsData, setSectionsData] = useState<ProfileSectionsResponse | null>(null);
  const [localConfig, setLocalConfig] = useState<ProfileSectionsConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSections();
  }, [auth.tenantId]);

  const loadSections = async () => {
    if (!auth.tenantId) return;

    try {
      setLoading(true);
      const data = await getProfileSections(auth.tenantId);
      setSectionsData(data);
      setLocalConfig(data.current_configuration);
    } catch (error: any) {
      console.error('Error cargando secciones:', error);
      toast.error('Error al cargar la configuración de secciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (sectionKey: string, enabled: boolean) => {
    const newConfig = {
      ...localConfig,
      [sectionKey]: enabled
    };
    setLocalConfig(newConfig);
    onSectionsChange?.(newConfig);
  };

  const handleSave = async () => {
    if (!auth.tenantId) return;

    try {
      setSaving(true);
      await updateProfileSections(auth.tenantId, localConfig);
      toast.success('Configuración de secciones guardada exitosamente');
      
      // Recargar datos para obtener la configuración actualizada
      await loadSections();
    } catch (error: any) {
      console.error('Error guardando secciones:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar la configuración';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-smartops-blue" />
          <p className="text-smartops-dark/70 font-montserrat">
            Cargando configuración de secciones...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!sectionsData) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-8 text-center">
          <div className="text-center text-red-600">
            <Settings className="w-12 h-12 mx-auto mb-4" />
            <p className="font-montserrat">
              No se pudo cargar la configuración de secciones.
            </p>
            <Button 
              variant="outline" 
              onClick={loadSections}
              className="mt-4 font-montserrat"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2 flex items-center justify-center gap-2">
          <Settings className="w-6 h-6" />
          Configurar Secciones del Perfil
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Personaliza qué secciones se mostrarán en tu perfil público según tu plan actual
        </p>
      </div>

      {/* Información del plan actual */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900 font-montserrat">
            Tu Plan Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sectionsData.tenant_features).map(([feature, enabled]) => (
              <Badge 
                key={feature} 
                variant={enabled ? "default" : "outline"}
                className={`font-montserrat ${
                  enabled 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {enabled ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {feature.charAt(0).toUpperCase() + feature.slice(1)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración de secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(sectionsData.all_sections).map(([sectionKey, section]) => {
          const IconComponent = SECTION_ICONS[sectionKey as keyof typeof SECTION_ICONS];
          const isEnabled = localConfig[sectionKey as keyof ProfileSectionsConfig] ?? false;

          return (
            <Card 
              key={sectionKey}
              className={`transition-all duration-300 ${
                section.available
                  ? 'hover:shadow-md border-gray-200'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      section.available 
                        ? 'bg-smartops-blue/10 text-smartops-blue'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold font-montserrat ${
                          section.available ? 'text-smartops-dark' : 'text-gray-400'
                        }`}>
                          {section.label}
                        </h3>
                        {!section.available && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      <p className={`text-sm font-montserrat ${
                        section.available ? 'text-smartops-dark/70' : 'text-gray-400'
                      }`}>
                        {section.description}
                      </p>
                      
                      {!section.available && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          No disponible en tu plan
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleSectionToggle(sectionKey, checked)}
                    disabled={!section.available}
                    className={section.available ? '' : 'opacity-50'}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información sobre el guardado */}
      <div className="flex justify-center pt-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-800 font-montserrat text-center">
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              <strong>Configuración lista:</strong> Estas secciones se guardarán cuando completes tu perfil al final del formulario.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 font-montserrat">
            <strong>💡 Consejo:</strong> Las secciones que actives aquí se mostrarán en tu perfil público. 
            Puedes cambiar esta configuración en cualquier momento. Las secciones marcadas con 
            <Lock className="w-4 h-4 inline mx-1" /> requieren actualizar tu plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
