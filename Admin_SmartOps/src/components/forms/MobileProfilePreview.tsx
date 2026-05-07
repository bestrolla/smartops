import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { ProfileFormData, SocialPlatform } from '@/types/profile';
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
  Image as ImageIcon,
  Quote,
  Loader2,
  Share2,
  MapPin,
  ChevronLeft,
  ChevronRight
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

import { useAuth } from '@/lib/AuthContext';
import { getActiveServices, formatServicePrice, formatServiceDuration, Service } from '@/lib/servicesApi';
import { getProducts, Product } from '@/lib/productApi';
import { getImageUrl, getValidProfileImage } from '@/lib/api';
import { getTestimonials, Testimonial } from '@/lib/testimonialsApi';
import { getLocation, getPublicLocationBySlug, Location } from '@/lib/locationApi';
import { getAvailability, type Availability } from '@/lib/appointmentsApi';
import { LocationMap } from '@/components/ui/LocationMap';

interface MobileProfilePreviewProps {
  template: ProfileTemplate | null;
  formData: ProfileFormData;
  currentStep: number;
  sectionsConfig?: {
    show_services?: boolean;
    show_products?: boolean;
    show_appointments?: boolean;
    show_stats?: boolean;
    show_testimonials?: boolean;
    show_contact?: boolean;
    show_social?: boolean;
  };
  sectionOrder?: string[];
}

export function MobileProfilePreview({ template, formData, currentStep, sectionsConfig, sectionOrder }: MobileProfilePreviewProps) {

  
  const { auth } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await getActiveServices(1, 3);
      setServices(response?.docs || []);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getProducts({ 
        page: 1, 
        limit: 3, 
        filter: { isActive: true } 
      });
      setProducts(response || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadTestimonials = async () => {
    if (!auth.tenantId) return;
    
    setLoadingTestimonials(true);
    try {
      const response = await getTestimonials(auth.tenantId);
      if (response.success) {
        setTestimonials(response.data);
      } else {
        console.error('Error loading testimonials:', response.message);
        setTestimonials([]);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      setTestimonials([]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const loadLocation = async () => {
    setLoadingLocation(true);
    try {
      const storedSlug = localStorage.getItem('tenantSlug') || undefined;
      const pathSlug = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[0] : undefined;
      const reserved = new Set(['profile','dashboard','admin','settings','sign-in','sign-up']);
      const validSlug = (s?: string) => !!s && !reserved.has(s) && s.length >= 3;
      const slug = validSlug(storedSlug) ? storedSlug : (validSlug(pathSlug) ? pathSlug : undefined);

      if (slug) {
        const resp = await getPublicLocationBySlug(slug);
        if (resp.success) {
          setLocation(resp.data);
          return;
        }
      }

      if (auth.tenantId) {
        const response = await getLocation(auth.tenantId);
        if (response.success) {
          setLocation(response.data);
        } else {
          console.log('No location data available');
          setLocation(null);
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadAvailability = async () => {
    if (!auth.tenantId) return;
    
    setLoadingAvailability(true);
    try {
      const response = await getAvailability(auth.tenantId);
      setAvailability(response);
    } catch (error: any) {
      // Error 404 es normal cuando no hay disponibilidad configurada
      if (error.response?.status === 404) {
        console.log('No hay disponibilidad configurada para este profesional');
      } else {
        console.log('Error al cargar disponibilidad:', error.message);
      }
      setAvailability(null);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    if (sectionsConfig?.show_services && auth.tenantId) {
      loadServices();
    } else {
      setServices([]);
    }
  }, [sectionsConfig?.show_services, auth.tenantId]);

  useEffect(() => {
    if (sectionsConfig?.show_products && auth.tenantId) {
      loadProducts();
    } else {
      setProducts([]);
    }
  }, [sectionsConfig?.show_products, auth.tenantId]);

  useEffect(() => {
    if (sectionsConfig?.show_testimonials && auth.tenantId) {
      loadTestimonials();
    } else {
      setTestimonials([]);
    }
  }, [sectionsConfig?.show_testimonials, auth.tenantId]);

  useEffect(() => {
    loadLocation();
  }, [auth.tenantId]);

  useEffect(() => {
    if (auth.tenantId && formData.appointment_config?.enabled) {
      loadAvailability();
    }
  }, [auth.tenantId, formData.appointment_config?.enabled]);

  const formatProductPrice = (product: Product): string => {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return formatter.format(product.basePrice);
  };

  const formatAvailability = (availability: Availability): string => {
    if (!availability) return 'No configurado';
    
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const activeDays = availability.daysOfWeek.map(day => days[day]).join(', ');
    
    return `${activeDays} - ${availability.startTime} a ${availability.endTime}`;
  };

  // Función para renderizar secciones en el orden correcto
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'header':
        return null; // El header ya se renderiza arriba
      
      case 'stats':
        return sectionsConfig?.show_stats && formData.stats && formData.stats.length > 0 ? (
          <div key="stats" className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                Estadísticas
              </h3>
                    </div>
            <div className="grid grid-cols-2 gap-3">
                {formData.stats.slice(0, 4).map((stat, index) => (
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
        ) : null;

      case 'services':
        return sectionsConfig?.show_services ? (
          <div key="services" className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-gray-700" />
                  <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                    Servicios
                  </h3>
            </div>
            
            {loadingServices ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-gray-500 font-montserrat">
                  Cargando servicios...
                </p>
              </div>
            ) : (services && Array.isArray(services) && services.length > 0) ? (
              <Slider className="w-full" showArrows={services.length > 1} autoPlay={true} interval={4000}>
                {services.map((service) => (
                  <Card key={service._id} className="p-4 border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            {service.name.includes('Consulta') ? '🩺' : 
                             service.name.includes('Urgencia') ? '🚨' : 
                             service.name.includes('Preventiva') ? '🛡️' : '📋'}
                          </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold font-montserrat text-gray-900">
                          {service.name}
                        </h4>
                        <p className="text-xs text-gray-600 font-montserrat mt-1">
                          {service.description && service.description.length > 60 
                            ? `${service.description.substring(0, 60)}...` 
                            : service.description || 'Sin descripción'
                          }
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-bold text-gray-900 font-montserrat">
                            {formatServicePrice(service)}
                          </span>
                          <span className="text-xs text-gray-500 font-montserrat">
                            ⏱ {formatServiceDuration(service.duration)}
                          </span>
                        </div>
                      </div>
                        </div>
                      </Card>
                ))}
              </Slider>
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
        return sectionsConfig?.show_products ? (
          <div key="products" className="px-6 py-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                Productos
              </h3>
            </div>
            
            {loadingProducts ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-gray-500 font-montserrat">
                  Cargando productos...
                </p>
              </div>
            ) : (products && Array.isArray(products) && products.length > 0) ? (
              <Slider className="w-full" showArrows={products.length > 1} autoPlay={true} interval={4000}>
                {products.map((product) => (
                  <Card key={product.id} className="p-3 border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-start gap-3">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={getImageUrl(product.images[0])} 
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-sm font-bold font-montserrat text-gray-900">
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-600 font-montserrat mt-1">
                          SKU: {product.sku}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-bold text-gray-900 font-montserrat">
                            {formatProductPrice(product)}
                          </span>
                          {product.stock !== undefined && (
                            <span className={`text-xs font-montserrat ${
                              product.stock > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {product.stock > 0 ? `${product.stock} en stock` : 'Sin stock'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Slider>
            ) : (
            <div className="text-center py-4">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-montserrat">
                  Aún no tienes productos configurados
              </p>
            </div>
            )}
          </div>
        ) : null;

      case 'testimonials':
        return sectionsConfig?.show_testimonials ? (
          <div key="testimonials" className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Quote className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                Testimonios
              </h3>
            </div>
            
            {loadingTestimonials ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-gray-500 font-montserrat">
                  Cargando testimonios...
                </p>
              </div>
            ) : testimonials && Array.isArray(testimonials) && testimonials.length > 0 ? (
              <div className="space-y-2">
                {/* Debug info - remove in production */}
                <div className="text-xs text-gray-500 mb-2">
                  Total testimonios: {testimonials.length} | Mostrando últimos: {Math.min(testimonials.length, 2)}
                </div>
                
                {/* Try Slider first, fallback to grid if issues */}
                <div className="hidden sm:block">
                  <div className="relative">
                    <div 
                      className="flex space-x-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    >
                      {testimonials.slice(-2).map((testimonial, index) => (
                        <Card key={index} className="p-4 border border-gray-200 bg-white min-w-[300px] min-h-[120px] flex-shrink-0">
                          <div className="flex flex-col h-full">
                            {/* Nombre centrado arriba */}
                            <div className="text-center mb-3">
                              <span className="font-semibold text-sm text-gray-800 font-montserrat">
                                {testimonial.name || 'Anónimo'}
                              </span>
                            </div>
                            
                            {/* Contenido del testimonio en el medio */}
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
                            
                            {/* Estrellas centradas abajo */}
                            <div className="text-center mt-3">
                              <div className="text-yellow-500">
                                {Array.from({ length: testimonial.rating || 0 }, (_, i) => (
                                  <Star key={i} className="w-4 h-4 inline-block fill-current text-yellow-500" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Navigation arrows for testimonials - moved below */}
                    {testimonials.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const container = document.querySelector('.overflow-x-auto');
                            if (container) {
                              container.scrollBy({ left: -320, behavior: 'smooth' });
                            }
                          }}
                          className="absolute left-2 bottom-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10 border border-gray-200"
                          aria-label="Testimonio anterior"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const container = document.querySelector('.overflow-x-auto');
                            if (container) {
                              container.scrollBy({ left: 320, behavior: 'smooth' });
                            }
                          }}
                          className="absolute right-2 bottom-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 z-10 border border-gray-200"
                          aria-label="Testimonio siguiente"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Alternative: Simple manual navigation for testimonials */}
                {testimonials.length > 1 && (
                  <div className="hidden sm:flex justify-center mt-3 space-x-2">
                    {testimonials.slice(0, 2).map((_, index) => (
                      <button
                        key={index}
                        className="w-2 h-2 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                        aria-label={`Testimonio ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Mobile/fallback grid layout */}
                <div className="sm:hidden grid grid-cols-1 gap-3">
                  {testimonials.slice(-2).map((testimonial, index) => (
                    <Card key={index} className="p-4 border border-gray-200 bg-white">
                      <div className="flex flex-col">
                        {/* Nombre centrado arriba */}
                        <div className="text-center mb-3">
                          <span className="font-semibold text-sm text-gray-800 font-montserrat">
                            {testimonial.name || 'Anónimo'}
                          </span>
                        </div>
                        
                        {/* Contenido del testimonio en el medio */}
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
                        
                        {/* Estrellas centradas abajo */}
                        <div className="text-center mt-3">
                          <div className="text-yellow-500">
                            {Array.from({ length: testimonial.rating || 0 }, (_, i) => (
                              <Star key={i} className="w-4 h-4 inline-block fill-current text-yellow-500" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Quote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-montserrat">
                  Aún no tienes testimonios
                </p>
              </div>
            )}
          </div>
        ) : null;

      case 'contact':
        return sectionsConfig?.show_contact ? (
          <div key="contact" className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                Contacto
              </h3>
            </div>
            <div className="space-y-2">
              {/* Mostrar emails */}
              {formData.contact?.emails && formData.contact.emails.length > 0 && (
                formData.contact.emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700 font-montserrat">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{email.email}</span>
                    {email.type && (
                      <span className="text-xs text-gray-500">({email.type})</span>
                    )}
                  </div>
                ))
              )}
              
              {/* Mostrar teléfonos */}
              {formData.contact?.phones && formData.contact.phones.length > 0 && (
                formData.contact.phones.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700 font-montserrat">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{phone.phone}</span>
                    {phone.type && (
                      <span className="text-xs text-gray-500">({phone.type})</span>
                    )}
                  </div>
                ))
              )}
              
              {/* Mostrar website */}
              {formData.contact?.website && (
                <div className="flex items-center gap-2 text-sm text-gray-700 font-montserrat">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <a 
                    href={formData.contact.website.startsWith('http') ? formData.contact.website : `https://${formData.contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {formData.contact.website}
                  </a>
                </div>
              )}
              
              {/* Mensaje si no hay contactos */}
              {(!formData.contact?.emails || formData.contact.emails.length === 0) && 
               (!formData.contact?.phones || formData.contact.phones.length === 0) && 
               !formData.contact?.website && (
                <div className="text-center py-4">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-montserrat">
                    Aún no has configurado tu información de contacto
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null;

      case 'location':
        return (
          <div key="location" className="px-6 py-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                Ubicación
              </h3>
            </div>
            
            {loadingLocation ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-gray-500 font-montserrat">
                  Cargando ubicación...
                </p>
              </div>
            ) : location ? (
              <LocationMap location={location} />
            ) : (
              <div className="text-center py-4">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-montserrat">
                  Aún no has configurado tu ubicación
                </p>
              </div>
            )}
          </div>
        );

      case 'social':
        return sectionsConfig?.show_social && formData.social_links && formData.social_links.length > 0 ? (
          <div key="social" className="px-6 py-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-gray-700" />
              <h3 className="font-bold text-gray-900 font-montserrat text-sm">
                Redes Sociales
            </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {formData.social_links.map((link, index) => (
                <a
                    key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                >
                  {getSocialIcon(link.platform)}
                  <span className="text-xs font-montserrat font-medium">{link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null;

      case 'appointments':
        const shouldShow = sectionsConfig?.show_appointments && formData.appointment_config?.enabled;
        return shouldShow ? (
          <div key="appointments" className="px-6 py-4 bg-white">
            <div 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 text-white text-center"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold font-montserrat">
                  {formData.appointment_config?.title || 'Agendar Cita'}
                </h3>
                <h4 className="text-sm font-semibold text-gray-200 font-montserrat">
                  {formData.appointment_config?.subtitle || '¿Listo para comenzar?'}
                </h4>
                <p className="text-xs text-gray-300 font-montserrat max-w-xs leading-relaxed">
                  {formData.appointment_config?.description || 'Agenda una consulta gratuita y descubre cómo puedo ayudarte a transformar tu presencia digital.'}
                </p>
                <button 
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-4 py-2 rounded-lg shadow-lg text-sm font-montserrat transition-colors"
                  onClick={() => {
                    const tenantId = auth?.tenantId || 'current-tenant';
                    window.open(`/appointments?professional=${tenantId}&action=book`, '_blank');
                  }}
                >
                  {formData.appointment_config?.button_text || 'Agendar Consulta Gratuita'}
                </button>
                {loadingAvailability ? (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-gray-400 font-montserrat">
                      Cargando horarios...
                    </p>
                  </div>
                ) : availability ? (
                  <div className="mt-2 bg-white/10 rounded-lg p-2">
                    <p className="text-xs text-gray-300 font-montserrat text-center">
                      📅 Disponible: {formatAvailability(availability)}
                    </p>
                    <p className="text-xs text-gray-400 font-montserrat text-center mt-1">
                      Citas de {availability.slotDuration} minutos
                    </p>
                  </div>
                ) : formData.appointment_config?.availability_message ? (
                  <p className="text-xs text-gray-400 font-montserrat mt-2 text-center">
                    {formData.appointment_config?.availability_message}
                  </p>
                ) : (
                  <div className="mt-2 bg-white/10 rounded-lg p-2">
                    <p className="text-xs text-gray-300 font-montserrat text-center">
                      📅 Configura tu disponibilidad para mostrar horarios
                    </p>
                    <p className="text-xs text-gray-400 font-montserrat text-center mt-1">
                      Los clientes verán tus horarios aquí
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  // Template por defecto si no hay template
  const defaultTemplate: ProfileTemplate = {
    id: 'default',
    name: 'Default',
    description: 'Default template',
    profession: 'Professional',
    style: 'modern',
    image: '/templates/default.jpg',
    preview_url: '/templates/default.jpg',
    colors: {
      primary: '#3B82F6',
      secondary: '#1F2937',
      accent: '#F59E0B'
    },
    layout: {
      header: 'light',
      stats: 'minimal',
      services: 'minimal',
      testimonials: 'minimal'
    }
  };

  const displayTemplate = template || defaultTemplate;

  const getThemeColors = () => {
    // Priorizar los colores del tema guardado en la base de datos
        if (formData.theme && formData.theme.primary_color) {
      return {
        primary: formData.theme.primary_color,
        secondary: formData.theme.secondary_color || formData.theme.primary_color,
        accent: formData.theme.accent_color || displayTemplate.colors.accent
      };
    }
    // Si no hay colores del tema, usar los del template
    
    return {
      primary: displayTemplate.colors.primary,
      secondary: displayTemplate.colors.secondary,
      accent: displayTemplate.colors.accent
    };
  };

  const colors = getThemeColors();

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <FaLinkedinIn className="w-4 h-4" />;
      case 'twitter': return <FaTwitter className="w-4 h-4" />;
      case 'instagram': return <FaInstagram className="w-4 h-4" />;
      case 'facebook': return <FaFacebookF className="w-4 h-4" />;
      case 'tiktok': return <FaTiktok className="w-4 h-4" />;
      case 'youtube': return <span className="w-4 h-4 text-red-500">▶️</span>;
      case 'github': return <span className="w-4 h-4">💻</span>;
      case 'behance': return <span className="w-4 h-4 text-blue-600">🎨</span>;
      case 'dribbble': return <span className="w-4 h-4 text-pink-500">🏀</span>;
      case 'pinterest': return <span className="w-4 h-4 text-red-600">📌</span>;
      case 'snapchat': return <span className="w-4 h-4 text-yellow-400">👻</span>;
      case 'telegram': return <span className="w-4 h-4 text-blue-500">✈️</span>;
      case 'whatsapp': return <FaWhatsapp className="w-4 h-4" />;
      case 'discord': return <span className="w-4 h-4 text-indigo-600">🎮</span>;
      case 'twitch': return <span className="w-4 h-4 text-purple-600">📺</span>;
      case 'reddit': return <span className="w-4 h-4 text-orange-600">🤖</span>;
      case 'medium': return <span className="w-4 h-4">📝</span>;
      case 'substack': return <span className="w-4 h-4 text-orange-500">📰</span>;
      case 'patreon': return <span className="w-4 h-4 text-orange-500">🎭</span>;
      case 'onlyfans': return <span className="w-4 h-4 text-blue-500">💙</span>;
      case 'spotify': return <span className="w-4 h-4 text-green-500">🎵</span>;
      case 'soundcloud': return <span className="w-4 h-4 text-orange-500">🎶</span>;
      case 'website': return <FaGlobe className="w-4 h-4" />;
      case 'blog': return <span className="w-4 h-4">📖</span>;
      case 'portfolio': return <span className="w-4 h-4">💼</span>;
      case 'custom': return <FaLink className="w-4 h-4" />;
      default: return <FaLink className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-80 h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 relative">
      {/* Barra de estado del móvil */}
      <div className="bg-black text-white text-xs px-6 py-1 flex justify-between items-center">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 bg-white rounded-sm"></div>
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Contenido del perfil con scroll automático */}
      <div className="h-full overflow-y-auto scrollbar-auto">
        {/* Header con gradiente y colores del tema */}
        <div 
          className="relative px-6 pt-16 pb-8 text-white"
          style={{
            background: `linear-gradient(to bottom, ${colors.primary}, ${colors.secondary})`
          }}
        >
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full bg-gray-700 bg-opacity-30"></div>
          </div>

          <div className="relative text-center">
            <Avatar className="w-28 h-28 mx-auto mb-6 ring-4 ring-white/20">
              <AvatarImage 
                src={getValidProfileImage(formData.profile_image)} 
                alt={formData.public_name}
                onError={(e) => {
                  console.error('❌ Avatar image failed to load');
                  console.error('Image path:', formData.profile_image);
                  console.error('Image URL:', getValidProfileImage(formData.profile_image));
                  console.error('Error details:', e);
                  
                  // Intentar cargar una imagen de fallback
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('localhost:5001')) {
                    console.log('🔄 Intentando cargar imagen de fallback...');
                    target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face';
                  }
                }}
              />
              <AvatarFallback className="bg-gray-600 text-white text-lg">
                {formData.public_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-3xl font-bold mb-2">
              {formData.public_name || 'Tu Nombre'}
            </h1>

            <p className="text-gray-300 font-medium mb-4 text-lg">
              {formData.title || displayTemplate.profession}
            </p>

            {formData.bio && (
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                {formData.bio}
              </p>
            )}

            {/* Decoración inferior */}
            <div className="flex justify-center mt-6">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del perfil */}
        <div className="space-y-0">
          {/* Renderizar secciones en el orden especificado */}
          {(() => {
            const sections = sectionOrder || ['header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments'];
            console.log('🔍 MobileProfilePreview sections to render:', sections);
            console.log('🔍 MobileProfilePreview sectionsConfig:', sectionsConfig);
            console.log('🔍 MobileProfilePreview formData.appointment_config:', formData.appointment_config);
            
            return sections.map((sectionId) => {
              const renderedSection = renderSection(sectionId);
              console.log(`🔍 Section "${sectionId}" rendered:`, renderedSection !== null);
              return renderedSection;
            });
          })()}
          
          {/* Espacio adicional al final para mejor visualización */}
          <div className="pb-4"></div>
        </div>
      </div>
      </div>
  );
}
