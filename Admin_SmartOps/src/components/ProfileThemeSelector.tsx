import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Users, Eye, Palette, Sparkles } from 'lucide-react';
import { profileThemesApi, ProfileTheme } from '@/lib/profileThemesApi';
import { toast } from 'sonner';

interface ProfileThemeSelectorProps {
  tenantId: string;
  onThemeSelect?: (theme: ProfileTheme) => void;
  onThemeApply?: (themeId: string) => Promise<void>;
  selectedThemeId?: string;
  showApplyButton?: boolean;
}

const categoryColors = {
  designer: 'bg-purple-100 text-purple-800',
  consultant: 'bg-blue-100 text-blue-800',
  medical: 'bg-green-100 text-green-800',
  creative: 'bg-pink-100 text-pink-800',
  business: 'bg-gray-100 text-gray-800',
  technology: 'bg-indigo-100 text-indigo-800'
};

const categoryIcons = {
  designer: Palette,
  consultant: Users,
  medical: Sparkles,
  creative: Sparkles,
  business: Users,
  technology: Sparkles
};

export function ProfileThemeSelector({
  tenantId,
  onThemeSelect,
  onThemeApply,
  selectedThemeId,
  showApplyButton = true
}: ProfileThemeSelectorProps) {
  const [themes, setThemes] = useState<ProfileTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [applyingTheme, setApplyingTheme] = useState<string | null>(null);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await profileThemesApi.getThemes({ limit: 50 });
      if (response.success) {
        setThemes(response.data.themes);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
      toast.error('Error al cargar los temas');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTheme = async (themeId: string) => {
    try {
      setApplyingTheme(themeId);
      
      if (onThemeApply) {
        await onThemeApply(themeId);
      } else {
        await profileThemesApi.applyThemeToProfile(tenantId, themeId);
      }
      
      toast.success('Tema aplicado exitosamente');
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Error al aplicar el tema');
    } finally {
      setApplyingTheme(null);
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
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
          <TabsTrigger value="all">Todos los temas</TabsTrigger>
          <TabsTrigger value="popular">Populares</TabsTrigger>
          <TabsTrigger value="categories">Por categoría</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={selectedThemeId === theme.id}
                onSelect={() => onThemeSelect?.(theme)}
                onApply={() => handleApplyTheme(theme.id)}
                showApplyButton={showApplyButton}
                isApplying={applyingTheme === theme.id}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isSelected={selectedThemeId === theme.id}
                onSelect={() => onThemeSelect?.(theme)}
                onApply={() => handleApplyTheme(theme.id)}
                showApplyButton={showApplyButton}
                isApplying={applyingTheme === theme.id}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {categories.map((category) => {
            const categoryThemes = themes.filter(theme => theme.category === category);
            const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Sparkles;
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-5 h-5" />
                  <h3 className="text-lg font-semibold capitalize">{category}</h3>
                  <Badge variant="secondary">{categoryThemes.length} temas</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryThemes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedThemeId === theme.id}
                      onSelect={() => onThemeSelect?.(theme)}
                      onApply={() => handleApplyTheme(theme.id)}
                      showApplyButton={showApplyButton}
                      isApplying={applyingTheme === theme.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ThemeCardProps {
  theme: ProfileTheme;
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
  showApplyButton: boolean;
  isApplying: boolean;
}

function ThemeCard({ theme, isSelected, onSelect, onApply, showApplyButton, isApplying }: ThemeCardProps) {
  const IconComponent = categoryIcons[theme.category as keyof typeof categoryIcons] || Sparkles;
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4" />
            <Badge 
              variant="secondary" 
              className={categoryColors[theme.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}
            >
              {theme.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{theme.usage.rating.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {/* Preview Image */}
        <div className="relative mb-4">
          <img
            src={theme.image}
            alt={theme.name}
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Preview';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
        </div>

        {/* Theme Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{theme.name}</h3>
          <p className="text-sm text-muted-foreground">{theme.profession}</p>
          <p className="text-sm line-clamp-2">{theme.description}</p>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{theme.usage.total_profiles} usos</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{theme.style}</span>
            </div>
          </div>

          {/* Colors Preview */}
          <div className="flex gap-1 mt-2">
            <div 
              className="w-4 h-4 rounded-full border border-gray-200" 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-gray-200" 
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-gray-200" 
              style={{ backgroundColor: theme.colors.accent }}
            />
          </div>

          {/* Action Buttons */}
          {showApplyButton && (
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply();
                }}
                disabled={isApplying}
                className="flex-1"
              >
                {isApplying ? 'Aplicando...' : 'Aplicar tema'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/profiles${theme.preview_url}`, '_blank');
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

