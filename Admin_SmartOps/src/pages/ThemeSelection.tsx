import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  Check, 
  Palette,
  Star,
  Users,
  Eye,
  Loader2
} from 'lucide-react';
import { profileThemesApi, ProfileTheme } from '@/lib/profileThemesApi';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function ThemeSelection() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [themes, setThemes] = useState<ProfileTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ProfileTheme | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      // Intentar cargar desde el API
      const response = await profileThemesApi.getThemes({ limit: 50 });
      
      if (response.success && response.data?.themes) {
        setThemes(response.data.themes);
      } else {
        // Datos de ejemplo si el API no funciona
        const exampleThemes: ProfileTheme[] = [
          {
            id: 'designer-modern',
            name: 'Diseñador Moderno',
            description: 'Tema elegante y minimalista para diseñadores profesionales',
            profession: 'Diseñador Web',
            style: 'Moderno y Elegante',
            image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
            preview_url: '/designer-modern',
            colors: {
              primary: '#2563eb',
              secondary: '#1e40af',
              accent: '#ffffff'
            },
            layout: {
              header: 'modern',
              stats: 'minimal',
              services: 'grid',
              testimonials: 'cards'
            },
            default_sections: {
              show_stats: true,
              show_testimonials: true,
              show_contact: true,
              show_social: true,
              show_services: true,
              show_products: false,
              show_appointments: false
            },
            sample_data: {
              name: 'Carlos Rodríguez',
              title: 'Diseñador Web Senior',
              specialty: 'UX/UI Design',
              bio: 'Diseñador web con 8 años de experiencia creando experiencias digitales únicas.',
              stats: [
                { label: 'Proyectos', value: '150+' },
                { label: 'Clientes', value: '80+' },
                { label: 'Años', value: '8' }
              ],
              contact: {
                email: 'carlos@designer.com',
                phone: '+1 234 567 8900',
                website: 'https://carlosdesigner.com'
              },
              social_links: [
                { platform: 'linkedin', url: 'https://linkedin.com/in/carlos', display_name: 'LinkedIn' },
                { platform: 'twitter', url: 'https://twitter.com/carlos', display_name: 'Twitter' }
              ]
            },
            category: 'designer',
            tags: ['moderno', 'elegante', 'minimalista'],
            usage: {
              total_profiles: 45,
              rating: 4.8,
              reviews: []
            }
          },
          {
            id: 'consultant-professional',
            name: 'Consultor Profesional',
            description: 'Tema corporativo para consultores y asesores empresariales',
            profession: 'Consultor Empresarial',
            style: 'Profesional y Corporativo',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
            preview_url: '/consultant-professional',
            colors: {
              primary: '#1f2937',
              secondary: '#374151',
              accent: '#f59e0b'
            },
            layout: {
              header: 'corporate',
              stats: 'detailed',
              services: 'list',
              testimonials: 'quotes'
            },
            default_sections: {
              show_stats: true,
              show_testimonials: true,
              show_contact: true,
              show_social: true,
              show_services: true,
              show_products: false,
              show_appointments: true
            },
            sample_data: {
              name: 'María González',
              title: 'Consultora Empresarial',
              specialty: 'Estrategia y Transformación',
              bio: 'Consultora especializada en transformación digital y estrategia empresarial.',
              stats: [
                { label: 'Empresas', value: '25+' },
                { label: 'Proyectos', value: '120+' },
                { label: 'Años', value: '12' }
              ],
              contact: {
                email: 'maria@consulting.com',
                phone: '+1 234 567 8901',
                website: 'https://mariaconsulting.com'
              },
              social_links: [
                { platform: 'linkedin', url: 'https://linkedin.com/in/maria', display_name: 'LinkedIn' }
              ]
            },
            category: 'consultant',
            tags: ['profesional', 'corporativo', 'confiable'],
            usage: {
              total_profiles: 32,
              rating: 4.9,
              reviews: []
            }
          }
        ];
        
        setThemes(exampleThemes);
      }
    } catch (error) {
      console.error('Error cargando temas:', error);
      setError('Error al cargar los temas');
      toast.error('Error al cargar los temas');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = (theme: ProfileTheme) => {
    setSelectedTheme(theme);
  };

  const handleContinue = () => {
    if (selectedTheme) {
      localStorage.setItem('selectedTheme', JSON.stringify(selectedTheme));
      navigate('/profile', { 
        state: { 
          selectedTheme,
          step: 'theme-selected'
        } 
      });
    }
  };

  const filteredThemes = themes.filter(theme => {
    const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         theme.profession.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || theme.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const popularThemes = themes.filter(theme => theme.usage.total_profiles > 0)
    .sort((a, b) => b.usage.total_profiles - a.usage.total_profiles)
    .slice(0, 6);

  const categories = Array.from(new Set(themes.map(theme => theme.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-smartops-blue" />
              <p className="text-lg text-gray-600">Cargando temas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-smartops-gray-light p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={loadThemes} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-purple rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sparkles className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold font-montserrat">
                  Selecciona tu tema de perfil
                </h1>
                <p className="text-blue-100 font-montserrat">
                  Elige un tema que represente tu estilo profesional
                </p>
              </div>
            </div>
            {selectedTheme && (
              <Button 
                onClick={handleContinue}
                className="bg-white text-smartops-blue hover:bg-gray-100"
              >
                Continuar con el perfil
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar temas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos los temas ({filteredThemes.length})</TabsTrigger>
            <TabsTrigger value="popular">Populares ({popularThemes.length})</TabsTrigger>
            <TabsTrigger value="categories">Por categoría</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredThemes.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-600">No se encontraron temas</p>
                <p className="text-sm text-gray-500">Intenta cambiar los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={selectedTheme?.id === theme.id}
                    onSelect={() => handleThemeSelect(theme)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            {popularThemes.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-600">No hay temas populares aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {popularThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isSelected={selectedTheme?.id === theme.id}
                    onSelect={() => handleThemeSelect(theme)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-8">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg text-gray-600">No hay categorías disponibles</p>
              </div>
            ) : (
              categories.map((category) => {
                const categoryThemes = themes.filter(theme => theme.category === category);
                
                return (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      <h3 className="text-lg font-semibold capitalize">{category}</h3>
                      <Badge variant="secondary">{categoryThemes.length} temas</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categoryThemes.map((theme) => (
                        <ThemeCard
                          key={theme.id}
                          theme={theme}
                          isSelected={selectedTheme?.id === theme.id}
                          onSelect={() => handleThemeSelect(theme)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Mensaje de ayuda */}
        <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-montserrat">
            <strong>💡 Consejo:</strong> Puedes personalizar completamente los colores, contenido y estructura 
            después de seleccionar un tema. El tema es solo el punto de partida.
          </p>
        </div>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: ProfileTheme;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
        isSelected 
          ? 'ring-2 ring-smartops-blue shadow-xl border-smartops-blue' 
          : 'hover:shadow-lg border-gray-200'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="text-center relative">
        {isSelected && (
          <div className="absolute top-4 right-4 bg-smartops-blue text-white rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
        )}
        
        <div className="mx-auto mb-4 relative">
          {/* Imagen de perfil */}
          <img
            src={theme.image}
            alt={theme.name}
            className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Preview';
            }}
          />
          
          {/* Preview del diseño móvil */}
          <div 
            className="mt-4 w-32 h-48 mx-auto rounded-lg shadow-md border-4 border-gray-300 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
            }}
          >
            {/* Simulación del header */}
            <div className="h-16 relative">
              <div 
                className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-2 border-white"
                style={{
                  backgroundImage: `url(${theme.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </div>
            
            {/* Simulación del contenido */}
            <div className="p-2 mt-2 text-center">
              <div className="h-1 bg-white/80 rounded mb-1 mx-2"></div>
              <div className="h-1 bg-white/60 rounded mb-2 mx-4"></div>
              
              {/* Tabs simulados */}
              <div className="flex justify-around mt-3 mb-2">
                <div className="w-4 h-1 bg-white/70 rounded"></div>
                <div className="w-4 h-1 bg-white/70 rounded"></div>
                <div className="w-4 h-1 bg-white/70 rounded"></div>
              </div>
              
              {/* Contenido simulado */}
              <div className="space-y-1">
                <div className="h-1 bg-white/50 rounded mx-3"></div>
                <div className="h-1 bg-white/50 rounded mx-2"></div>
                <div className="h-1 bg-white/50 rounded mx-4"></div>
              </div>
            </div>
            
            {/* Indicador de estilo */}
            <div className="absolute bottom-2 right-2">
              <div 
                className="w-3 h-3 rounded-full border border-white/50"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
          </div>
        </div>
        
        <CardTitle className="text-lg font-montserrat">
          {theme.name}
        </CardTitle>
        <CardDescription className="font-montserrat">
          {theme.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Información del tema */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-smartops-dark/70 font-montserrat">Profesión:</span>
            <Badge variant="outline" className="font-montserrat">
              {theme.profession}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-smartops-dark/70 font-montserrat">Estilo:</span>
            <span className="text-smartops-dark font-montserrat">
              {theme.style}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-smartops-dark/70 font-montserrat">Rating:</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-smartops-dark font-montserrat">
                {theme.usage.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-smartops-dark/70 font-montserrat">Usos:</span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="text-smartops-dark font-montserrat">
                {theme.usage.total_profiles}
              </span>
            </div>
          </div>
        </div>

        {/* Paleta de colores */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-smartops-dark/70" />
            <span className="text-sm text-smartops-dark/70 font-montserrat">
              Paleta de colores
            </span>
          </div>
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
              style={{ backgroundColor: theme.colors.primary }}
              title="Color primario"
            />
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
              style={{ backgroundColor: theme.colors.secondary }}
              title="Color secundario"
            />
            <div
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
              style={{ backgroundColor: theme.colors.accent }}
              title="Color de acento"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-montserrat"
            onClick={(e) => {
              e.stopPropagation();
              // Abrir preview en nueva ventana/modal
              window.open(`/profiles${theme.preview_url}`, '_blank');
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          
          <Button
            size="sm"
            className={`flex-1 font-montserrat ${
              isSelected 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-smartops-blue hover:bg-smartops-blue-hover'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Seleccionado
              </>
            ) : (
              'Seleccionar'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}