import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Palette, 
  User, 
  Mail, 
  Globe, 
  Image, 
  Settings as SettingsIcon,
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
  Phone,
  Upload,
  X,
  Plus,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  MessageCircle,
  Link,
  CreditCard,
  Facebook,
  Video
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import {
  getPublicTenantProfile,
  updateTenant,
  updateTenantTheme,
  Tenant,
  TenantUpdateData
} from '@/lib/tenantApi';
import {
  getProfile,
  createOrUpdateProfile,
  Profile,
  ProfileUpdateData,
  SocialLink
} from '@/lib/profileApi';

export default function Settings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del formulario - Tenant
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

  // Estados del formulario - Profile
  const [profileData, setProfileData] = useState({
    public_name: '',
    bio: '',
    contact: {
      email: '',
      phone: '',
      website: ''
    },
    social_links: [] as SocialLink[],
    custom_fields: {} as Record<string, string>
  });

  const [activeTab, setActiveTab] = useState('tenant');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener datos del tenant
      const tenantResponse = await getPublicTenantProfile();
      
      // Create a full Tenant object with default values for missing properties
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

      // Obtener datos del perfil
      try {
        const profileResponse = await getProfile(tenantResponse.tenant._id);
        setProfile(profileResponse);
        setProfileData({
          public_name: profileResponse.public_name || '',
          bio: profileResponse.bio || '',
          contact: {
            email: profileResponse.contact?.emails?.[0]?.email || '',
            phone: profileResponse.contact?.phones?.[0]?.phone || '',
            website: profileResponse.contact?.website || ''
          },
          social_links: profileResponse.social_links || [],
          custom_fields: profileResponse.custom_fields || {}
        });
        setProfileImagePreview(profileResponse.profileImage || null);
      } catch (profileError) {
        // El perfil no existe aún, usar valores por defecto
        console.log('Perfil no encontrado, usando valores por defecto');
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTenantData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
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

  const handleProfileInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (index: number, field: 'platform' | 'url' | 'display_name', value: string) => {
    setProfileData(prev => ({
      ...prev,
      social_links: prev.social_links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const addSocialLink = () => {
    setProfileData(prev => ({
      ...prev,
      social_links: [...prev.social_links, { platform: 'custom', url: '', display_name: '' }]
    }));
  };

  const removeSocialLink = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  const handleSaveTenant = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      const updateData: TenantUpdateData = {
        name: tenantData.name,
        publicProfile: tenantData.publicProfile,
        features: tenantData.features,
        theme: tenantData.theme,
        isActive: tenantData.isActive
      };
      
      await updateTenant(tenant._id, updateData);
      setSuccess('Configuración del tenant actualizada correctamente');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar la configuración del tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      await createOrUpdateProfile(tenant._id, profileData, profileImageFile || undefined);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const featureIcons = {
    appointments: Calendar,
    crm: Users,
    ecommerce: ShoppingCart,
    inventory: Package,
    orders: ClipboardList,
    products: Briefcase,
    professionals: UserCheck,
    services: Wrench,
    customDomain: Globe
  };

  const featureLabels = {
    appointments: 'Citas',
    crm: 'CRM',
    ecommerce: 'E-commerce',
    inventory: 'Inventario',
    orders: 'Órdenes',
    products: 'Productos',
    professionals: 'Profesionales',
    services: 'Servicios',
    customDomain: 'Dominio Personalizado'
  };

  const socialPlatformIcons = {
    linkedin: Linkedin,
    twitter: Twitter,
    github: Github,
    instagram: Instagram,
    whatsapp: MessageCircle,
    facebook: Facebook,
    website: Globe,
    tiktok: Video,
    custom: Link
  };

  const socialPlatformLabels = {
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    github: 'GitHub',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    website: 'Sitio Web',
    tiktok: 'TikTok',
    custom: 'Personalizado'
  };

  if (loading) {
    return (
      <div className="p-6 bg-transparent min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-smartops-dark/60 font-montserrat">Cargando configuración...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-montserrat text-smartops-dark mb-2">
              Configuración del Sistema
            </h1>
            <p className="text-smartops-dark/60 font-montserrat">
              Gestiona la configuración del tenant y tu perfil personal
            </p>
          </div>
          <Badge variant={tenant?.isActive ? 'default' : 'destructive'} className="font-montserrat">
            {tenant?.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Alertas */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 font-montserrat">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-green-700 font-montserrat">{success}</span>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tenant" className="font-montserrat">
              <Building2 className="w-4 h-4 mr-2" />
              Configuración Tenant
            </TabsTrigger>
            <TabsTrigger value="profile" className="font-montserrat">
              <User className="w-4 h-4 mr-2" />
              Perfil Personal
            </TabsTrigger>
          </TabsList>

          {/* Configuración del Tenant */}
          <TabsContent value="tenant" className="space-y-6">
            {/* Información Básica del Tenant */}
            <Card className="shadow-md border-smartops-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                  <Building2 className="w-5 h-5" />
                  Información del Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="font-montserrat text-smartops-dark">
                      Nombre del Tenant
                    </Label>
                    <Input
                      id="name"
                      value={tenantData.name}
                      onChange={(e) => handleTenantInputChange('name', e.target.value)}
                      className="font-montserrat mt-1"
                      placeholder="nombre-tenant"
                    />
                    <p className="text-xs text-smartops-dark/60 mt-1">
                      URL: {tenantData.name}.smartopsve.com
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="displayName" className="font-montserrat text-smartops-dark">
                      Nombre para Mostrar
                    </Label>
                    <Input
                      id="displayName"
                      value={tenantData.publicProfile.displayName}
                      onChange={(e) => handleTenantInputChange('publicProfile.displayName', e.target.value)}
                      className="font-montserrat mt-1"
                      placeholder="Mi Empresa S.A."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="font-montserrat text-smartops-dark">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={tenantData.publicProfile.description}
                    onChange={(e) => handleTenantInputChange('publicProfile.description', e.target.value)}
                    className="font-montserrat mt-1"
                    placeholder="Describe tu empresa o negocio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="logoUrl" className="font-montserrat text-smartops-dark">
                      URL del Logo
                    </Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      value={tenantData.publicProfile.logoUrl}
                      onChange={(e) => handleTenantInputChange('publicProfile.logoUrl', e.target.value)}
                      className="font-montserrat mt-1"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail" className="font-montserrat text-smartops-dark">
                      Email de Contacto
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={tenantData.publicProfile.contactEmail}
                      onChange={(e) => handleTenantInputChange('publicProfile.contactEmail', e.target.value)}
                      className="font-montserrat mt-1"
                      placeholder="contacto@miempresa.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tema Visual */}
            <Card className="shadow-md border-smartops-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                  <Palette className="w-5 h-5" />
                  Tema Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="font-montserrat text-smartops-dark">
                      Color Primario
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={tenantData.theme.primaryColor}
                        onChange={(e) => handleTenantInputChange('theme.primaryColor', e.target.value)}
                        className="w-16 h-10 p-1 border border-smartops-gray rounded"
                      />
                      <Input
                        type="text"
                        value={tenantData.theme.primaryColor}
                        onChange={(e) => handleTenantInputChange('theme.primaryColor', e.target.value)}
                        className="font-montserrat flex-1"
                        placeholder="#4f46e5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="font-montserrat text-smartops-dark">
                      Color Secundario
                    </Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={tenantData.theme.secondaryColor}
                        onChange={(e) => handleTenantInputChange('theme.secondaryColor', e.target.value)}
                        className="w-16 h-10 p-1 border border-smartops-gray rounded"
                      />
                      <Input
                        type="text"
                        value={tenantData.theme.secondaryColor}
                        onChange={(e) => handleTenantInputChange('theme.secondaryColor', e.target.value)}
                        className="font-montserrat flex-1"
                        placeholder="#f43f5e"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="darkMode"
                    checked={tenantData.theme.darkMode}
                    onCheckedChange={(checked) => handleTenantInputChange('theme.darkMode', checked)}
                  />
                  <Label htmlFor="darkMode" className="font-montserrat text-smartops-dark">
                    Modo Oscuro
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Características del Sistema */}
            <Card className="shadow-md border-smartops-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                  <SettingsIcon className="w-5 h-5" />
                  Características del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(tenantData.features).map(([feature, enabled]) => {
                    const IconComponent = featureIcons[feature as keyof typeof featureIcons];
                    const label = featureLabels[feature as keyof typeof featureLabels];
                    
                    return (
                      <div key={feature} className="flex items-center justify-between p-3 border border-smartops-gray-light rounded-lg">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-smartops-dark/70" />
                          <span className="font-montserrat text-smartops-dark text-sm">{label}</span>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handleFeatureChange(feature, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveTenant}
                disabled={saving}
                variant="smartops"
                className="font-montserrat"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Configuración Tenant'}
              </Button>
            </div>
          </TabsContent>

          {/* Perfil Personal */}
          <TabsContent value="profile" className="space-y-6">
            {/* Información Personal */}
            <Card className="shadow-md border-smartops-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                  <User className="w-5 h-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full border-2 border-smartops-gray-light overflow-hidden bg-gray-100 flex items-center justify-center">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-smartops-dark/40" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      aria-label="Seleccionar imagen de perfil"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 w-full font-montserrat"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Cambiar
                    </Button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="public_name" className="font-montserrat text-smartops-dark">
                        Nombre Público
                      </Label>
                      <Input
                        id="public_name"
                        value={profileData.public_name}
                        onChange={(e) => handleProfileInputChange('public_name', e.target.value)}
                        className="font-montserrat mt-1"
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio" className="font-montserrat text-smartops-dark">
                        Biografía
                      </Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                        className="font-montserrat mt-1"
                        placeholder="Cuéntanos sobre ti..."
                        rows={3}
                        maxLength={1000}
                      />
                      <p className="text-xs text-smartops-dark/60 mt-1">
                        {profileData.bio.length}/1000 caracteres
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card className="shadow-md border-smartops-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                  <Mail className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email" className="font-montserrat text-smartops-dark">
                      Email
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={profileData.contact.email}
                      onChange={(e) => handleProfileInputChange('contact.email', e.target.value)}
                      className="font-montserrat mt-1"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone" className="font-montserrat text-smartops-dark">
                      Teléfono
                    </Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={profileData.contact.phone}
                      onChange={(e) => handleProfileInputChange('contact.phone', e.target.value)}
                      className="font-montserrat mt-1"
                      placeholder="+58 412 123 4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact_website" className="font-montserrat text-smartops-dark">
                    Sitio Web
                  </Label>
                  <Input
                    id="contact_website"
                    type="url"
                    value={profileData.contact.website}
                    onChange={(e) => handleProfileInputChange('contact.website', e.target.value)}
                    className="font-montserrat mt-1"
                    placeholder="https://tuweb.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enlaces Sociales */}
            <Card className="shadow-md border-smartops-gray">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                  <Globe className="w-5 h-5" />
                  Enlaces Sociales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.social_links.map((link, index) => {
                  const IconComponent = socialPlatformIcons[link.platform];
                  
                  return (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 border border-smartops-gray-light rounded-lg">
                      <div>
                        <Label className="font-montserrat text-smartops-dark text-sm">Plataforma</Label>
                        <Select value={link.platform} onValueChange={(value) => handleSocialLinkChange(index, 'platform', value)}>
                          <SelectTrigger className="font-montserrat mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(socialPlatformLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label className="font-montserrat text-smartops-dark text-sm">URL</Label>
                        <Input
                          value={link.url}
                          onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                          className="font-montserrat mt-1"
                          placeholder="https://..."
                        />
                      </div>

                      {link.platform === 'custom' && (
                        <div>
                          <Label className="font-montserrat text-smartops-dark text-sm">Nombre</Label>
                          <Input
                            value={link.display_name || ''}
                            onChange={(e) => handleSocialLinkChange(index, 'display_name', e.target.value)}
                            className="font-montserrat mt-1"
                            placeholder="Mi Red Social"
                          />
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSocialLink(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSocialLink}
                  className="font-montserrat w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Enlace Social
                </Button>
              </CardContent>
            </Card>

            {/* Información NFC */}
            {profile?.nfc && (
              <Card className="shadow-md border-smartops-gray">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-montserrat text-smartops-dark">
                    <CreditCard className="w-5 h-5" />
                    Tarjeta NFC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-montserrat text-smartops-dark">
                        Estado: {profile.nfc.is_linked ? 'Vinculada' : 'No vinculada'}
                      </p>
                      {profile.nfc.card_uid && (
                        <p className="text-sm text-smartops-dark/60 font-montserrat">
                          ID: {profile.nfc.card_uid}
                        </p>
                      )}
                    </div>
                    <Badge variant={profile.nfc.is_linked ? 'default' : 'secondary'} className="font-montserrat">
                      {profile.nfc.is_linked ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                variant="smartops"
                className="font-montserrat"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Perfil'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}