import type { TenantPublic, Product } from '@/types';

// API para consumir datos de perfiles de tenant desde smartops_api_v3

/**
 * Obtiene el perfil completo de un tenant por su slug
 * @param slug Slug del tenant
 * @returns Datos del perfil del tenant o null si no disponible
 */

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  emails?: string[];
  phones?: string[];
}

export interface Coordinates {
  latitude?: number;
  longitude?: number;
}

export interface LocationInfo {
  coordinates?: Coordinates;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface SocialLink {
  platform?: string;
  url?: string;
  display_name?: string;
}

export interface StatItem {
  label?: string;
  value?: string | number;
}

export interface Testimonial {
  name?: string;
  role?: string;
  content?: string;
  rating?: number;
  avatar?: string;
}

export interface ProfileTheme {
  template_id?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
  layout_style?: string;
}

export interface PublicTenantResponse {
  status: 'success';
  data: {
    tenant: {
      id?: string;
      _id?: string;
      name?: string;
      slug?: string;
      businessType?: string;
      description?: string;
      logoUrl?: string;
      isActive?: boolean;
      theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        darkMode?: boolean;
      };
      features?: {
        appointments?: boolean;
        crm?: boolean;
        ecommerce?: boolean;
        inventory?: boolean;
        orders?: boolean;
        products?: boolean;
        professionals?: boolean;
        services?: boolean;
        customDomain?: boolean;
      };
      createdAt?: string;
      updatedAt?: string;
    };
    profile: {
      _id?: string;
      tenant_id?: string;
      public_name?: string;
      title?: string;
      specialty?: string;
      bio?: string;
      profileImage?: string;
      profile_image?: string;
      contact?: ContactInfo;
      location?: LocationInfo;
      social_links?: SocialLink[];
      stats?: StatItem[];
      testimonials?: Testimonial[];
      theme?: ProfileTheme;
      profile_sections?: Record<string, boolean>;
      section_order?: string[];
      appointment_config?: Record<string, unknown>;
      custom_fields?: Record<string, unknown>;
      createdAt?: string;
      updatedAt?: string;
    } | null;
    services: Array<{
      id: string;
      name: string;
      description?: string;
      price?: number | string;
      duration?: number | string;
    }>;
    products: Array<{
      id: string;
      name: string;
      description?: string;
      price?: number | string;
    }>;
    testimonials: Testimonial[];
    stats: StatItem[];
    theme: {
      colors: import('@/types').ThemeColors;
      layout?: Record<string, unknown>;
    };
    professionals: Array<Record<string, unknown>>;
    gallery: Array<Record<string, unknown>>;
  };
}

export type PublicTenantData = PublicTenantResponse['data'];

// Mantén la delegación, pero ten en cuenta que debe existir slug
// getPublicTenantProfile: retorna null si no hay slug y delega a getTenantProfile
export async function getPublicTenantProfile(slug?: string): Promise<PublicTenantData | null> {
  if (!slug) return null;
  return getTenantProfile(slug);
}

export async function getAllTenantSlugs(): Promise<string[]> {
  try {
    const base = resolveApiBase();
    const url = `${base}/api/public/tenants`;

    const response = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (!response.ok) return [];

    const result = await response.json();
    return result?.data?.map((tenant: { slug: string }) => tenant.slug) ?? [];
  } catch (error) {
    console.error('Error en getAllTenantSlugs:', error);
    return [];
  }
}

export async function getTenantProducts(slug: string) {
  const base = resolveApiBase();
  const directUrl = `${base}/api/public/tenant/${encodeURIComponent(slug)}/products`;
  try {
    const res = await fetch(directUrl, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const arr = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.products)
            ? json.products
            : [];
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  try {
    const res2 = await fetch(`${base}/api/profile/${encodeURIComponent(slug)}`, { cache: 'no-store', headers: { accept: 'application/json' } });
    if (res2.ok) {
      const json2 = await res2.json().catch(() => null);
      const data = json2?.data ?? {};
      const arr = Array.isArray(data?.products) ? data.products : [];
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  try {
    const res3 = await fetch(`${base}/api/public/products`, { cache: 'no-store', headers: { accept: 'application/json', 'X-Tenant-Slug': slug } as any });
    if (res3.ok) {
      const json3 = await res3.json().catch(() => null);
      const arr = Array.isArray(json3?.data) ? json3.data : Array.isArray(json3) ? json3 : [];
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  return [];
}

export interface PublicProfile {
  public_name: string;
  title: string;
  bio: string;
  avatar?: string;
  contact: {
    emails: string[];
    phones: string[];
    website?: string;
  };
  social_links: Array<{ platform: string; url: string; display_name?: string }>;
  stats: Array<{ label: string; value: string }>;
  profile_sections: {
    show_stats: boolean;
    show_services: boolean;
    show_products: boolean;
    show_testimonials: boolean;
    show_contact: boolean;
    show_social: boolean;
    show_appointments: boolean;
  };
  section_order?: string[]; // orden de secciones desde la BD
  appointment_config?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    button_text: string;
    availability_message: string;
  }; // configuración de citas
}

// getTenantProfile: consumir /api/profile/:slug y manejar errores devolviendo null
export async function getTenantProfile(slug: string): Promise<PublicTenantData | null> {
  // Normaliza BASE para evitar doble /api
  const RAW_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_V3_BASE_URL ||
    '';

  const base = resolveApiBase();
  const url = `${base}/api/profile/${slug}`;

  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('Fallo al obtener perfil público', {
        slug,
        url,
        status: res.status,
        statusText: res.statusText,
        bodySnippet: body?.slice(0, 300),
      });
      return null;
    }

    const json = await res.json();
    const data = json?.data ?? {};
    const profile = data.profile ?? {};

    return {
      tenant: data.tenant ?? null,
      profile: {
        // Propaga todos los campos y asegura estos dos
        ...profile,
        section_order: Array.isArray(profile.section_order) ? profile.section_order : undefined,
        appointment_config: profile.appointment_config ?? undefined,
      },
      services: data.services ?? [],
      products: data.products ?? [],
      testimonials: profile?.testimonials ?? [],
      stats: profile?.stats ?? [],
      professionals: data.professionals ?? [],
      gallery: data.gallery ?? [],
      // Si el backend no provee theme a nivel raíz, construye colors desde tenant.theme
      theme: data.theme ?? {
        colors: {
          primary: data.tenant?.theme?.primaryColor ?? '#3B82F6',
          secondary: data.tenant?.theme?.secondaryColor ?? '#1E40AF',
          accent: '#F59E0B',
        },
        layout: {},
      },
    } as PublicTenantData;
  } catch (err) {
    console.error('Excepción al obtener perfil público', {
      slug,
      url,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function getPublicProfileBySlug(slug: string) {
    const base = resolveApiBase();
    const res = await fetch(`${base}/api/public/tenant/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' }
    });
  if (!res.ok) throw new Error(`Failed to load profile for slug ${slug}`);
  const json = await res.json();
  const { tenant, profile } = json.data ?? {};
  return {
    public_name: profile?.public_name ?? tenant?.displayName ?? '',
    title: profile?.title ?? '',
    bio: profile?.bio ?? '',
    avatar: profile?.profileImage ?? profile?.profile_image ?? '',
    contact: profile?.contact ?? { emails: [], phones: [], website: '' },
    social_links: profile?.social_links ?? [],
    stats: profile?.stats ?? [],
    profile_sections: profile?.profile_sections ?? {
      show_stats: true, show_services: true, show_products: false,
      show_appointments: false, show_testimonials: false,
      show_contact: true, show_social: true,
    },
    theme: {
      template_id: profile?.theme?.template_id ?? '',
      primary_color: profile?.theme?.primary_color ?? '#4f46e5',
      secondary_color: profile?.theme?.secondary_color ?? '#8b5cf6',
      accent_color: profile?.theme?.accent_color ?? '#ffffff',
      font_family: profile?.theme?.font_family ?? 'Montserrat',
      layout_style: profile?.theme?.layout_style ?? '',
    },
    section_order: Array.isArray(profile?.section_order) ? profile.section_order : ['stats','services','products','testimonials','schedule','contact'],
    appointment_config: profile?.appointment_config ?? undefined,
    location: profile?.location ?? null
  };
}


export interface PublicService {
  id: string;
  name: string;
  description?: string;
  price?: number;
}

export interface PublicTestimonial {
  id: string;
  author: string;
  message: string;
  rating?: number;
}

export async function getPublicServicesBySlug(slug: string): Promise<PublicService[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${base}/public/services/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export async function getPublicTestimonialsBySlug(slug: string): Promise<PublicTestimonial[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${base}/public/testimonials/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}


// Helper para resolver el BASE del API según entorno y variables públicas
function resolveApiBase(): string {
  const nodeEnv = process.env.NODE_ENV;
  const apiRaw = process.env.NEXT_PUBLIC_API_URL || '';
  const siteRaw = process.env.NEXT_PUBLIC_SITE_URL || '';

  const trim = (v: string) => v.trim().replace(/\/+$/, '');

  let base = trim(apiRaw);
  const site = trim(siteRaw);

  // Si no hay API explícito, inferir desde SITE
  if (!base && site) {
    try {
      const host = new URL(site).hostname;
      // En producción, si el SITE es smartopsve.com, usa el API subdominio
      if (/smartopsve\.com$/i.test(host)) {
        base = 'https://api.smartopsve.com';
      } else {
        // En local u otros dominios, usa el SITE como origen y añadimos /api al construir URLs
        base = site;
      }
    } catch {
      base = site;
    }
  }

  // Evita terminar con /api en base; el sufijo /api se añadirá según cada endpoint
  base = base.replace(/\/api$/i, '');

  // Último fallback muy conservador si nada está definido
  if (!base) {
    base = nodeEnv === 'production'
      ? 'https://api.smartopsve.com'
      : 'http://localhost:3000';
  }

  return base;
}
