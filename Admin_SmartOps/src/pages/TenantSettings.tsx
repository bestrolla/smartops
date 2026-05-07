import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Palette, 
  Save,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  ShoppingCart,
  Package,
  ClipboardList,
  Briefcase,
  UserCheck,
  Wrench,
  Globe,
  Copy,
  Check,
  CreditCard,
  Crown,
  RefreshCw,
  X,
  Pipette,
  Clock,
  AlertTriangle,
  Upload
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  getPublicTenantProfile,
  updateTenant,
  Tenant,
  TenantUpdateData
} from '@/lib/tenantApi';
import { 
  getCurrentSubscription, 
  getSubscriptionStatus, 
  getDaysUntilExpiration,
  requiresPaymentVerification,
  getFeatureStatusForPendingSubscription,
  Subscription 
} from '@/lib/subscriptionsApi';
import { Plan } from '@/lib/plansApi';
import { PlanChangeForm } from '@/components/forms/PlanChangeForm';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onColorSelect: (color: string) => void;
  title: string;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  currentColor,
  onColorSelect,
  title
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [inputValue, setInputValue] = useState(currentColor);

  // Colores principales como en Photoshop
  const mainColors = [
    // Rojos
    '#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC',
    '#CC0000', '#CC3333', '#CC6666', '#CC9999', '#FFDDDD',
    '#990000', '#993333', '#996666', '#999999', '#FFEEEE',
    
    // Naranjas
    '#FF6600', '#FF7F00', '#FF9900', '#FFB366', '#FFCC99',
    '#CC5200', '#CC6600', '#CC7A00', '#CC8F33', '#CCAA66',
    '#993D00', '#994D00', '#995C00', '#996B33', '#998066',
    
    // Amarillos
    '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC',
    '#CCCC00', '#CCCC33', '#CCCC66', '#CCCC99', '#CCCCAA',
    '#999900', '#999933', '#999966', '#999980', '#999999',
    
    // Verdes
    '#00FF00', '#33FF33', '#66FF66', '#99FF99', '#CCFFCC',
    '#00CC00', '#33CC33', '#66CC66', '#99CC99', '#AACCAA',
    '#009900', '#339933', '#669966', '#809980', '#99AA99',
    
    // Azules
    '#0000FF', '#3333FF', '#6666FF', '#9999FF', '#CCCCFF',
    '#0000CC', '#3333CC', '#6666CC', '#9999CC', '#AAAACC',
    '#000099', '#333399', '#666699', '#808099', '#9999AA',
    
    // Violetas
    '#6600FF', '#7F00FF', '#9900FF', '#B366FF', '#CC99FF',
    '#5200CC', '#6600CC', '#7A00CC', '#8F33CC', '#AA66CC',
    '#3D0099', '#4D0099', '#5C0099', '#6B3399', '#806699',
    
    // Grises y neutros
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
    '#111111', '#444444', '#777777', '#AAAAAA', '#DDDDDD',
    '#222222', '#555555', '#888888', '#BBBBBB', '#EEEEEE',
    '#FFFFFF', '#F5F5F5', '#F0F0F0', '#E5E5E5', '#FAFAFA'
  ];

  const popularColors = [
    '#4F46E5', '#7C3AED', '#EF4444', '#F59E0B', '#10B981',
    '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#EAB308', '#22C55E', '#6366F1', '#A855F7',
    '#DB2777', '#0EA5E9', '#65A30D', '#DC2626', '#CA8A04'
  ];

  useEffect(() => {
    setSelectedColor(currentColor);
    setInputValue(currentColor);
  }, [currentColor, isOpen]);

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    setInputValue(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setSelectedColor(value);
    }
  };

  const handleSave = () => {
    onColorSelect(selectedColor);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Color actual y nuevo */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-sm font-montserrat text-white block mb-2">Color actual</Label>
            <div
              className="w-full h-16 rounded-lg border-2 border-gray-500"
              style={{ backgroundColor: currentColor }}
            />
            <p className="text-xs font-mono text-center mt-1 text-gray-300">
              {currentColor}
            </p>
          </div>
          <div className="flex-1">
            <Label className="text-sm font-montserrat text-white block mb-2">Nuevo color</Label>
            <div
              className="w-full h-16 rounded-lg border-2 border-blue-400 shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
            <p className="text-xs font-mono text-center mt-1 text-blue-300 font-semibold">
              {selectedColor}
            </p>
          </div>
        </div>

        {/* Input hexadecimal */}
        <div>
          <Label className="text-sm font-montserrat text-white block mb-2">Código hexadecimal</Label>
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="font-mono bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
            placeholder="#4F46E5"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>

        {/* Colores populares */}
        <div>
          <Label className="text-sm font-montserrat text-white block mb-3">Colores populares</Label>
          <div className="grid grid-cols-10 gap-2">
            {popularColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                  selectedColor === color 
                    ? 'border-blue-400 shadow-lg ring-2 ring-blue-400/30' 
                    : 'border-gray-500 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Paleta completa */}
        <div>
          <Label className="text-sm font-montserrat text-white block mb-3">Paleta completa de colores</Label>
          <div className="grid grid-cols-12 gap-1 max-h-60 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-800">
            {mainColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                type="button"
                className={`w-6 h-6 border transition-all duration-150 hover:scale-125 hover:z-10 relative ${
                  selectedColor === color 
                    ? 'border-2 border-blue-400 shadow-lg ring-1 ring-blue-400/50' 
                    : 'border-gray-500 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-montserrat bg-transparent border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-400"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-montserrat border-0"
          >
            <Check className="w-4 h-4 mr-2" />
            Seleccionar Color
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Label className="font-montserrat text-smartops-dark">{label}</Label>
      
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-smartops-blue transition-colors shadow-sm"
          style={{ backgroundColor: color }}
          onClick={() => setIsModalOpen(true)}
          title="Click para abrir selector de color"
        />
        
        <div className="flex-1">
          <Input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono"
            placeholder="#4F46E5"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="px-3"
        >
          <Pipette className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs font-montserrat text-smartops-dark/60">
        Click en el color o en el ícono para abrir el selector avanzado
      </p>

      <ColorPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentColor={color}
        onColorSelect={onChange}
        title={`Seleccionar ${label}`}
      />
    </div>
  );
};

export default function TenantSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para suscripción
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [showPlanChangeForm, setShowPlanChangeForm] = useState(false);

  const [tenantData, setTenantData] = useState({
    name: '',
    publicProfile: {
      displayName: '',
      description: '',
      logoUrl: '',
      contactEmail: ''
    },
    theme: {
      primaryColor: '#4f46e5',
      secondaryColor: '#f43f5e',
      darkMode: false
    },
    features: {
      appointments: false,
      crm: false,
      ecommerce: false,
      inventory: false,
      orders: false,
      products: false,
      professionals: false,
      services: false,
      customDomain: false
    },
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchSubscription();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tenantResponse = await getPublicTenantProfile();
      
      // Create a full Tenant object from the TenantResponse
      const fullTenant: Tenant = {
        _id: tenantResponse.tenant._id,
        name: tenantResponse.tenant.name,
        isActive: tenantResponse.tenant.isActive,
        publicProfile: {
          displayName: tenantResponse.tenant.displayName || '',
          description: '',
          logoUrl: '',
          contactEmail: ''
        },
        theme: {
          primaryColor: '#4f46e5',
          secondaryColor: '#f43f5e',
          darkMode: false
        },
        features: {
          appointments: false,
          crm: false,
          ecommerce: false,
          inventory: false,
          orders: false,
          products: false,
          professionals: false,
          services: false,
          customDomain: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTenant(fullTenant);
      setTenantData({
        name: fullTenant.name,
        publicProfile: {
          displayName: fullTenant.publicProfile?.displayName || '',
          description: fullTenant.publicProfile?.description || '',
          logoUrl: fullTenant.publicProfile?.logoUrl || '',
          contactEmail: fullTenant.publicProfile?.contactEmail || ''
        },
        theme: {
          primaryColor: fullTenant.theme?.primaryColor || '#4f46e5',
          secondaryColor: fullTenant.theme?.secondaryColor || '#f43f5e',
          darkMode: fullTenant.theme?.darkMode || false
        },
        features: {
          appointments: fullTenant.features?.appointments || false,
          crm: fullTenant.features?.crm || false,
          ecommerce: fullTenant.features?.ecommerce || false,
          inventory: fullTenant.features?.inventory || false,
          orders: fullTenant.features?.orders || false,
          products: fullTenant.features?.products || false,
          professionals: fullTenant.features?.professionals || false,
          services: fullTenant.features?.services || false,
          customDomain: fullTenant.features?.customDomain || false
        },
        isActive: fullTenant.isActive
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    setLoadingSubscription(true);
    setSubscriptionError(null);
    try {
      const subscriptionData = await getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (err: any) {
      setSubscriptionError(err.response?.data?.message || 'Error al cargar la suscripción');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTenantData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }));
    } else {
      setTenantData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFeatureChange = (feature: string, enabled: boolean) => {
    setTenantData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: enabled
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!tenant) {
        throw new Error('No hay datos del tenant');
      }

      const updateData: TenantUpdateData = {
        name: tenantData.name,
        publicProfile: tenantData.publicProfile,
        theme: tenantData.theme,
        features: tenantData.features,
        isActive: tenantData.isActive
      };

      const updatedTenant = await updateTenant(tenant._id, updateData);
      setTenant(updatedTenant);
      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChangeSuccess = (newSubscription: Subscription) => {
    setSubscription(newSubscription);
    setSuccess('Plan actualizado exitosamente');
    setTimeout(() => setSuccess(null), 3000);
    // Recargar los datos del tenant para actualizar las features
    fetchData();
  };

  const featuresList = [
    { key: 'appointments', label: 'Citas', icon: Calendar },
    { key: 'crm', label: 'CRM', icon: Users },
    { key: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
    { key: 'inventory', label: 'Inventario', icon: Package },
    { key: 'orders', label: 'Órdenes', icon: ClipboardList },
    { key: 'products', label: 'Productos', icon: Package },
    { key: 'professionals', label: 'Profesionales', icon: UserCheck },
    { key: 'services', label: 'Servicios', icon: Wrench },
    { key: 'customDomain', label: 'Dominio Personalizado', icon: Globe }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-smartops-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <Building2 className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold font-montserrat">Configuración del Tenant</h1>
              <p className="text-blue-100 font-montserrat">Gestiona la configuración general de tu organización</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-montserrat">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-montserrat">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 font-montserrat">
                <Building2 className="w-6 h-6" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="font-montserrat text-smartops-dark">Nombre de la Organización</Label>
                <Input
                  value={tenantData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="mt-2 font-montserrat"
                  placeholder="Mi Empresa"
                />
              </div>

              <div>
                <Label className="font-montserrat text-smartops-dark">Nombre Público</Label>
                <Input
                  value={tenantData.publicProfile.displayName}
                  onChange={(e) => handleInputChange('publicProfile.displayName', e.target.value)}
                  className="mt-2 font-montserrat"
                  placeholder="Mi Empresa - Soluciones Digitales"
                />
              </div>

              <div>
                <Label className="font-montserrat text-smartops-dark">Descripción</Label>
                <Textarea
                  value={tenantData.publicProfile.description}
                  onChange={(e) => handleInputChange('publicProfile.description', e.target.value)}
                  className="mt-2 font-montserrat"
                  placeholder="Descripción de la empresa..."
                  rows={3}
                />
              </div>

              <div>
                <Label className="font-montserrat text-smartops-dark">Email de Contacto</Label>
                <Input
                  type="email"
                  value={tenantData.publicProfile.contactEmail}
                  onChange={(e) => handleInputChange('publicProfile.contactEmail', e.target.value)}
                  className="mt-2 font-montserrat"
                  placeholder="contacto@miempresa.com"
                />
              </div>

              <div>
                <Label className="font-montserrat text-smartops-dark">Logo URL</Label>
                <Input
                  value={tenantData.publicProfile.logoUrl}
                  onChange={(e) => handleInputChange('publicProfile.logoUrl', e.target.value)}
                  className="mt-2 font-montserrat"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 font-montserrat">
                <Palette className="w-6 h-6" />
                Tema Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <ColorPicker
                color={tenantData.theme.primaryColor}
                onChange={(color) => handleInputChange('theme.primaryColor', color)}
                label="Color Primario"
              />

              <ColorPicker
                color={tenantData.theme.secondaryColor}
                onChange={(color) => handleInputChange('theme.secondaryColor', color)}
                label="Color Secundario"
              />

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <Label className="font-montserrat text-smartops-dark">Modo Oscuro</Label>
                  <p className="text-sm text-smartops-dark/60 font-montserrat">Habilita el tema oscuro para toda la aplicación</p>
                </div>
                <Switch
                  checked={tenantData.theme.darkMode}
                  onCheckedChange={(checked) => handleInputChange('theme.darkMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <CreditCard className="w-6 h-6" />
              Plan de Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingSubscription ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-smartops-blue mr-2" />
                <span className="font-montserrat text-smartops-dark">Cargando suscripción...</span>
              </div>
            ) : subscriptionError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-montserrat text-sm">{subscriptionError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSubscription}
                  className="mt-3 font-montserrat"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            ) : subscription ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold font-montserrat text-smartops-dark">
                    {subscription.plan.name}
                  </h3>
                  <p className="text-smartops-dark/60 font-montserrat text-lg">
                    ${subscription.plan.price} {subscription.plan.currency === 'USD' ? '/mes' : `/${subscription.plan.currency}`}
                  </p>
                  <div className="mt-4">
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-montserrat font-semibold ${
                      getSubscriptionStatus(subscription).color === 'green' 
                        ? 'bg-green-100 text-green-800'
                        : getSubscriptionStatus(subscription).color === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : getSubscriptionStatus(subscription).color === 'blue'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getSubscriptionStatus(subscription).label}
                    </div>
                  </div>
                  <div className="mt-4 text-sm font-montserrat text-smartops-dark/70">
                    <p>{getSubscriptionStatus(subscription).description}</p>
                    {subscription.status === 'active' && (
                      <p className="mt-2">
                        <span className="font-semibold">
                          {getDaysUntilExpiration(subscription)} días restantes
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Anuncio de verificación pendiente */}
                  {requiresPaymentVerification(subscription) && (
                    <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-800 font-montserrat mb-2">
                            Verificación de pago pendiente
                          </h4>
                          <p className="text-orange-700 font-montserrat text-sm mb-3">
                            Para activar tu nuevo plan, necesitas adjuntar el comprobante de pago. 
                            Las características aparecen en estado pendiente hasta la verificación.
                          </p>
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white font-montserrat"
                            onClick={() => setShowPlanChangeForm(true)} // NUEVO: abrir modal de pago
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Adjuntar Comprobante
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <h4 className="font-semibold font-montserrat text-smartops-dark text-lg mb-4">
                    Características incluidas en tu plan:
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(subscription.plan.features).map(([feature, enabled]) => {
                      const featureInfo = featuresList.find(f => f.key === feature);
                      if (!featureInfo) return null;
                      const Icon = featureInfo.icon;
                      
                      const isPending = requiresPaymentVerification(subscription);
                      const featureStyle = getFeatureStatusForPendingSubscription(enabled, isPending);
                      
                      return (
                        <div key={feature} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${featureStyle.bgColor}`}>
                          {featureStyle.icon === 'Check' ? (
                            <Check className={`w-5 h-5 ${featureStyle.textColor}`} />
                          ) : featureStyle.icon === 'Clock' ? (
                            <Clock className={`w-5 h-5 ${featureStyle.textColor}`} />
                          ) : (
                            <X className={`w-5 h-5 ${featureStyle.textColor}`} />
                          )}
                          <Icon className="w-5 h-5 text-smartops-dark/60" />
                          <span className={`text-sm font-montserrat ${featureStyle.textColor}`}>
                            {featureInfo.label}
                            {isPending && enabled && (
                              <span className="block text-xs text-orange-500 mt-1">
                                Pendiente
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6">
                    <Button
                      onClick={() => setShowPlanChangeForm(true)}
                      className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover hover:from-smartops-blue-hover hover:to-smartops-blue text-white font-montserrat px-6 py-3"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Cambiar Plan
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-smartops-dark/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold font-montserrat text-smartops-dark mb-2">
                  No hay suscripción activa
                </h3>
                <p className="text-smartops-dark/60 font-montserrat text-sm mb-6">
                  Selecciona un plan para comenzar a usar todas las funcionalidades de SmartOps
                </p>
                <Button 
                  onClick={() => setShowPlanChangeForm(true)}
                  className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover hover:from-smartops-blue-hover hover:to-smartops-blue text-white font-montserrat px-6 py-3"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Seleccionar Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Briefcase className="w-6 h-6" />
              Módulos del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuresList.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 bg-smartops-gray-light rounded-lg border border-smartops-gray"
                >
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-5 h-5 text-smartops-blue" />
                    <span className="font-montserrat text-smartops-dark">{feature.label}</span>
                  </div>
                  <Switch
                    checked={tenantData.features[feature.key as keyof typeof tenantData.features]}
                    onCheckedChange={(checked) => handleFeatureChange(feature.key, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover hover:from-smartops-blue-hover hover:to-smartops-blue text-white px-8 py-3 rounded-lg font-montserrat font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>

        <PlanChangeForm
          isOpen={showPlanChangeForm}
          onClose={() => setShowPlanChangeForm(false)}
          onSuccess={handlePlanChangeSuccess}
          currentPlan={subscription?.plan}
          preselectedPlanId={subscription?.status === 'pending' ? subscription?.plan?._id : undefined} // NUEVO: preseleccionar plan si está pendiente
        />
      </div>
    </div>
  );
}