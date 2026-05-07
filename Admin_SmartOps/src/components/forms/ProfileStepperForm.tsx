import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Star,
  Camera,
  Link2,
  Palette
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
import { ProfileFormData, SocialPlatform, Service, SocialLink } from '@/types/profile';

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
}

interface ProfileStepperFormProps {
  step: string;
  formData: ProfileFormData;
  selectedTemplate: ProfileTemplate | null;
  onFormDataChange: (data: Partial<ProfileFormData>) => void;
}

export function ProfileStepperForm({
  step,
  formData,
  selectedTemplate,
  onFormDataChange
}: ProfileStepperFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        onFormDataChange({ profile_image: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const addSocialLink = () => {
    const newLink: SocialLink = {
      platform: 'linkedin' as SocialPlatform,
      url: '',
      display_name: ''
    };
    onFormDataChange({
      social_links: [...formData.social_links, newLink]
    });
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const updatedLinks = [...formData.social_links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    onFormDataChange({ social_links: updatedLinks });
  };

  const removeSocialLink = (index: number) => {
    const updatedLinks = formData.social_links.filter((_, i) => i !== index);
    onFormDataChange({ social_links: updatedLinks });
  };

  const addStat = () => {
    const newStat = { label: '', value: '' };
    onFormDataChange({
      stats: [...formData.stats, newStat]
    });
  };

  const updateStat = (index: number, field: string, value: string) => {
    const updatedStats = [...formData.stats];
    updatedStats[index] = { ...updatedStats[index], [field]: value };
    onFormDataChange({ stats: updatedStats });
  };

  const removeStat = (index: number) => {
    const updatedStats = formData.stats.filter((_, i) => i !== index);
    onFormDataChange({ stats: updatedStats });
  };

  const addService = () => {
    const newService = {
      name: '',
      description: '',
      price: '',
      duration: ''
    };
    onFormDataChange({
      services: [...formData.services, newService]
    });
  };

  const updateService = (index: number, field: string, value: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    onFormDataChange({ services: updatedServices });
  };

  const removeService = (index: number) => {
    const updatedServices = formData.services.filter((_, i) => i !== index);
    onFormDataChange({ services: updatedServices });
  };

  const addTestimonial = () => {
    const newTestimonial = {
      name: '',
      role: '',
      content: [''],
      rating: 5
    };
    onFormDataChange({
      testimonials: [...formData.testimonials, newTestimonial]
    });
  };

  const updateTestimonial = (index: number, field: string, value: string | number) => {
    const updatedTestimonials = [...formData.testimonials];
    updatedTestimonials[index] = { ...updatedTestimonials[index], [field]: value };
    onFormDataChange({ testimonials: updatedTestimonials });
  };

  const removeTestimonial = (index: number) => {
    const updatedTestimonials = formData.testimonials.filter((_, i) => i !== index);
    onFormDataChange({ testimonials: updatedTestimonials });
  };

  const socialPlatforms: Array<{
    value: SocialPlatform;
    label: string;
    Icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  }> = [
    { value: 'linkedin', label: 'LinkedIn', Icon: FaLinkedinIn },
    { value: 'twitter', label: 'Twitter', Icon: FaTwitter },
    { value: 'instagram', label: 'Instagram', Icon: FaInstagram },
    { value: 'facebook', label: 'Facebook', Icon: FaFacebookF },
    { value: 'tiktok', label: 'TikTok', Icon: FaTiktok },
    { value: 'whatsapp', label: 'WhatsApp', Icon: FaWhatsapp },
    { value: 'website', label: 'Sitio Web', Icon: FaGlobe },
    { value: 'custom', label: 'Personalizado', Icon: FaLink }
  ];

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2">
          Información Básica
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Completa tu información personal y profesional
        </p>
      </div>

      {/* Imagen de perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-montserrat">
            <Camera className="w-5 h-5" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {formData.profile_image ? (
                <img
                  src={formData.profile_image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="font-montserrat"
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir Imagen
              </Button>
              <p className="text-sm text-gray-500 mt-2 font-montserrat">
                Recomendado: 400x400px, formato JPG o PNG
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="font-montserrat">Nombre Público *</Label>
          <Input
            value={formData.public_name}
            onChange={(e) => onFormDataChange({ public_name: e.target.value })}
            placeholder="Tu nombre completo"
            className="mt-2 font-montserrat"
          />
        </div>
        <div>
          <Label className="font-montserrat">Título Profesional *</Label>
          <Input
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            placeholder="Ej: Diseñador Web, Doctor, etc."
            className="mt-2 font-montserrat"
          />
        </div>
      </div>

      <div>
        <Label className="font-montserrat">Especialidad (Opcional)</Label>
        <Input
          value={formData.specialty || ''}
          onChange={(e) => onFormDataChange({ specialty: e.target.value })}
          placeholder="Ej: Medicina Interna, UX/UI Design, etc."
          className="mt-2 font-montserrat"
        />
      </div>

      <div>
        <Label className="font-montserrat">Biografía *</Label>
        <Textarea
          value={formData.bio}
          onChange={(e) => onFormDataChange({ bio: e.target.value })}
          placeholder="Cuéntanos sobre ti, tu experiencia y lo que te apasiona..."
          rows={4}
          className="mt-2 font-montserrat"
        />
        <p className="text-sm text-gray-500 mt-1 font-montserrat">
          {formData.bio.length}/500 caracteres
        </p>
      </div>
    </div>
  );

  const renderContactStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2">
          Información de Contacto
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Agrega tus datos de contacto para que puedan comunicarse contigo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="flex items-center gap-2 font-montserrat">
            <Mail className="w-4 h-4" />
            Email de Contacto
          </Label>
          <Input
            type="email"
            value={formData.contact.emails?.[0]?.email ?? ''}
            onChange={(e) => onFormDataChange({
              contact: {
                ...formData.contact,
                emails: [
                  {
                    ...(formData.contact.emails?.[0] || { email: '', type: 'personal' }),
                    email: e.target.value
                  },
                  ...(formData.contact.emails?.slice(1) || [])
                ]
              }
            })}
            placeholder="tu@email.com"
            className="mt-2 font-montserrat"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2 font-montserrat">
            <Phone className="w-4 h-4" />
            Teléfono
          </Label>
          <Input
            value={formData.contact.emails?.[0]?.email ?? ''}
            onChange={(e) =>
                onFormDataChange({
                    contact: {
                        ...formData.contact,
                        emails: [
                            {
                                ...(formData.contact.emails?.[0] || { email: '', type: 'personal' }),
                                email: e.target.value
                            },
                            ...(formData.contact.emails?.slice(1) || [])
                        ]
                    }
                })
            }
        />
        <Input
            value={formData.contact.phones?.[0]?.phone ?? ''}
            onChange={(e) =>
                onFormDataChange({
                    contact: {
                        ...formData.contact,
                        phones: [
                            {
                                ...(formData.contact.phones?.[0] || { phone: '', type: 'mobile' }),
                                phone: e.target.value
                            },
                            ...(formData.contact.phones?.slice(1) || [])
                        ]
                    }
                })
            }
        />
        </div>
      </div>

      <div>
        <Label className="flex items-center gap-2 font-montserrat">
          <Globe className="w-4 h-4" />
          Sitio Web
        </Label>
        <Input
          value={formData.contact.website}
          onChange={(e) => onFormDataChange({
            contact: { ...formData.contact, website: e.target.value }
          })}
          placeholder="https://tuweb.com"
          className="mt-2 font-montserrat"
        />
      </div>

      {/* Estadísticas/Logros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-montserrat">
              <Star className="w-5 h-5" />
              Estadísticas y Logros
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addStat}
              className="font-montserrat"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.stats.length === 0 ? (
            <p className="text-gray-500 text-center py-4 font-montserrat">
              Agrega estadísticas para mostrar tus logros (ej: "150+ Proyectos", "5 Años de Experiencia")
            </p>
          ) : (
            <div className="space-y-3">
              {formData.stats.map((stat, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Input
                    placeholder="Etiqueta (ej: Proyectos)"
                    value={stat.label}
                    onChange={(e) => updateStat(index, 'label', e.target.value)}
                    className="flex-1 font-montserrat"
                  />
                  <Input
                    placeholder="Valor (ej: 150+)"
                    value={stat.value}
                    onChange={(e) => updateStat(index, 'value', e.target.value)}
                    className="flex-1 font-montserrat"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStat(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSocialStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2">
          Redes Sociales
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Conecta tus perfiles sociales y profesionales
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-montserrat">
              <Link2 className="w-5 h-5" />
              Enlaces Sociales
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addSocialLink}
              className="font-montserrat"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Red Social
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.social_links.length === 0 ? (
            <p className="text-gray-500 text-center py-4 font-montserrat">
              Agrega tus perfiles sociales para que puedan encontrarte en otras plataformas
            </p>
          ) : (
            <div className="space-y-4">
              {formData.social_links.map((link, index) => (
                <Card key={index} className="p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="font-montserrat text-sm">Plataforma</Label>
                      <Select
                        value={link.platform}
                        onValueChange={(value) => updateSocialLink(index, 'platform', value)}
                      >
                        <SelectTrigger className="mt-1 font-montserrat">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const platform = socialPlatforms.find(p => p.value === link.platform);
                              if (platform) {
                                const IconComponent = platform.Icon;
                                return (
                                  <IconComponent 
                                    style={{ color: selectedTemplate?.colors.primary }}
                                    className="w-4 h-4"
                                  />
                                );
                              }
                              return null;
                            })()}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {socialPlatforms.map((platform) => (
                            <SelectItem 
                              key={platform.value} 
                              value={platform.value}
                              className="flex items-center gap-2"
                            >
                              <platform.Icon className="w-4 h-4" />
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-montserrat text-sm">URL</Label>
                      <div className="flex gap-2 mt-1">
                        <div 
                          className="flex items-center justify-center w-10 h-10 rounded-lg"
                          style={{ 
                            backgroundColor: selectedTemplate?.colors.primary,
                            color: 'white'
                          }}
                        >
                          {(() => {
                            const platform = socialPlatforms.find(p => p.value === link.platform);
                            if (platform) {
                              const IconComponent = platform.Icon;
                              return <IconComponent className="w-5 h-5" />;
                            }
                            return null;
                          })()}
                        </div>
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          placeholder={`https://${link.platform}.com/...`}
                          className="font-montserrat flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="font-montserrat text-sm">Nombre (opcional)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={link.display_name || ''}
                          onChange={(e) => updateSocialLink(index, 'display_name', e.target.value)}
                          placeholder="Nombre personalizado"
                          className="font-montserrat"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSocialLink(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContentStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2">
          Contenido del Perfil
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Agrega servicios, testimonios y contenido adicional
        </p>
      </div>

      {/* Servicios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-montserrat">Servicios</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addService}
              className="font-montserrat"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.services.length === 0 ? (
            <p className="text-gray-500 text-center py-4 font-montserrat">
              Agrega los servicios que ofreces
            </p>
          ) : (
            <div className="space-y-4">
              {formData.services.map((service, index) => (
                <Card key={index} className="p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Nombre del servicio"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        className="flex-1 font-montserrat"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Descripción del servicio"
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      rows={2}
                      className="font-montserrat"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Precio (opcional)"
                        value={service.price || ''}
                        onChange={(e) => updateService(index, 'price', e.target.value)}
                        className="font-montserrat"
                      />
                      <Input
                        placeholder="Duración (opcional)"
                        value={service.duration || ''}
                        onChange={(e) => updateService(index, 'duration', e.target.value)}
                        className="font-montserrat"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-montserrat">Testimonios</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addTestimonial}
              className="font-montserrat"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Testimonio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {formData.testimonials.length === 0 ? (
            <p className="text-gray-500 text-center py-4 font-montserrat">
              Agrega testimonios de tus clientes
            </p>
          ) : (
            <div className="space-y-4">
              {formData.testimonials.map((testimonial, index) => (
                <Card key={index} className="p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Nombre del cliente"
                        value={testimonial.name}
                        onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                        className="flex-1 font-montserrat"
                      />
                      <Input
                        placeholder="Cargo/Empresa"
                        value={testimonial.role}
                        onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                        className="flex-1 font-montserrat"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestimonial(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Testimonio del cliente"
                      value={testimonial.content}
                      onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                      rows={3}
                      className="font-montserrat"
                    />
                    <div className="flex items-center gap-2">
                      <Label className="font-montserrat">Calificación:</Label>
                      <Select
                        value={testimonial.rating.toString()}
                        onValueChange={(value) => updateTestimonial(index, 'rating', parseInt(value))}
                      >
                        <SelectTrigger className="w-32 font-montserrat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map(rating => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {'⭐'.repeat(rating)} ({rating})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-montserrat text-smartops-dark mb-2">
          Configuración Final
        </h2>
        <p className="text-smartops-dark/70 font-montserrat">
          Personaliza los colores y ajustes finales de tu perfil
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-montserrat">
            <Palette className="w-5 h-5" />
            Personalización del Tema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-montserrat">Template Base</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                {selectedTemplate && (
                  <>
                    <img
                      src={selectedTemplate.image}
                      alt={selectedTemplate.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold font-montserrat">{selectedTemplate.name}</h4>
                      <p className="text-sm text-gray-600 font-montserrat">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="font-montserrat">Color Primario</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={formData.theme.primary_color}
                  onChange={(e) => onFormDataChange({
                    theme: { ...formData.theme, primary_color: e.target.value }
                  })}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.theme.primary_color}
                  onChange={(e) => onFormDataChange({
                    theme: { ...formData.theme, primary_color: e.target.value }
                  })}
                  placeholder="#3182ce"
                  className="font-montserrat"
                />
              </div>
            </div>

            <div>
              <Label className="font-montserrat">Color Secundario</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={formData.theme.secondary_color}
                  onChange={(e) => onFormDataChange({
                    theme: { ...formData.theme, secondary_color: e.target.value }
                  })}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.theme.secondary_color}
                  onChange={(e) => onFormDataChange({
                    theme: { ...formData.theme, secondary_color: e.target.value }
                  })}
                  placeholder="#bee3f8"
                  className="font-montserrat"
                />
              </div>
            </div>

            <div>
              <Label className="font-montserrat">Color de Acento</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={formData.theme.accent_color}
                  onChange={(e) => onFormDataChange({
                    theme: { ...formData.theme, accent_color: e.target.value }
                  })}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.theme.accent_color}
                  onChange={(e) => onFormDataChange({
                    theme: { ...formData.theme, accent_color: e.target.value }
                  })}
                  placeholder="#ffffff"
                  className="font-montserrat"
                />
              </div>
            </div>

            <div>
              <Label className="font-montserrat">Estilo de Layout</Label>
              <Select
                value={formData.theme.layout_style}
                onValueChange={(value) => onFormDataChange({
                  theme: { ...formData.theme, layout_style: value }
                })}
              >
                <SelectTrigger className="mt-2 font-montserrat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Moderno</SelectItem>
                  <SelectItem value="classic">Clásico</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                  <SelectItem value="creative">Creativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-bold text-green-800 font-montserrat mb-2">
              ✅ Tu perfil está listo para publicar
            </h4>
            <p className="text-green-700 font-montserrat text-sm">
              Revisa la vista previa a la derecha y haz click en "Finalizar" para crear tu perfil profesional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (step) {
    case 'basic':
      return renderBasicInfoStep();
    case 'contact':
      return renderContactStep();
    case 'social':
      return renderSocialStep();
    case 'content':
      return renderContentStep();
    case 'settings':
      return renderSettingsStep();
    default:
      return <div>Paso no encontrado</div>;
  }
}