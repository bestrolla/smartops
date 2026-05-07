import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Save, 
  Loader2, 
  RefreshCw, 
  MoveUp, 
  MoveDown,
  Eye,
  EyeOff,
  Settings,
  User,
  BarChart3,
  Briefcase,
  ShoppingBag,
  Star,
  Phone,
  Share2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { profileApi, updateProfilePartial } from '@/lib/profileApi';

interface Section {
  id: string;
  name: string;
  description: string;
  available: boolean;
  enabled: boolean;
  order: number;
  icon: string;
  category: 'basic' | 'conditional';
}

interface SectionsConfig {
  tenant_features: any;
  sections: Record<string, Section>;
  current_order: string[];
  profile_id: string;
}

interface ProfileSectionsOrderEditorProps {
  tenantId: string;
  onSectionsChange?: (sections: SectionsConfig) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  header: <User className="w-4 h-4" />,
  stats: <BarChart3 className="w-4 h-4" />,
  services: <Briefcase className="w-4 h-4" />,
  products: <ShoppingBag className="w-4 h-4" />,
  testimonials: <Star className="w-4 h-4" />,
  contact: <Phone className="w-4 h-4" />,
  social: <Share2 className="w-4 h-4" />,
  appointments: <Calendar className="w-4 h-4" />
};

export const ProfileSectionsOrderEditor: React.FC<ProfileSectionsOrderEditorProps> = ({
  tenantId,
  onSectionsChange
}) => {
  const navigate = useNavigate();
  const [sectionsConfig, setSectionsConfig] = useState<SectionsConfig | null>(null);
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadSectionsConfig();
    }
  }, [tenantId]);

  const loadSectionsConfig = async () => {
    if (!tenantId) {
      console.log('TenantId no disponible, saltando carga de configuración de secciones');
      return;
    }
    
    setLoading(true);
    try {
      const response = await profileApi.getSectionsConfig(tenantId);
      if (response.success && response.data) {
        setSectionsConfig(response.data);
        setSectionOrder(response.data.current_order || []);
        setHasChanges(false);
        onSectionsChange?.(response.data);
      }
    } catch (error) {
      console.error('Error loading sections config:', error);
      toast.error('Error al cargar la configuración de secciones');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (newOrder: string[]) => {
    setSectionOrder(newOrder);
    setHasChanges(true);
    
    // Notificar al componente padre sobre el cambio en el orden
    if (onSectionsChange && sectionsConfig) {
      onSectionsChange({
        ...sectionsConfig,
        current_order: newOrder
      });
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!sectionsConfig) return;

    const newOrder = [...sectionOrder];
    const availableSections = newOrder.filter(sectionId => 
      sectionsConfig.sections[sectionId]?.available
    );

    const currentIndex = availableSections.indexOf(newOrder[index]);
    if (direction === 'up' && currentIndex > 0) {
      [availableSections[currentIndex], availableSections[currentIndex - 1]] = 
      [availableSections[currentIndex - 1], availableSections[currentIndex]];
    } else if (direction === 'down' && currentIndex < availableSections.length - 1) {
      [availableSections[currentIndex], availableSections[currentIndex + 1]] = 
      [availableSections[currentIndex + 1], availableSections[currentIndex]];
    }

    // Reconstruir el orden completo manteniendo las secciones no disponibles al final
    const unavailableSections = newOrder.filter(sectionId => 
      !sectionsConfig.sections[sectionId]?.available
    );
    
    handleOrderChange([...availableSections, ...unavailableSections]);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    if (!sectionsConfig) return;

    const section = sectionsConfig.sections[sectionId];
    if (!section || !section.available) return;

    const tf = sectionsConfig.tenant_features || {};
    const isAllowed = (
      sectionId === 'services' ? tf.services === true :
      sectionId === 'products' ? tf.products === true :
      sectionId === 'appointments' ? tf.appointments === true :
      true
    );

    if (!section.enabled && !isAllowed) {
      toast.error('Esta sección no está disponible en tu plan');
      return;
    }

    const updatedSections = {
      ...sectionsConfig.sections,
      [sectionId]: {
        ...section,
        enabled: !section.enabled
      }
    };

    const nextConfig = {
      ...sectionsConfig,
      sections: updatedSections
    };

    setSectionsConfig(nextConfig);
    setHasChanges(true);
    onSectionsChange?.({
      ...nextConfig,
      current_order: sectionOrder
    });
  };

  const handleSave = async () => {
    if (!sectionsConfig) return;

    setSaving(true);
    try {
      const tf = sectionsConfig.tenant_features || {};
      const profileSectionsPayload = {
        show_stats: sectionsConfig.sections.stats?.enabled ?? true,
        show_services: tf.services === true ? (sectionsConfig.sections.services?.enabled ?? false) : false,
        show_products: tf.products === true ? (sectionsConfig.sections.products?.enabled ?? false) : false,
        show_testimonials: sectionsConfig.sections.testimonials?.enabled ?? true,
        show_contact: sectionsConfig.sections.contact?.enabled ?? true,
        show_social: sectionsConfig.sections.social?.enabled ?? true,
        show_appointments: tf.appointments === true ? (sectionsConfig.sections.appointments?.enabled ?? false) : false
      };

      if (!sectionsConfig.profile_id) {
        const created = await profileApi.createOrUpdateProfile(tenantId, {
          profile_sections: profileSectionsPayload,
          section_order: sectionOrder
        });
        toast.success('⚙️ Secciones guardadas creando el perfil');
        setHasChanges(false);
        await loadSectionsConfig();
        setTimeout(() => navigate('/profile'), 800);
        return;
      }

      await updateProfilePartial(tenantId, { profile_sections: profileSectionsPayload });

      const orderResponse = await profileApi.updateSectionOrder(tenantId, {
        section_order: sectionOrder
      });

      if (orderResponse.success) {
        toast.success('📋 Secciones y orden actualizados');
        setHasChanges(false);
        await loadSectionsConfig();
        setTimeout(() => navigate('/profile'), 800);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          await profileApi.createOrUpdateProfile(tenantId, {
            profile_sections: {
              show_stats: sectionsConfig.sections.stats?.enabled ?? true,
              show_services: (sectionsConfig.tenant_features?.services === true) ? (sectionsConfig.sections.services?.enabled ?? false) : false,
              show_products: (sectionsConfig.tenant_features?.products === true) ? (sectionsConfig.sections.products?.enabled ?? false) : false,
              show_testimonials: sectionsConfig.sections.testimonials?.enabled ?? true,
              show_contact: sectionsConfig.sections.contact?.enabled ?? true,
              show_social: sectionsConfig.sections.social?.enabled ?? true,
              show_appointments: (sectionsConfig.tenant_features?.appointments === true) ? (sectionsConfig.sections.appointments?.enabled ?? false) : false
            },
            section_order: sectionOrder
          });
          toast.success('⚙️ Secciones guardadas creando el perfil');
          setHasChanges(false);
          await loadSectionsConfig();
          setTimeout(() => navigate('/profile'), 800);
          return;
        } catch (fallbackErr) {
          console.error('Error creating/updating sections after 404:', fallbackErr);
          toast.error('❌ Error al guardar secciones (perfil nuevo)');
        }
      } else {
        console.error('Error saving sections order:', error);
        toast.error('❌ Error al guardar el orden de secciones');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSectionsConfig();
  };

  const getSectionStatus = (sectionId: string) => {
    if (!sectionsConfig) return 'unavailable';
    const section = sectionsConfig.sections[sectionId];
    if (!section) return 'unavailable';
    if (!section.available) return 'unavailable';
    return section.enabled ? 'enabled' : 'disabled';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'bg-green-100 text-green-800';
      case 'disabled': return 'bg-gray-100 text-gray-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'enabled': return 'Habilitada';
      case 'disabled': return 'Deshabilitada';
      case 'unavailable': return 'No disponible';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Cargando configuración de secciones...</span>
        </CardContent>
      </Card>
    );
  }

  if (!sectionsConfig) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No se pudo cargar la configuración de secciones</p>
          <Button onClick={loadSectionsConfig} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-smartops-blue" />
          Orden de Secciones del Perfil
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información general */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">¿Cómo funciona?</h4>
          <p className="text-sm text-blue-700">
            Arrastra las secciones para cambiar su orden o usa los botones de flecha. 
            Las secciones se mostrarán en tu perfil público según este orden.
          </p>
        </div>

        {/* Lista de secciones */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Orden de Secciones</Label>
          
          {sectionOrder.map((sectionId, index) => {
            const section = sectionsConfig.sections[sectionId];
            const status = getSectionStatus(sectionId);
            const isAvailable = section?.available;
            const isEnabled = section?.enabled;

            return (
              <div
                key={sectionId}
                className={`p-4 border rounded-lg transition-all ${
                  isAvailable ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    
                    <div className="flex items-center gap-2">
                      {SECTION_ICONS[sectionId] || <Settings className="w-4 h-4" />}
                      <div>
                        <h4 className="font-medium text-sm">
                          {section?.name || sectionId}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {section?.description || 'Sin descripción'}
                        </p>
                      </div>
                    </div>

                    <Badge className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botones de movimiento */}
                    {isAvailable && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === sectionOrder.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {/* Botón de visibilidad */}
                    {isAvailable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSectionVisibility(sectionId)}
                        className={isEnabled ? 'text-green-600' : 'text-gray-400'}
                      >
                        {isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Información de features */}
        {sectionsConfig.tenant_features && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Features Disponibles</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(sectionsConfig.tenant_features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="capitalize">{feature.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex-1 bg-smartops-blue hover:bg-smartops-blue-hover"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Orden
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Perfil
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || !hasChanges}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Indicador de cambios */}
        {hasChanges && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Tienes cambios sin guardar en el orden de secciones
          </div>
        )}
      </CardContent>
    </Card>
  );
};