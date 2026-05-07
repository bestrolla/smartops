'use client';

import { useEffect, useMemo, useState, Fragment } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Star,
  MessageCircle,
  Calendar,
  Award,
  Briefcase,
  Quote,
  Loader2,
  Share2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Image // <- agregado para icono de Productos
} from 'lucide-react';
import { 
  FaLinkedinIn, 
  FaTwitter, 
  FaInstagram, 
  FaFacebookF, 
  FaTiktok, 
  FaWhatsapp, 
  FaGlobe, 
  FaLink 
} from 'react-icons/fa';

import { ContactSection } from '@/components/tenant/ContactSection';
import LocationMapFullsize from '@/components/LocationMapFullsize';



export default function TenantProfileClient({ profileData }: { profileData: any }) {
  // Hooks siempre al tope para cumplir rules-of-hooks
  console.log(profileData)
  const [isClient, setIsClient] = useState(false);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  // Unifica 'profile' (elimina la declaración duplicada)
  const profile = profileData?.profile || null;
  const tenantTheme = profileData?.tenant?.theme || {};
  const slug = profileData?.tenant?.slug || '';


  // Mover Hooks por encima del return condicional
  const sections = profile?.profile_sections || {};

  const VALID_SECTIONS = [
    'header',
    'stats',
    'services',
    'products',
    'testimonials',
    'contact',
    'location',
    'social',
    'appointments',
  ];

  const sectionOrder = useMemo(() => {
    const apiOrder = Array.isArray(profile?.section_order) ? profile!.section_order! : [];

    const hasData = (key: string) => {
      switch (key) {
        case 'stats':
          return ((profileData as any)?.stats || profile?.stats || []).length > 0;
        case 'services':
          return ((profileData as any)?.services || []).length > 0;
        case 'products':
          return ((profileData as any)?.products || []).length > 0;
        case 'testimonials':
          return ((profileData as any)?.testimonials || profile?.testimonials || []).length > 0;
        case 'contact':
          return !!profile?.contact;
        case 'location':
          return !!profile?.location;
        case 'social':
          return (profile?.social_links || []).length > 0;
        case 'appointments':
          return !!profile?.appointment_config;
        default:
          return true;
      }
    };

    const isShown = (key: string) => {
      const hasServices = ((profileData as any)?.services || []).length > 0;
      const hasProducts = ((profileData as any)?.products || []).length > 0;
      if (key === 'services' && hasServices) return true;
      if (key === 'products' && hasProducts) return true;
      const flagName = `show_${key}` as keyof typeof sections;
      // Mostrar por defecto salvo que esté explícitamente en false
      return sections?.[flagName] !== false;
    };

    const ordered = apiOrder
      .filter((k: string) => VALID_SECTIONS.includes(k))
      .filter((k: string) => k !== 'header')
      .filter((k: string) => isShown(k) && hasData(k));

    if (ordered.length > 0) return ordered;

    const defaultOrder = [
      'stats',
      'services',
      'products',
      'testimonials',
      'contact',
      'location',
      'social',
      'appointments',
    ];
    return defaultOrder.filter((k) => isShown(k) && hasData(k));
  }, [profileData, profile, sections]);

  const sanitizedSocialLinks = useMemo(() => {
    if (!Array.isArray(profile?.social_links)) return [];
    return profile.social_links.map((link: any) => {
      const rawUrl = typeof link?.url === 'string' ? link.url : String(link?.url ?? '');
      const url = rawUrl.split('`').join('').trim();
      const platformKey = (link?.display_name || link?.platform || 'link').toLowerCase();
      return { url, platformKey };
    });
  }, [profile?.social_links]);

  // ÚNICA declaración de 'colors' usando el esquema real del API
  const colors = useMemo(() => {
    const apiColors = (profileData as any)?.theme?.colors;
    if (apiColors && typeof apiColors === 'object') {
      return apiColors as { primary: string; secondary: string; accent: string };
    }
    return {
      primary: tenantTheme?.primaryColor || '#3B82F6',
      secondary: tenantTheme?.secondaryColor || '#1E40AF',
      accent: '#F59E0B',
    };
  }, [profileData, tenantTheme]);

  useEffect(() => {
    setIsClient(true);
  }, [profileData]);

  // Aplica variables CSS desde 'colors' sin depender de profile.theme
  useEffect(() => {
    if (!colors) return;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    return () => {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-secondary');
      root.style.removeProperty('--theme-accent');
    };
  }, [colors]);


  // Mantener el return condicional sin Hooks debajo
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-montserrat">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Datos visibles del perfil según nuevo esquema del API
  const testimonials = (profileData as any)?.testimonials || profile?.testimonials || [];
  const stats = (profileData as any)?.stats || profile?.stats || [];
  const services = (profileData as any)?.services || [];
  const products = (profileData as any)?.products || [];


  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <FaLinkedinIn className="w-4 h-4" />;
      case 'twitter': return <FaTwitter className="w-4 h-4" />;
      case 'instagram': return <FaInstagram className="w-4 h-4" />;
      case 'facebook': return <FaFacebookF className="w-4 h-4" />;
      case 'tiktok': return <FaTiktok className="w-4 h-4" />;
      case 'youtube': return <span className="w-4 h-4 text-red-500">▶️</span>;
      case 'github': return <span className="w-4 h-4">💻</span>;
      case 'whatsapp': return <FaWhatsapp className="w-4 h-4" />;
      case 'website': return <FaGlobe className="w-4 h-4" />;
      default: return <FaLink className="w-4 h-4" />;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = (serviceName || '').toLowerCase();
    if (name.includes('consulta') || name.includes('asesor')) return '💼';
    if (name.includes('diseño') || name.includes('web')) return '🎨';
    if (name.includes('marketing') || name.includes('digital')) return '📱';
    if (name.includes('desarrollo') || name.includes('software')) return '💻';
    if (name.includes('seo') || name.includes('posicionamiento')) return '🔍';
    if (name.includes('social') || name.includes('redes')) return '📢';
    return '⚡';
  };

  const formatServicePrice = (price: number | string) => {
    if (!price) return 'Consultar precio';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${numPrice.toLocaleString()}`;
  };

  const formatServiceDuration = (duration: number | string) => {
    if (!duration) return '';
    const numDuration = typeof duration === 'string' ? parseInt(duration) : duration;
    return `${numDuration} min`;
  };

  // Helper para mostrar precio de productos con formato moneda (similar al admin)
  const formatProductPrice = (product: any): string => {
    const price = typeof product?.basePrice !== 'undefined' ? product.basePrice : product?.price;
    if (typeof price === 'undefined' || price === null) return 'Consultar precio';
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(Number(price));
  };

  const getInitials = (name?: string) => {
    return (name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()) || 'U';
  };


  // Helper sin Hooks (no useMemo/useEffect aquí)
  const renderSection = (id: string) => {
      switch (id) {
          case 'stats':
              return (
                  <div className="px-6 py-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                          <Award className="w-4 h-4 text-gray-700" />
                          <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                              Estadísticas
                          </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          {stats.slice(0, 4).map((stat: any, index: number) => (
                              <div key={index} className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="text-lg font-bold text-gray-900 font-montserrat">
                                      {stat.value}
                                  </div>
                                  <div className="text-xs text-gray-600 font-montserrat">
                                      {stat.label}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              );
  
          case 'services':
              return (sections?.show_services !== false || ((profileData as any)?.services || []).length > 0) ? (
                  <div className="px-6 py-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="w-4 h-4 text-gray-700" />
                          <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                              Servicios
                          </h3>
                      </div>
  
                      {services && Array.isArray(services) && services.length > 0 ? (
                          <div className="relative">
                              <div
                                  className="services-scroll flex overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              >
                                  {services.map((service: any) => (
                                      <div key={service._id || service.id || service.name} className="min-w-full w-full p-4 border border-gray-200 bg-white shadow-sm rounded-lg">
                                          <div className="flex items-start gap-3">
                                              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                                                  {getServiceIcon(service.name || '')}
                                              </div>
                                              <div className="flex-1">
                                                  <h4 className="text-sm font-bold font-montserrat text-gray-900">
                                                      {service.name}
                                                  </h4>
                                                  <p className="text-xs text-gray-600 font-montserrat mt-1">
                                                      {service.description && service.description.length > 60
                                                          ? `${service.description.substring(0, 60)}...`
                                                          : service.description || 'Sin descripción'}
                                                  </p>
                                                  <div className="flex justify-between items-center mt-2">
                                                      <span className="text-xs font-bold text-gray-900 font-montserrat">
                                                          {formatServicePrice(service.price || service.basePrice)}
                                                      </span>
                                                      <span className="text-xs text-gray-500 font-montserrat">
                                                          ⏱ {formatServiceDuration(service.duration)}
                                                      </span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
  
                              {services.length > 1 && (
                                  <>
                                      <button
                                          onClick={() => {
                                              const el = document.querySelector('.services-scroll') as HTMLElement | null;
                                              if (!el) return;
                                              const w = el.clientWidth || 320;
                                              const count = Array.isArray(services) ? services.length : 0;
                                              const idx = Math.round(el.scrollLeft / w);
                                              const prev = idx - 1 < 0 ? Math.max(0, count - 1) : idx - 1;
                                              el.scrollTo({ left: prev * w, behavior: 'smooth' });
                                          }}
                                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                                          aria-label="Servicio anterior"
                                      >
                                          <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                          onClick={() => {
                                              const el = document.querySelector('.services-scroll') as HTMLElement | null;
                                              if (!el) return;
                                              const w = el.clientWidth || 320;
                                              const count = Array.isArray(services) ? services.length : 0;
                                              const idx = Math.round(el.scrollLeft / w);
                                              const next = idx + 1 >= count ? 0 : idx + 1;
                                              el.scrollTo({ left: next * w, behavior: 'smooth' });
                                          }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                                          aria-label="Servicio siguiente"
                                      >
                                          <ChevronRight className="w-4 h-4" />
                                      </button>
                                  </>
                              )}
                          </div>
                      ) : (
                          <div className="text-center py-4">
                              <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-500 font-montserrat">
                                  Aún no tienes servicios configurados
                              </p>
                          </div>
                      )}
                  </div>
              ) : null;
  
          case 'products':
              return (sections?.show_products !== false || ((profileData as any)?.products || []).length > 0) ? (
                  <div className="px-6 py-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                          <Image className="w-4 h-4 text-gray-700" />
                          <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                              Productos
                          </h3>
                      </div>
  
                      {products && Array.isArray(products) && products.length > 0 ? (
                          <div className="relative">
                              <div
                                  className="products-scroll flex overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              >
                                  {products.map((product: any) => {
                                      const image = Array.isArray(product.images) && product.images.length > 0
                                          ? product.images[0]
                                          : null;
                                      return (
                                          <div key={product.id || product._id || product.sku || product.name} className="min-w-full w-full p-4 border border-gray-200 bg-white shadow-sm rounded-lg">
                                              <div className="flex items-start gap-3">
                                                  {image ? (
                                                      <img
                                                          src={typeof image === 'string' ? image : image.url}
                                                          alt={product.name}
                                                          className="w-12 h-12 rounded object-cover"
                                                      />
                                                  ) : (
                                                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                                          <Image className="w-5 h-5 text-gray-400" />
                                                      </div>
                                                  )}
                                                  <div className="flex-1">
                                                      <h4 className="text-sm font-bold font-montserrat text-gray-900">
                                                          {product.name}
                                                      </h4>
                                                      <p className="text-xs text-gray-600 font-montserrat mt-1">
                                                          {product.sku ? `SKU: ${product.sku}` : 'Sin SKU'}
                                                      </p>
                                                      <div className="flex justify-between items-center mt-2">
                                                          <span className="text-xs font-bold text-gray-900 font-montserrat">
                                                              {formatProductPrice(product)}
                                                          </span>
                                                          {typeof product.stock !== 'undefined' && (
                                                              <span
                                                                  className={`text-xs font-montserrat ${
                                                                    Number(product.stock) > 0 ? 'text-green-600' : 'text-red-600'
                                                                  }`}
                                                              >
                                                                  {Number(product.stock) > 0
                                                                    ? `${product.stock} en stock`
                                                                    : 'Sin stock'}
                                                              </span>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
  
                              {products.length > 1 && (
                                  <>
                                      <button
                                          onClick={() => {
                                              const el = document.querySelector('.products-scroll') as HTMLElement | null;
                                              if (!el) return;
                                              const w = el.clientWidth || 320;
                                              const count = Array.isArray(products) ? products.length : 0;
                                              const idx = Math.round(el.scrollLeft / w);
                                              const prev = idx - 1 < 0 ? Math.max(0, count - 1) : idx - 1;
                                              el.scrollTo({ left: prev * w, behavior: 'smooth' });
                                          }}
                                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                                          aria-label="Producto anterior"
                                      >
                                          <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                          onClick={() => {
                                              const el = document.querySelector('.products-scroll') as HTMLElement | null;
                                              if (!el) return;
                                              const w = el.clientWidth || 320;
                                              const count = Array.isArray(products) ? products.length : 0;
                                              const idx = Math.round(el.scrollLeft / w);
                                              const next = idx + 1 >= count ? 0 : idx + 1;
                                              el.scrollTo({ left: next * w, behavior: 'smooth' });
                                          }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                                          aria-label="Producto siguiente"
                                      >
                                          <ChevronRight className="w-4 h-4" />
                                      </button>
                                  </>
                              )}
                              <div className="mt-4">
                                  <a href={`/${slug}/tienda`} className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600 text-white px-4 py-2 font-montserrat font-semibold hover:bg-blue-700 transition-colors">
                                      Ir a tienda
                                  </a>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-4">
                              <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-500 font-montserrat">
                                  Aún no tienes productos configurados
                              </p>
                          </div>
                      )}
                  </div>
              ) : null;
  
          case 'testimonials':
              return sections?.show_testimonials !== false ? (
                  <div className="px-6 py-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                          <Quote className="w-4 h-4 text-gray-700" />
                          <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                              Testimonios
                          </h3>
                      </div>
  
                      {(testimonials && Array.isArray(testimonials) && testimonials.length > 0) ? (
                          <div className="relative">
                              <div
                                  className="testimonials-scroll flex overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              >
                                  {testimonials.slice(-2).map((testimonial: any, index: number) => (
                                      <div key={index} className="p-4 border border-gray-200 bg-white min-w-full w-full min-h-[120px] flex-shrink-0 rounded-lg">
                                          <div className="flex flex-col h-full">
                                              <div className="text-center mb-3">
                                                  <span className="font-semibold text-sm text-gray-800 font-montserrat">
                                                      {testimonial.name || 'Anónimo'}
                                                  </span>
                                              </div>
                                              <div className="flex-1 flex items-center">
                                                  <div className="flex items-center gap-2 w-full justify-center">
                                                      <Quote className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                      <p className="text-sm text-gray-700 font-montserrat leading-relaxed text-center max-w-[250px]">
                                                          "{(() => {
                                                              const content = Array.isArray(testimonial.content)
                                                                  ? testimonial.content.join(' ')
                                                                  : testimonial.content;
                                                              return content && content.length > 80
                                                                  ? `${content.substring(0, 80)}...`
                                                                  : content || 'Sin contenido';
                                                          })()}"
                                                      </p>
                                                  </div>
                                              </div>
                                              <div className="text-center mt-3">
                                                  <div className="text-yellow-500">
                                                      {Array.from({ length: testimonial.rating || 0 }, (_, i) => (
                                                          <Star key={i} className="w-4 h-4 inline-block fill-current text-yellow-500" />
                                                      ))}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
  
                              {testimonials.length > 1 && (
                                  <>
                                      <button
                                          onClick={() => {
                                              const el = document.querySelector('.testimonials-scroll') as HTMLElement | null;
                                              if (!el) return;
                                              const w = el.clientWidth || 320;
                                              const count = Math.min(Array.isArray(testimonials) ? testimonials.length : 0, 2);
                                              const idx = Math.round(el.scrollLeft / w);
                                              const prev = idx - 1 < 0 ? Math.max(0, count - 1) : idx - 1;
                                              el.scrollTo({ left: prev * w, behavior: 'smooth' });
                                          }}
                                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                                          aria-label="Testimonio anterior"
                                      >
                                          <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                          onClick={() => {
                                              const el = document.querySelector('.testimonials-scroll') as HTMLElement | null;
                                              if (!el) return;
                                              const w = el.clientWidth || 320;
                                              const count = Math.min(Array.isArray(testimonials) ? testimonials.length : 0, 2);
                                              const idx = Math.round(el.scrollLeft / w);
                                              const next = idx + 1 >= count ? 0 : idx + 1;
                                              el.scrollTo({ left: next * w, behavior: 'smooth' });
                                          }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                                          aria-label="Testimonio siguiente"
                                      >
                                          <ChevronRight className="w-4 h-4" />
                                      </button>
                                  </>
                              )}
                          </div>
                      ) : (
                          <div className="text-center py-4">
                              <Quote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-500 font-montserrat">
                                  Aún no tienes testimonios configurados
                              </p>
                          </div>
                      )}
                  </div>
              ) : null;
  
          case 'social':
              return (
                  <div className="px-6 py-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                          <Share2 className="w-4 h-4 text-gray-700" />
                          <h3 className="font-bold text-gray-900 font-montserrat text-sm">Redes Sociales</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                          {sanitizedSocialLinks.map((item: { url: string; platformKey: string }) => (
                              <a
                                  key={`${item.platformKey}-${item.url}`}
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                              >
                                  {getSocialIcon(item.platformKey)}
                              </a>
                          ))}
                      </div>
                  </div>
              );
          case 'location':
              return (
                  <div>
                      <div className="px-6 py-4 bg-white">
                          <LocationMapFullsize location={profile.location} className="mt-2" />
                      </div>
                  </div>
              );
          case 'contact':
              return profileData && sections?.show_contact !== false ? (
                  <ContactSection profile={profileData} />
              ) : null;

          default:
              return null;
      }
  };

  return (
      <div className="min-h-screen bg-gray-100">
          <div className="max-w-md mx-auto bg-white shadow-2xl min-h-screen">
              <div className="overflow-y-auto">
                  <div 
                      className="relative px-6 pt-16 pb-8 text-white profile-header-gradient"
                      style={{
                        '--primary-color': colors.primary,
                        '--secondary-color': colors.secondary
                      } as React.CSSProperties}
                  >
                      <div className="absolute inset-0 opacity-10">
                          <div className="w-full h-full bg-gray-700 bg-opacity-30"></div>
                      </div>
  
                      <div className="relative text-center">
                          {/* Avatar (usa profile.profileImage del nuevo esquema) */}
                          <div className="w-28 h-28 mx-auto mb-6 ring-4 ring-white/20 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                              {profile?.profileImage ? (
                                  <img 
                                      src={profile.profileImage} 
                                      alt={profile?.public_name || 'Usuario'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                  />
                              ) : null}
                              <div className={`text-white text-lg font-bold ${profile?.profileImage ? 'hidden' : ''}`}>
                                  {getInitials(profile?.public_name)}
                              </div>
                          </div>
  
                          {/* Nombre */}
                          <h1 className="text-3xl font-bold mb-2 font-montserrat">
                              {profile?.public_name || 'Tu Nombre'}
                          </h1>
  
                          {/* Título/Profesión */}
                          <p className="text-gray-300 font-medium mb-4 text-lg font-montserrat">
                              {profile?.title || profile?.specialty || 'Profesional'}
                          </p>
  
                          {/* Bio */}
                          {profile?.bio && (
                              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto font-montserrat">
                                  {profile?.bio}
                              </p>
                          )}
                      </div>
                  </div>
  
                  {/* Secciones del perfil */}
                  <div className="space-y-0">
                      {sectionOrder.map((sec: string) => (
                          <Fragment key={sec}>{renderSection(sec)}</Fragment>
                      ))}
                  </div>
  
                  {/* Eliminado: Contacto, Redes Sociales y Ubicación duplicados */}
                </div>
              </div>
            </div>
          ); 
}
