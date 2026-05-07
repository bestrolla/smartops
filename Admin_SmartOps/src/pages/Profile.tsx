import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  User, 
  Mail, 
  Phone, 
  Globe, 
  Image as ImageIcon, 
  Save,
  AlertCircle,
  CheckCircle2,
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
  Eye,
  Palette,
  Settings,
  ArrowRight,
  ArrowLeft,
  Camera,
  Contact,
  Link2,
  Smartphone,
  Loader2,
  Quote,
  Award,
  Briefcase,
  Calendar,
  Edit3,
  ExternalLink,
  Sparkles,
  MapPin,
  Facebook,
  Youtube,
  Music,
  Video,
  Heart,
  Share2,
  MessageSquare,
  Zap,
  Users,
  Gamepad2,
  BookOpen,
  FileText,
  DollarSign,
  Headphones,
  Radio
} from 'lucide-react';
import {
  getProfile,
  createOrUpdateProfile,
  Profile as ProfileType,
  ProfileUpdateData,
  updateContactInfo,
  getPublicProfileBySlug
} from '@/lib/profileApi';
import { getPublicTenantProfile, type TenantPublicProfileResponse } from '@/lib/tenantApi';
import { ProfileThemeSelector } from '@/components/ProfileThemeSelector';
import { ProfileStepperForm } from '@/components/forms/ProfileStepperForm';
import { ProfileSectionsSelector } from '@/components/forms/ProfileSectionsSelector';
import ProfileColorsEditor from '@/components/forms/ProfileColorsEditor';
import { ProfileContactEditor } from '@/components/forms/ProfileContactEditor';
import { ProfileSectionsOrderEditor } from '@/components/forms/ProfileSectionsOrderEditor';
import { TestimonialsEditor } from '@/components/forms/TestimonialsEditor';
import { LocationEditor } from '@/components/forms/LocationEditor';
import { AppointmentEditor } from '@/components/forms/AppointmentEditor';
import { MobileProfilePreview } from '@/components/forms/MobileProfilePreview';
import { ProfileSectionsConfig } from '@/lib/profileSectionsApi';
import { profileThemesApi, ProfileTheme } from '@/lib/profileThemesApi';
import { toast } from 'sonner';

import { ProfileFormData, SocialLink, SocialPlatform } from '@/types/profile';

interface ProfileTemplate {
  id: string;
  name: string;
  description: string;
  profession: string;
  style: string;
  image: string;
  preview_url: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  layout: {
    header: 'dark' | 'light' | 'gradient-blue' | 'gradient-art';
    stats: 'minimal' | 'corporate' | 'medical' | 'creative';
    services: 'minimal' | 'corporate' | 'medical' | 'creative';
    testimonials: 'minimal' | 'corporate' | 'medical' | 'creative';
  };
}

const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    id: 'carlos-carrasco',
    name: 'Carlos Carrasco',
    description: 'Diseñador Web - Estilo minimalista y elegante',
    profession: 'Diseñador Web',
    style: 'Minimalista y Elegante',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    preview_url: '/carlos-carrasco',
    colors: {
      primary: '#111111',
      secondary: '#1a1a1a',
      accent: '#ffffff'
    },
    layout: {
      header: 'dark',
      stats: 'minimal',
      services: 'minimal',
      testimonials: 'minimal'
    }
  },
  {
    id: 'santiago-oliveira',
    name: 'Santiago Oliveira',
    description: 'Consultor Digital - Estilo corporativo y limpio',
    profession: 'Consultor Digital',
    style: 'Corporativo y Limpio',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
    preview_url: '/santiago-oliveira',
    colors: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      accent: '#0f172a'
    },
    layout: {
      header: 'light',
      stats: 'corporate',
      services: 'corporate',
      testimonials: 'corporate'
    }
  },
  {
    id: 'elena-ruiz',
    name: 'Dra. Elena Ruiz',
    description: 'Médico Especialista - Estilo profesional médico',
    profession: 'Médico Especialista',
    style: 'Profesional Médico',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    preview_url: '/elena-ruiz',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#38bdf8'
    },
    layout: {
      header: 'gradient-blue',
      stats: 'medical',
      services: 'medical',
      testimonials: 'medical'
    }
  },
  {
    id: 'marco-torres',
    name: 'Marco Torres',
    description: 'Artista Visual - Estilo creativo y dinámico',
    profession: 'Artista Visual',
    style: 'Creativo y Dinámico',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    preview_url: '/marco-torres',
    colors: {
      primary: '#6366f1',
      secondary: '#818cf8',
      accent: '#4f46e5'
    },
    layout: {
      header: 'gradient-art',
      stats: 'creative',
      services: 'creative',
      testimonials: 'creative'
    }
  }
];

export default function Profile() {
  const navigate = useNavigate(); // <-- Mueve esto al inicio del componente

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('sections');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de carga individuales para cada sección
  const [sectionLoading, setSectionLoading] = useState<{[key: string]: boolean}>({
    basic: false,
    colors: false,
    contact: false,
    sections: false,
    testimonials: false,
    location: false
  });

  // Estados simplificados
  const [selectedTemplate, setSelectedTemplate] = useState<ProfileTemplate | null>(null);
  const [sectionsConfig, setSectionsConfig] = useState<ProfileSectionsConfig>({
    show_stats: true,
    show_testimonials: true,
    show_contact: true,
    show_social: true,
    show_services: false,
    show_products: false,
    show_appointments: false  // Deshabilitado por defecto
  });

  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social'
  ]);

  const [profileData, setProfileData] = useState<ProfileFormData>({
    public_name: '',
    bio: '',
    title: '',
    specialty: '',
    contact: {
      emails: [],
      phones: [],
      website: ''
    },
    social_links: [],
    custom_fields: {},
    profile_image: '',
    theme_color: '#4f46e5',
    theme: {
      template_id: '',
      primary_color: '#4f46e5',
      secondary_color: '#7c3aed',
      accent_color: '#ffffff',
      font_family: 'Montserrat',
      layout_style: 'modern'
    },
    stats: [],
    testimonials: [],
    services: [],
    nfc: {
      card_uid: '',
      is_linked: false
    },
    appointment_config: {
      enabled: true, // ✅ Habilitado por defecto
      title: 'Agendar Cita',
      subtitle: '¿Listo para comenzar?',
      description: 'Agenda una consulta gratuita y descubre cómo puedo ayudarte a transformar tu presencia digital.',
      button_text: 'Agendar Consulta Gratuita',
      availability_message: 'Horarios disponibles: Lunes a Viernes de 9:00 AM a 6:00 PM'
    }
  });

  const [currentSocialLink, setCurrentSocialLink] = useState<SocialLink>({
    platform: 'linkedin',
    url: '',
    display_name: ''
  });

  // Estados para manejar emails y teléfonos
  const [currentEmail, setCurrentEmail] = useState({
    email: '',
    type: 'personal' as 'personal' | 'business' | 'other',
    label: ''
  });

  const [currentPhone, setCurrentPhone] = useState({
    phone: '',
    type: 'mobile' as 'mobile' | 'landline' | 'whatsapp' | 'other',
    label: ''
  });

  useEffect(() => {
    fetchData();
  }, []);



  const fetchData = async () => {
    setLoading(true);
    try {
      let tenantResponse: TenantPublicProfileResponse;
      const storedSlug = localStorage.getItem('tenantSlug') || undefined;
      const pathSlug = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[0] : undefined;
      const reserved = new Set(['profile','dashboard','admin','settings','sign-in','sign-up']);
      const validSlug = (s?: string) => !!s && !reserved.has(s) && s.length >= 3;
      const slug = validSlug(storedSlug) ? storedSlug : (validSlug(pathSlug) ? pathSlug : undefined);

      if (slug) {
        const publicResp = await getPublicProfileBySlug(slug);
        const pd = publicResp.data;
        tenantResponse = {
          tenant: {
            _id: pd.tenant.id,
            name: pd.tenant.name,
            slug: pd.tenant.slug,
            displayName: pd.tenant.name,
            businessType: (pd.tenant as any).businessType,
            description: pd.tenant.description,
            logoUrl: undefined,
            isActive: true,
            theme: pd.tenant.theme as any,
            features: pd.tenant.features as any,
            createdAt: '',
            updatedAt: ''
          },
          profile: pd.profile as any,
          services: pd.services as any[],
          products: pd.products as any[],
          testimonials: (pd.profile?.testimonials || []) as any[],
          stats: (pd.profile?.stats || []) as any[],
          theme: pd.profile?.theme as any,
          professionals: [],
          gallery: []
        };
      } else {
        tenantResponse = await getPublicTenantProfile();
      }
      
      if (!tenantResponse?.tenant?._id) {
        throw new Error('No se pudo obtener la información del tenant');
      }
      
      setTenantId(tenantResponse.tenant._id);
      
      if (tenantResponse.profile) {
        setProfile(tenantResponse.profile);
        setHasExistingProfile(true);
        
        // Seleccionar template si existe
        let selectedTemplateData = null;
        if (tenantResponse.profile.theme?.template_id) {
          const template = PROFILE_TEMPLATES.find(t => t.id === tenantResponse.profile.theme?.template_id);

          if (template) {
            selectedTemplateData = template;
            setSelectedTemplate(template);
          } else {
            // Si no se encuentra el template, usar uno por defecto
            selectedTemplateData = PROFILE_TEMPLATES[0];
            setSelectedTemplate(PROFILE_TEMPLATES[0]);
          }
        } else {
          // Si no hay template_id, usar uno por defecto
          selectedTemplateData = PROFILE_TEMPLATES[0];
          setSelectedTemplate(PROFILE_TEMPLATES[0]);
        }
        console.log(tenantResponse)
        // Cargar datos del perfil existente
        const existingProfileData = {
          public_name: tenantResponse.profile.public_name || '',
          bio: tenantResponse.profile.bio || '',
          title: tenantResponse.profile.title || '',
          specialty: tenantResponse.profile.specialty || '',
          contact: {
            emails: tenantResponse.profile.contact?.emails || [],
            phones: tenantResponse.profile.contact?.phones || [],
            website: tenantResponse.profile.contact?.website || ''
          },
          social_links: tenantResponse.profile.social_links || [],
          custom_fields: tenantResponse.profile.custom_fields || {},
          profile_image: (() => {
            let imagePath = tenantResponse.profile.profileImage || tenantResponse.profile.profile_image || selectedTemplateData?.image || '';
            
            // Si la imagen no existe, usar una imagen válida
            if (imagePath.includes('2e5a1fd5-ee1e-410e-9157-39b5d371d303.jpg')) {
              imagePath = '/uploads/tenants/common/profiles/37bab2b1-81ad-4722-867a-f19ea22b80bd.jpg';
            }
            
            return imagePath;
          })(),
          theme_color: tenantResponse.profile.theme?.primary_color || '#4f46e5',
          theme: {
            template_id: tenantResponse.profile.theme?.template_id || '',
            primary_color: tenantResponse.profile.theme?.primary_color || selectedTemplateData?.colors.primary || '#4f46e5',
            secondary_color: tenantResponse.profile.theme?.secondary_color || selectedTemplateData?.colors.secondary || '#7c3aed',
            accent_color: tenantResponse.profile.theme?.accent_color || selectedTemplateData?.colors.accent || '#ffffff',
            font_family: tenantResponse.profile.theme?.font_family || 'Montserrat',
            layout_style: tenantResponse.profile.theme?.layout_style || 'modern'
          },
          stats: tenantResponse.profile.stats || [],
          testimonials: tenantResponse.profile.testimonials || [],
          services: tenantResponse.profile.services || [],
          location: tenantResponse.profile.location || undefined,
          nfc: {
            card_uid: tenantResponse.profile.nfc?.card_uid || '',
            is_linked: tenantResponse.profile.nfc?.is_linked || false
          },
          appointment_config: (() => {
            const dbConfig = tenantResponse.profile.appointment_config;
            const defaultConfig = {
              enabled: true, // ✅ Habilitado por defecto
              title: 'Agendar Cita',
              subtitle: '¿Listo para comenzar?',
              description: 'Agenda una consulta gratuita y descubre cómo puedo ayudarte a transformar tu presencia digital.',
              button_text: 'Agendar Consulta Gratuita',
              availability_message: 'Horarios disponibles: Lunes a Viernes de 9:00 AM a 6:00 PM'
            };
            
            const finalConfig = dbConfig ? { ...defaultConfig, ...dbConfig } : defaultConfig;
            console.log('🏗️ Profile.tsx appointment_config from DB:', dbConfig);
            console.log('🏗️ Profile.tsx final appointment_config:', finalConfig);
            return finalConfig;
          })()
        };
        

        
        // Debug de imagen eliminado para limpiar consola
        setProfileData(existingProfileData);
        
        // Configurar secciones
        if (tenantResponse.profile.profile_sections) {
          console.log('🏗️ Profile.tsx loading sectionsConfig from DB:', tenantResponse.profile.profile_sections);
          // Mantener la configuración de la DB, incluyendo show_appointments
          setSectionsConfig(tenantResponse.profile.profile_sections);
        } else {
          console.log('🏗️ Profile.tsx no sectionsConfig in DB, using defaults');
        }

        // Configurar orden de secciones
        if (tenantResponse.profile.section_order) {
          setSectionOrder(tenantResponse.profile.section_order);
        }
      } else {
        // No hay perfil existente. Permanecer en /profile y precargar el tema seleccionado si existe en localStorage
        try {
          const savedThemeStr = localStorage.getItem('selectedTheme');
          if (savedThemeStr) {
            const theme = JSON.parse(savedThemeStr) as ProfileTemplate;
            setSelectedTemplate(theme);
            setProfileData(prev => ({
              ...prev,
              theme_color: theme.colors.primary,
              theme: {
                ...prev.theme,
                template_id: theme.id,
                primary_color: theme.colors.primary,
                secondary_color: theme.colors.secondary,
                accent_color: theme.colors.accent,
                font_family: prev.theme.font_family || 'Montserrat',
                layout_style: theme.layout.header
              }
            }));
          }
        } catch (e) {
          console.warn('No se pudo cargar el tema guardado desde localStorage:', e);
        }
        setHasExistingProfile(false);
        // No redirigir; permitir que el usuario edite y guarde
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = (theme: ProfileTheme) => {
    setSelectedTemplate(theme as any);
    setProfileData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        template_id: theme.id,
        primary_color: theme.colors.primary,
        secondary_color: theme.colors.secondary,
        accent_color: theme.colors.accent,
        layout_style: theme.layout.header
      }
    }));
  };

  const handleThemeApply = async (themeId: string) => {
    try {
      if (!tenantId) return;
      const response = await profileThemesApi.applyThemeToProfile(tenantId, themeId);
      if (response.success) {
        // Recargar el perfil para obtener los datos actualizados
        await fetchData();
        toast.success('Tema aplicado exitosamente');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Error al aplicar el tema');
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      console.log('📸 Procesando imagen:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);

      if (!file.type.match('image.*')) {
        throw new Error('Solo se permiten imágenes');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo excede el límite de 5MB');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        console.log('✅ Imagen convertida a base64, longitud:', imageUrl.length);
        setProfileData(prev => ({
          ...prev,
          profile_image: imageUrl
        }));
        setSuccess('✅ Imagen cargada correctamente. Haz clic en "Guardar Información Básica" para subirla al servidor.');
      };
      reader.onerror = () => {
        console.error('❌ Error al leer el archivo');
        setError('Error al leer el archivo de imagen');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('❌ Error en handleImageUpload:', error);
      setError(error.message || 'Error al procesar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const formatUrl = (url: string): string => {
    if (!url) return url;
    
    // Si ya tiene protocolo, devolverlo tal como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si empieza con www., agregar https://
    if (url.startsWith('www.')) {
      return `https://${url}`;
    }
    
    // Si contiene un punto y no tiene protocolo, agregar https://
    if (url.includes('.') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      return `https://${url}`;
    }
    
    return url;
  };

  const handleSocialLinkChange = (field: 'platform' | 'url' | 'display_name', value: string) => {
    let processedValue = value;
    
    // Auto-formatear URL cuando se ingresa
    if (field === 'url') {
      processedValue = formatUrl(value);
    }
    
    setCurrentSocialLink(prev => ({
      ...prev,
      [field]: field === 'platform' ? processedValue as SocialLink['platform'] : processedValue
    }));
  };

  const validateUrl = (url: string): boolean => {
    // Patrón flexible para URLs - permite con o sin protocolo
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  };

  const addSocialLink = () => {
    if (!currentSocialLink.url) {
      setError('La URL es requerida para el enlace social');
      return;
    }

    // Validar formato de URL
    if (!validateUrl(currentSocialLink.url)) {
      setError('Por favor ingresa una URL válida (ej: ejemplo.com o https://ejemplo.com)');
      return;
    }

    // Formatear URL antes de agregar
    const formattedLink = {
      ...currentSocialLink,
      url: formatUrl(currentSocialLink.url)
    };

    setProfileData(prev => ({
      ...prev,
      social_links: [...prev.social_links, formattedLink]
    }));
    setCurrentSocialLink({ platform: 'linkedin', url: '', display_name: '' });
    setError(null); // Limpiar cualquier error previo
  };

  const removeSocialLink = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }));
  };

  // Funciones para manejar emails
  const addEmail = () => {
    if (currentEmail.email.trim()) {
      setProfileData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          emails: [...prev.contact.emails, { ...currentEmail }]
        }
      }));
      setCurrentEmail({ email: '', type: 'personal', label: '' });
    }
  };

  const removeEmail = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        emails: prev.contact.emails.filter((_, i) => i !== index)
      }
    }));
  };

  // Funciones para manejar teléfonos
  const addPhone = () => {
    if (currentPhone.phone.trim()) {
      setProfileData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          phones: [...prev.contact.phones, { ...currentPhone }]
        }
      }));
      setCurrentPhone({ phone: '', type: 'mobile', label: '' });
    }
  };

  const removePhone = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        phones: prev.contact.phones.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSectionsChange = (sections: ProfileSectionsConfig) => {
    setSectionsConfig(prev => ({
      ...prev,
      ...sections
    }));
  };

  const handleSectionOrderChange = (sectionsConfig: any) => {
    if (sectionsConfig.current_order) {
      setSectionOrder(sectionsConfig.current_order);
    }
  };

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  // Función para actualizar el estado de carga de una sección específica
  const setSectionLoadingState = (section: string, isLoading: boolean) => {
    setSectionLoading(prev => ({
      ...prev,
      [section]: isLoading
    }));
  };

  // Función para mostrar mensajes de éxito específicos por sección
  const showSectionSuccess = (section: string, message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Función para mostrar errores específicos por sección
  const showSectionError = (section: string, error: string) => {
    setError(error);
    setTimeout(() => setError(null), 5000);
  };

  // Función de guardado específica para información básica
  const handleSaveBasic = async () => {
    if (!tenantId) return;

    setSectionLoadingState('basic', true);
    setError(null);

    try {
      const updateData: Partial<ProfileUpdateData> = {
        public_name: profileData.public_name,
        bio: profileData.bio,
        title: profileData.title,
        specialty: profileData.specialty,
        social_links: profileData.social_links
      };

      // Verificar si hay una imagen nueva para subir
      if (profileData.profile_image && profileData.profile_image.startsWith('data:')) {
        const response = await fetch(profileData.profile_image);
        const blob = await response.blob();
        const imageFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });

        const updateDataWithImage = {
          ...updateData,
          profile_image: profileData.profile_image
        };

        const saved = await createOrUpdateProfile(tenantId, updateDataWithImage, imageFile);
        setProfile(saved);
        setHasExistingProfile(true);
      } else {
        const saved = await createOrUpdateProfile(tenantId, updateData);
        setProfile(saved);
        setHasExistingProfile(true);
      }

      showSectionSuccess('basic', '✅ Información básica actualizada exitosamente');
    } catch (err: any) {
      console.error('❌ Error al guardar información básica:', err);
      showSectionError('basic', `❌ Error al actualizar información básica: ${err.response?.data?.message || err.message}`);
    } finally {
      setSectionLoadingState('basic', false);
    }
  };

  // Función de guardado específica para colores
  const handleSaveColors = async () => {
    if (!tenantId) return;

    setSectionLoadingState('colors', true);
    setError(null);

    try {
      const updateData: Partial<ProfileUpdateData> = {
        theme: {
          template_id: selectedTemplate?.id || '',
          primary_color: profileData.theme.primary_color,
          secondary_color: profileData.theme.secondary_color,
          accent_color: profileData.theme.accent_color,
          font_family: profileData.theme.font_family,
          layout_style: selectedTemplate?.layout.header || 'modern'
        }
      };

      await createOrUpdateProfile(tenantId, updateData);
      showSectionSuccess('colors', '🎨 Colores actualizados exitosamente');
    } catch (err: any) {
      showSectionError('colors', `❌ Error al actualizar colores: ${err.response?.data?.message || err.message}`);
    } finally {
      setSectionLoadingState('colors', false);
    }
  };

  // Función de guardado específica para contacto
  const handleSaveContact = async () => {
    if (!tenantId) return;

    setSectionLoadingState('contact', true);
    setError(null);

    try {
      // Si el perfil no existe, asegurar mínimos para creación
      if (!hasExistingProfile) {
        if (!profileData.public_name || !profileData.title || !profileData.bio) {
          showSectionError('contact', '❌ Completa la Información Básica antes de guardar Contacto.');
          setSectionLoadingState('contact', false);
          return;
        }
      }

      const baseRequired = !hasExistingProfile
        ? {
            public_name: profileData.public_name,
            title: profileData.title,
            bio: profileData.bio
          }
        : {};

      const updateData: Partial<ProfileUpdateData> = {
        ...baseRequired,
        contact: profileData.contact
      };

      const saved = await createOrUpdateProfile(tenantId, updateData);
      setProfile(saved);
      setHasExistingProfile(true);
      showSectionSuccess('contact', '📞 Información de contacto actualizada exitosamente');
    } catch (err: any) {
      showSectionError('contact', `❌ Error al actualizar contacto: ${err.response?.data?.message || err.message}`);
    } finally {
      setSectionLoadingState('contact', false);
    }
  };

  // Función de guardado específica para secciones
  const handleSaveSections = async () => {
    if (!tenantId) return;

    setSectionLoadingState('sections', true);
    setError(null);

    try {
      if (!hasExistingProfile) {
        if (!profileData.public_name || !profileData.title || !profileData.bio) {
          showSectionError('sections', '❌ Completa la Información Básica antes de guardar Secciones.');
          setSectionLoadingState('sections', false);
          return;
        }
      }

      const baseRequired = !hasExistingProfile
        ? {
            public_name: profileData.public_name,
            title: profileData.title,
            bio: profileData.bio
          }
        : {};

      const updateData: Partial<ProfileUpdateData> = {
        ...baseRequired,
        profile_sections: sectionsConfig,
        section_order: sectionOrder
      };

      const saved = await createOrUpdateProfile(tenantId, updateData);
      setProfile(saved);
      setHasExistingProfile(true);
      showSectionSuccess('sections', '⚙️ Configuración de secciones actualizada exitosamente');
    } catch (err: any) {
      showSectionError('sections', `❌ Error al actualizar secciones: ${err.response?.data?.message || err.message}`);
    } finally {
      setSectionLoadingState('sections', false);
    }
  };

  // Función de guardado específica para testimonios
  const handleSaveTestimonials = async () => {
    if (!tenantId) return;

    setSectionLoadingState('testimonials', true);
    setError(null);

    try {
      if (!hasExistingProfile) {
        if (!profileData.public_name || !profileData.title || !profileData.bio) {
          showSectionError('testimonials', '❌ Completa la Información Básica antes de guardar Testimonios.');
          setSectionLoadingState('testimonials', false);
          return;
        }
      }

      const baseRequired = !hasExistingProfile
        ? {
            public_name: profileData.public_name,
            title: profileData.title,
            bio: profileData.bio
          }
        : {};

      const updateData: Partial<ProfileUpdateData> = {
        ...baseRequired,
        testimonials: profileData.testimonials
      };

      const saved = await createOrUpdateProfile(tenantId, updateData);
      setProfile(saved);
      setHasExistingProfile(true);
      showSectionSuccess('testimonials', '💬 Testimonios actualizados exitosamente');
    } catch (err: any) {
      showSectionError('testimonials', `❌ Error al actualizar testimonios: ${err.response?.data?.message || err.message}`);
    } finally {
      setSectionLoadingState('testimonials', false);
    }
  };

  // Función de guardado específica para ubicación
  const handleSaveLocation = async () => {
    if (!tenantId) return;

    setSectionLoadingState('location', true);
    setError(null);

    try {
      if (!hasExistingProfile) {
        if (!profileData.public_name || !profileData.title || !profileData.bio) {
          showSectionError('location', '❌ Completa la Información Básica antes de guardar Ubicación.');
          setSectionLoadingState('location', false);
          return;
        }
      }

      const baseRequired = !hasExistingProfile
        ? {
            public_name: profileData.public_name,
            title: profileData.title,
            bio: profileData.bio
          }
        : {};

      const updateData: Partial<ProfileUpdateData> = {
        ...baseRequired,
        location: profileData.location
      };

      const saved = await createOrUpdateProfile(tenantId, updateData);
      setProfile(saved);
      setHasExistingProfile(true);
      showSectionSuccess('location', '📍 Ubicación actualizada exitosamente');
    } catch (err: any) {
      showSectionError('location', `❌ Error al actualizar ubicación: ${err.response?.data?.message || err.message}`);
    } finally {
      setSectionLoadingState('location', false);
    }
  };


  // Función de guardado general (mantenida para compatibilidad)
  const handleSave = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: ProfileUpdateData = {
        public_name: profileData.public_name,
        bio: profileData.bio,
        title: profileData.title,
        specialty: profileData.specialty,
        contact: profileData.contact,
        social_links: profileData.social_links,
        stats: profileData.stats,
        testimonials: profileData.testimonials,
        location: profileData.location,
        theme: {
          template_id: selectedTemplate?.id || '',
          primary_color: profileData.theme.primary_color,
          secondary_color: profileData.theme.secondary_color,
          accent_color: profileData.theme.accent_color,
          font_family: profileData.theme.font_family,
          layout_style: selectedTemplate?.layout.header || 'modern'
        },
        profile_sections: sectionsConfig,
        section_order: sectionOrder,
        custom_fields: profileData.custom_fields,
        services: profileData.services,
        appointment_config: profileData.appointment_config
      };

      if (profileData.profile_image && profileData.profile_image.startsWith('data:')) {
        const response = await fetch(profileData.profile_image);
        const blob = await response.blob();
        const imageFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        const saved = await createOrUpdateProfile(tenantId, updateData, imageFile);
        setProfile(saved);
        setHasExistingProfile(true);
      } else {
        const saved = await createOrUpdateProfile(tenantId, updateData);
        setProfile(saved);
        setHasExistingProfile(true);
      }

      const savedSections = [];
      if (profileData.testimonials?.length > 0) savedSections.push('testimonios');
      if (profileData.location?.address) savedSections.push('ubicación');
      if (profileData.appointment_config?.enabled) savedSections.push('citas');
      if (profileData.services?.length > 0) savedSections.push('servicios');
      const sectionsText = savedSections.length > 0 ? ` (${savedSections.join(', ')})` : '';
      setSuccess(hasExistingProfile ? `¡Perfil actualizado exitosamente! 🎉${sectionsText}` : `¡Perfil creado exitosamente! 🎉${sectionsText}`);

      setTimeout(() => {
        setSuccess(null);
        fetchData().then(() => {
          setIsEditMode(false);
        });
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || '❌ Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleNewFlow = () => {
    navigate('/theme-selection');
  };

  // Handler consistente para guardar contacto (edición o perfil nuevo)
  const handleSaveContactEditor = async (updated: { phones: any[]; emails: any[]; website: string }) => {
    if (!tenantId) return;
    try {
      const res = await updateContactInfo(tenantId, updated);
      if (!(res as any)?.success) {
        const status = (res as any)?.status || (res as any)?.error?.response?.status;
        if (status === 404) {
          const created = await createOrUpdateProfile(tenantId, { contact: updated });
          if ((created as any)?._id) {
            toast.success('📞 Contacto guardado creando el perfil');
            return;
          }
        }
        toast.error('❌ No se pudo guardar contacto');
        return;
      }
      toast.success('📞 Contacto actualizado');
    } catch (e) {
      console.error('Error saving contact:', e);
      toast.error('❌ Error al guardar contacto');
    }
  };

  // Mapeo de iconos para redes sociales
  const socialPlatformIcons: { [key: string]: React.ComponentType<any> } = {
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Video,
    youtube: Youtube,
    github: Github,
    behance: Palette,
    dribbble: Heart,
    pinterest: Share2,
    snapchat: Camera,
    telegram: MessageSquare,
    whatsapp: MessageCircle,
    discord: Users,
    twitch: Gamepad2,
    reddit: BookOpen,
    medium: FileText,
    substack: FileText,
    patreon: DollarSign,
    onlyfans: Heart,
    spotify: Music,
    soundcloud: Headphones,
    website: Globe,
    blog: MessageCircle,
    portfolio: Briefcase,
    custom: Link
  };

  const platformOptions = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'github', label: 'GitHub' },
    { value: 'behance', label: 'Behance' },
    { value: 'dribbble', label: 'Dribbble' },
    { value: 'pinterest', label: 'Pinterest' },
    { value: 'snapchat', label: 'Snapchat' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'discord', label: 'Discord' },
    { value: 'twitch', label: 'Twitch' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'medium', label: 'Medium' },
    { value: 'substack', label: 'Substack' },
    { value: 'patreon', label: 'Patreon' },
    { value: 'onlyfans', label: 'OnlyFans' },
    { value: 'spotify', label: 'Spotify' },
    { value: 'soundcloud', label: 'SoundCloud' },
    { value: 'website', label: 'Sitio Web' },
    { value: 'blog', label: 'Blog Personal' },
    { value: 'portfolio', label: 'Portafolio' },
    { value: 'custom', label: 'Personalizado' }
  ];

  if (loading && !profileData.public_name) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-smartops-blue"></div>
          </div>
        </div>
      </div>
    );
  }

  // Si hay un perfil existente y no estamos en modo edición, mostrar solo el preview
  if (hasExistingProfile && !isEditMode) {
    // Verificar que tenemos datos válidos del perfil
    const hasValidProfileData = profileData.public_name || profileData.title || profileData.bio;
    
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header minimalista */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <User className="w-8 h-8 text-smartops-blue" />
              <h1 className="text-2xl font-bold font-montserrat text-smartops-dark">
                Mi Perfil Personal
              </h1>
            </div>
            <p className="text-smartops-dark/70 font-montserrat mb-6">
              Así es como se ve tu perfil profesional en dispositivos móviles
              {hasValidProfileData && (
                <span className="ml-2 text-green-600">✓ Datos cargados</span>
              )}
            </p>
            
            {/* Botones de acción */}
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleEditProfile}
                className="bg-smartops-blue hover:bg-smartops-blue-hover text-white"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
              <Button 
                variant="outline"
                onClick={fetchData}
                className="border-smartops-blue text-smartops-blue hover:bg-smartops-blue hover:text-white"
              >
                <Loader2 className="w-4 h-4 mr-2" />
                Recargar Datos
              </Button>
              {selectedTemplate?.preview_url && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(selectedTemplate.preview_url, '_blank')}
                  className="border-smartops-blue text-smartops-blue hover:bg-smartops-blue hover:text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Perfil Público
                </Button>
              )}
            </div>
          </div>

          {/* Preview móvil centrado */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Indicador de template */}
              {selectedTemplate && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge variant="secondary" className="bg-smartops-blue text-white px-3 py-1">
                    <Palette className="w-3 h-3 mr-1" />
                    {selectedTemplate.name}
                  </Badge>
                </div>
              )}
              
              {/* Preview móvil */}
              <div className="flex justify-center items-center min-h-[650px] bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-xl">
                <div className="relative">
                  {/* Sombra del dispositivo */}
                  <div className="absolute inset-0 bg-black/20 rounded-3xl blur-xl transform scale-110"></div>
                  <MobileProfilePreview 
                    template={selectedTemplate}
                    formData={profileData}
                    currentStep={0}
                    sectionsConfig={sectionsConfig}
                    sectionOrder={sectionOrder}
                  />
                </div>
              </div>
              

            </div>
          </div>

          {/* Información adicional debajo del preview */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-smartops-dark/60">
              <Smartphone className="w-4 h-4" />
              <span className="font-montserrat">
                Vista previa en tiempo real • Actualiza automáticamente
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario simplificado para crear/editar perfil
  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <User className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">
                  {isEditMode ? 'Editar Perfil' : 'Crear Mi Perfil'}
                </h1>
                <p className="text-blue-100 font-montserrat">
                  {isEditMode ? 'Modifica tu perfil profesional' : 'Configura tu perfil profesional'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!hasExistingProfile && (
                <Button 
                  onClick={handleNewFlow}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nuevo flujo
                </Button>
              )}
              {isEditMode && (
                <Button 
                  onClick={handleCancelEdit}
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mensajes */}
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

        {/* Menú de Tabs - Arriba de todo */}
        <div className="mb-8">
          <div className="grid w-full grid-cols-6 gap-1 p-2 bg-white shadow-md border border-gray-200 rounded-xl">
            <button 
              onClick={() => handleTabChange('sections')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 ${activeTab === 'sections' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600'}`}
            >
              <Settings className="w-4 h-4" />
              Secciones
            </button>
            <button 
              onClick={() => handleTabChange('basic')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 ${activeTab === 'basic' ? 'bg-gray-100 text-gray-700 shadow-sm' : 'text-gray-600'}`}
            >
              <User className="w-4 h-4" />
              Básico
            </button>
            <button 
              onClick={() => handleTabChange('colors')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-purple-50 hover:text-purple-700 ${activeTab === 'colors' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-600'}`}
            >
              <Palette className="w-4 h-4" />
              Colores
            </button>
            <button 
              onClick={() => handleTabChange('contact')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-green-50 hover:text-green-700 ${activeTab === 'contact' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-600'}`}
            >
              <Contact className="w-4 h-4" />
              Contacto
            </button>
            <button 
              onClick={() => handleTabChange('testimonials')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-yellow-50 hover:text-yellow-700 ${activeTab === 'testimonials' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-600'}`}
            >
              <Quote className="w-4 h-4" />
              Testimonios
            </button>
            <button 
              onClick={() => handleTabChange('location')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-700 ${activeTab === 'location' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-600'}`}
            >
              <MapPin className="w-4 h-4" />
              Ubicación
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario con Tabs */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

              {/* Pestaña: Información Básica */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-smartops-blue" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Imagen de perfil */}
                    <div className="space-y-2">
                      <Label>Foto de Perfil</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src={profileData.profile_image} />
                            <AvatarFallback className="bg-smartops-blue text-white">
                              {profileData.public_name?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          {/* Indicador de imagen pendiente */}
                          {profileData.profile_image && profileData.profile_image.startsWith('data:') && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {uploadingImage ? 'Procesando...' : 'Seleccionar Imagen'}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"                            aria-label="Subir imagen de perfil"
                          />
                          {profileData.profile_image && profileData.profile_image.startsWith('data:') && (
                            <p className="text-xs text-orange-600 font-medium">
                              ⚠️ Imagen pendiente de subir al servidor
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Nombre público */}
                    <div className="space-y-2">
                      <Label htmlFor="public_name">Nombre Público *</Label>
                      <Input
                        id="public_name"
                        value={profileData.public_name}
                        onChange={(e) => handleChange('public_name', e.target.value)}
                        placeholder="Tu nombre público"
                      />
                    </div>

                    {/* Título */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Título Profesional *</Label>
                      <Input
                        id="title"
                        value={profileData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Ej: Diseñador Web, Médico, Consultor"
                      />
                    </div>

                    {/* Especialidad */}
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidad</Label>
                      <Input
                        id="specialty"
                        value={profileData.specialty}
                        onChange={(e) => handleChange('specialty', e.target.value)}
                        placeholder="Ej: Frontend, Cardiología, Marketing Digital"
                      />
                    </div>

                    {/* Biografía */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografía *</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Cuéntanos sobre ti y tu experiencia profesional..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Redes Sociales */}
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-smartops-blue" />
                      Redes Sociales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enlaces sociales existentes */}
                    {profileData.social_links.length > 0 && (
                      <div className="space-y-2">
                        <Label>Enlaces Actuales</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {profileData.social_links.map((link, index) => {
                            const IconComponent = socialPlatformIcons[link.platform] || Link;
                            return (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-5 h-5 text-gray-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {link.display_name || platformOptions.find(p => p.value === link.platform)?.label || link.platform}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-gray-500 truncate block">{link.url}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSocialLink(index)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Agregar nuevo enlace */}
                    <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
                      <Label>Agregar Nuevo Enlace</Label>
                      <div className="grid grid-cols-1 gap-3">
                        <Select
                          value={currentSocialLink.platform}
                          onValueChange={(value) => handleSocialLinkChange('platform', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar plataforma">
                              {currentSocialLink.platform && (
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const IconComponent = socialPlatformIcons[currentSocialLink.platform] || Link;
                                    return <IconComponent className="w-4 h-4" />;
                                  })()}
                                  <span>{platformOptions.find(p => p.value === currentSocialLink.platform)?.label}</span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {platformOptions.map((option) => {
                              const IconComponent = socialPlatformIcons[option.value] || Link;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-4 h-4" />
                                    <span>{option.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Nombre para mostrar (opcional)"
                          value={currentSocialLink.display_name}
                          onChange={(e) => handleSocialLinkChange('display_name', e.target.value)}
                        />

                        <div className="space-y-1">
                          <Input
                            placeholder="ej: linkedin.com/in/tunombre o https://twitter.com/tunombre"
                            value={currentSocialLink.url}
                            onChange={(e) => handleSocialLinkChange('url', e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            💡 Puedes ingresar con o sin https://. Se agregará automáticamente.
                          </p>
                        </div>

                        <Button
                          onClick={addSocialLink}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Enlace
                        </Button>
                      </div>
                    </div>

                    {/* Botón de guardar para información básica */}
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleSaveBasic}
                        disabled={sectionLoading.basic || !profileData.public_name || !profileData.bio || !profileData.title}
                        className="w-full bg-smartops-blue hover:bg-smartops-blue-hover text-white"
                      >
                        {sectionLoading.basic ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Información Básica
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña: Colores */}
              <TabsContent value="colors" className="space-y-6">
                {tenantId ? (
                  <ProfileColorsEditor
                    tenantId={tenantId}
                    initialColors={{
                      primary_color: profileData.theme.primary_color,
                      secondary_color: profileData.theme.secondary_color,
                      accent_color: profileData.theme.accent_color,
                      font_family: profileData.theme.font_family
                    }}
                    onSaved={(saved) => {
                      setProfileData(prev => ({
                        ...prev,
                        theme: {
                          ...prev.theme,
                          primary_color: saved?.primary_color ?? prev.theme.primary_color,
                          secondary_color: saved?.secondary_color ?? prev.theme.secondary_color,
                          accent_color: saved?.accent_color ?? prev.theme.accent_color,
                          font_family: saved?.font_family ?? prev.theme.font_family
                        }
                      }));
                      toast.success('Colores guardados', {
                        description: `Primario: ${saved?.primary_color ?? '-'} | Secundario: ${saved?.secondary_color ?? '-'} | Acento: ${saved?.accent_color ?? '-'}`
                      });
                    }}
                  />
                ) : (
                  <div style={{ padding: 12 }}>Cargando editor de colores…</div>
                )}
              </TabsContent>

              {/* Pestaña: Contacto */}
              <TabsContent value="contact" className="space-y-6">
                <ProfileContactEditor
                  initialContact={profileData.contact}
                  onSave={handleSaveContactEditor}
                  redirectOnSave={false}
                />
              </TabsContent>

              {/* Pestaña: Secciones */}
              <TabsContent value="sections" className="space-y-6">
                <ProfileSectionsOrderEditor
                  tenantId={tenantId || ''}
                  onSectionsChange={(cfg) => {
                    const tf = cfg?.tenant_features || {};
                    const sec = cfg?.sections || {};
                    const mapped = {
                      show_stats: sec.stats?.enabled ?? true,
                      show_services: tf.services === true ? (sec.services?.enabled ?? false) : false,
                      show_products: tf.products === true ? (sec.products?.enabled ?? false) : false,
                      show_testimonials: sec.testimonials?.enabled ?? true,
                      show_contact: sec.contact?.enabled ?? true,
                      show_social: sec.social?.enabled ?? true,
                      show_appointments: tf.appointments === true ? (sec.appointments?.enabled ?? false) : false,
                    };
                    setSectionsConfig(mapped);
                    setSectionOrder(cfg?.current_order || []);
                  }}
                />
              </TabsContent>

              {/* Pestaña: Testimonios */}
              <TabsContent value="testimonials" className="space-y-6">
                <TestimonialsEditor
                  onTestimonialsChange={(testimonials) => {
                    setProfileData(prev => ({
                      ...prev,
                      testimonials: testimonials
                    }));
                  }}
                />
                

              </TabsContent>

              {/* Pestaña: Ubicación */}
              <TabsContent value="location" className="space-y-6">
                <LocationEditor
                  onLocationChange={(loc) => {
                    setProfileData(prev => ({
                      ...prev,
                      location: loc
                    }));
                  }}
                  defaultShowMap
                />
              </TabsContent>


            </Tabs>

            {/* Botón de guardar general */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <Button
                  onClick={handleSave}
                  disabled={loading || !profileData.public_name || !profileData.bio || !profileData.title}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando Todo...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {hasExistingProfile ? 'Guardar Todo el Perfil' : 'Crear Perfil Completo'}
                    </>
                  )}
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Recomendado:</strong> Usa los botones individuales de cada sección para guardar cambios específicos y evitar errores.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    El botón "Guardar Todo" actualiza todas las secciones de una vez.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista previa móvil */}
          <div className="sticky top-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-smartops-blue" />
                  <CardTitle className="font-montserrat text-smartops-dark">
                    Vista Previa Móvil
                  </CardTitle>
                </div>
                <p className="text-sm text-smartops-dark/70 font-montserrat">
                  Así se verá tu perfil en dispositivos móviles
                </p>
              </CardHeader>
              <CardContent className="flex justify-center items-center min-h-[650px] bg-gradient-to-br from-gray-100 to-gray-200 p-8">
                <div className="relative">
                  {/* Sombra del dispositivo */}
                  <div className="absolute inset-0 bg-black/20 rounded-3xl blur-xl transform scale-110"></div>
                  <MobileProfilePreview
                    template={selectedTemplate}
                    formData={profileData}
                    currentStep={0}
                    sectionsConfig={sectionsConfig}
                    sectionOrder={sectionOrder}
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
