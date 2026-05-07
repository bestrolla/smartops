// Tipos para la aplicación SmartOps

export interface Location {
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  business_hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  additional_info?: string;
}

export interface ProfileData {
  id?: string | number;
  name: string;
  description: string;
  logo?: string | null;
  tags?: string[];
  socialLinks?: Record<string, string>;
  stats?: { value: string | number; label: string }[];
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  businessHours?: Record<string, string>;
  location?: Location;
  // Propiedades adicionales para compatibilidad con ProfileHeader
  public_name?: string;
  title?: string;
  specialty?: string;
  bio?: string;
  profile_image?: string | null;
  social_links?: Array<{
    platform: string;
    url: string;
    display_name?: string;
  }>;
  theme?: {
    template_id?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
    layout_style?: string;
    sections?: {
      show_stats?: boolean;
      show_services?: boolean;
      show_testimonials?: boolean;
      show_products?: boolean;
      show_location?: boolean;
      show_contact?: boolean;
    };
    custom_css?: string;
  };

  // Campos adicionales para adaptación con API_V3
  // Estructura de contacto
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    emails?: string[];
    phones?: string[];
  };
  // Fechas y metadatos
  createdAt?: string;
  updatedAt?: string;
  tenant_id?: string;
  // El API puede enviar _id
  _id?: string;
  // Campos custom
  custom_fields?: Record<string, unknown>;
  // Variantes de la imagen de perfil
  profileImage?: string | null;
  // Secciones visibles (cuando viene separado de theme)
  profile_sections?: {
    show_appointments?: boolean;
    show_stats?: boolean;
    show_testimonials?: boolean;
    show_contact?: boolean;
    show_location?: boolean;
    show_services?: boolean;
    show_products?: boolean;
  };
}

export interface Service {
  id?: string | number;
  name: string;
  description: string;
  price?: string | number;
  duration?: string | number;
}

export interface Testimonial {
  id?: string | number;
  name: string;
  role: string;
  content: string;
  author?: string;
  clientName?: string;
  rating?: number;
}

export interface Product {
  id?: string | number;
  name: string;
  description: string;
  price?: string | number;
  basePrice?: string | number;
  images?: string[];
  sku?: string;
  stock?: number;
}

// Tipado estricto tal cual el backend (public-profile.routes.js)
export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  description?: string;
  businessType?: string;
  // Alineado con el controlador: estos campos vienen en 'tenant'
  _id?: string;
  displayName?: string;
  logoUrl?: string;
  isActive?: boolean;
  theme?: TenantThemeCamelCase;
  features?: FeatureFlags;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicProfileData {
  public_name: string;
  title?: string;
  specialty?: string;
  bio?: string;
  // El backend normaliza a profileImage (viene de profileImage o profile_image)
  profileImage?: string | null;

  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    emails?: string[];
    phones?: string[];
  };

  social_links?: Array<{
    platform: string;
    url: string;
    display_name?: string;
  }>;

  stats?: Array<{ label: string; value: string | number }>;
  testimonials?: Testimonial[];
  location?: Location;

  profile_sections?: {
    show_appointments?: boolean;
    show_stats?: boolean;
    show_testimonials?: boolean;
    show_contact?: boolean;
    show_location?: boolean;
    show_services?: boolean;
    show_products?: boolean;
    // Alineado con normalizeProfileSections en el controlador
    show_social?: boolean;
  };

  section_order?: string[];
  theme?: {
    template_id?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
    layout_style?: string;
    custom_css?: string;
  };

  // Config propia de citas cuando aplique
  appointment_config?: Record<string, unknown>;
}

export interface PublicThemeRoot {
  id?: string;
  name?: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  layout?: { header?: string; stats?: string; services?: string; testimonials?: string; products?: string };
}

export interface TenantProfile {
  tenant: TenantInfo;
  profile: PublicProfileData;
  services?: Service[];
  products?: Product[];
  testimonials?: Testimonial[];
  stats?: Array<{ label: string; value: string | number }>;
  theme?: PublicThemeRoot;
  gallery?: any[];
  professionals?: any[];
}

// Interfaz adicional para compatibilidad con componentes de perfil
export interface Profile {
  id: string;
  name: string;
  profile?: ProfileData;
}

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface TenantThemeCamelCase {
  primaryColor?: string;
  secondaryColor?: string;
  darkMode?: boolean;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface PublicProfile {
  displayName: string;
  description?: string;
  logoUrl?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  sections?: {
    show_services?: boolean;
    show_products?: boolean;
    show_testimonials?: boolean;
    show_contact?: boolean;
    show_social?: boolean;
  };
}

export interface TenantPublic {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  businessType?: string;
  isActive: boolean;
  theme: ThemeConfig;
  features: FeatureFlags;
  createdAt?: string;
  updatedAt?: string;
  profile?: PublicProfile | null;
}