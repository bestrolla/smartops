export type SocialPlatform = 
  | 'linkedin' 
  | 'twitter' 
  | 'github' 
  | 'custom' 
  | 'instagram' 
  | 'whatsapp' 
  | 'facebook' 
  | 'website' 
  | 'tiktok';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  display_name?: string;
}

export interface Contact {
  emails: Array<{
    email: string;
    type: 'personal' | 'business' | 'other';
    label?: string;
  }>;
  phones: Array<{
    phone: string;
    type: 'mobile' | 'landline' | 'whatsapp' | 'other';
    label?: string;
  }>;
  website: string;
}

export interface AppointmentConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  availability_message: string;
}

export interface Service {
  name: string;
  description: string;
  price?: string;
  duration?: string;
}

export interface ProfileFormData {
  public_name: string;
  bio: string;
  profile_image: string;
  title?: string;
  specialty?: string;
  contact: Contact;
  social_links: SocialLink[];
  stats: Array<{
    label: string;
    value: string;
  }>;
  testimonials: Array<{
    name: string;
    role: string;
    content: string[];
    rating: number;
  }>;
  location?: {
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
      [key: string]: string;
    };
    additional_info?: string;
  };
  theme: {
    template_id: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    layout_style: string;
  };
  theme_color: string;
  custom_fields: Record<string, string>;
  services: Service[];
  nfc: {
    card_uid: string;
    is_linked: boolean;
  };
  appointment_config?: AppointmentConfig;
}

export type PublicProfileData = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    description?: string;
    theme?: unknown;
    features?: unknown;
  };
  profile: {
    public_name?: string;
    title?: string;
    specialty?: string;
    bio?: string;
    profileImage?: string;
    contact?: unknown;
    social_links?: unknown[];
    stats?: unknown[];
    testimonials?: unknown[];
    location?: unknown;
    profile_sections?: Record<string, boolean>;
    section_order?: string[];
    theme?: unknown;
    appointment_config?: unknown;
  };
  services: Array<{
    id: string;
    name: string;
    description?: string;
    duration?: number;
    price?: number;
    currency?: string;
    isPackage?: boolean;
    category?: { id: string; name?: string } | null;
  }>;
  products: Array<{
    id: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: { id: string; name?: string } | null;
  }>;
};

export type PublicProfileResponse = {
  success: boolean;
  data: PublicProfileData;
  meta: {
    slug: string;
    url: string;
    apiUrl: string;
    lastModified: string;
  };
};