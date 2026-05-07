import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Save, Loader2, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '@/lib/profileApi';

interface ProfileColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
}

// En la definición de props (mantén esto tal cual si ya lo tienes)
interface ProfileColorsEditorProps {
  tenantId: string;
  initialColors?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
  };
  onSaved?: (saved: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    font_family?: string;
  }) => void;
  onColorsChange?: (colors: ProfileColors) => void; // <-- añadir para coincidir con el uso
}

const FONT_OPTIONS = [
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Nunito', label: 'Nunito' }
];

const PRESET_COLORS = [
  {
    name: 'SmartOps Blue',
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#ffffff'
  },
  {
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    accent: '#ffffff'
  },
  {
    name: 'Emerald Green',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#ffffff'
  },
  {
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#ffffff'
  },
  {
    name: 'Purple Dream',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#ffffff'
  },
  {
    name: 'Rose Pink',
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#ffffff'
  },
  {
    name: 'Dark Mode',
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#ffffff'
  },
  {
    name: 'Light Mode',
    primary: '#f3f4f6',
    secondary: '#e5e7eb',
    accent: '#1f2937'
  }
];

export const ProfileColorsEditors: React.FC<ProfileColorsEditorProps> = ({
  tenantId,
  onColorsChange,
  onSaved
}) => {
  const navigate = useNavigate();
  const [colors, setColors] = useState<ProfileColors>({
    primary_color: '#4f46e5',
    secondary_color: '#7c3aed',
    accent_color: '#ffffff',
    font_family: 'Montserrat'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentColors();
  }, [tenantId]);

  const loadCurrentColors = async () => {
    setLoading(true);
    try {
      const response = await profileApi.getProfileColors(tenantId);
      if (response.success && response.data.theme) {
        const themeColors = {
          primary_color: response.data.theme.primary_color || '#4f46e5',
          secondary_color: response.data.theme.secondary_color || '#7c3aed',
          accent_color: response.data.theme.accent_color || '#ffffff',
          font_family: response.data.theme.font_family || 'Montserrat'
        };
        setColors(themeColors);
        onColorsChange?.(themeColors);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('Error al cargar los colores actuales');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field: keyof ProfileColors, value: string) => {
    const newColors = { ...colors, [field]: value };
    setColors(newColors);
    onColorsChange?.(newColors);
  };

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    const newColors = {
      ...colors,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent
    };
    setColors(newColors);
    onColorsChange?.(newColors);
    toast.success(`Paleta "${preset.name}" aplicada`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...(validateColor(colors.primary_color) ? { primary_color: colors.primary_color } : {}),
        ...(validateColor(colors.secondary_color) ? { secondary_color: colors.secondary_color } : {}),
        ...(validateColor(colors.accent_color) ? { accent_color: colors.accent_color } : {}),
        font_family: colors.font_family
      };

      const response = await profileApi.updateProfileColors(tenantId, payload);

      // Fallback para perfil nuevo
      if (!response?.success) {
        const status = (response as any)?.status || (response as any)?.error?.response?.status;
        if (status === 404) {
          const created = await profileApi.createOrUpdateProfile(tenantId, { theme: payload });
          if (created?._id) {
            toast.success('🎨 Colores guardados creando el perfil');
          }
        } else {
          toast.error('❌ No se pudo guardar los colores');
          return;
        }
      }

      const fresh = await profileApi.getProfileColors(tenantId);
      const serverTheme = fresh?.data?.theme || {};
      const received = {
        primary_color: serverTheme.primary_color || colors.primary_color,
        secondary_color: serverTheme.secondary_color || colors.secondary_color,
        accent_color: serverTheme.accent_color || colors.accent_color,
        font_family: serverTheme.font_family || colors.font_family
      };

      const mismatches: string[] = [];
      if (payload.primary_color && received.primary_color !== payload.primary_color) mismatches.push('primary_color');
      if (payload.secondary_color && received.secondary_color !== payload.secondary_color) mismatches.push('secondary_color');
      if (payload.accent_color && received.accent_color !== payload.accent_color) mismatches.push('accent_color');

      if (mismatches.length === 0) {
        toast.success(`🎨 Guardado OK: ${received.primary_color}, ${received.secondary_color}, ${received.accent_color}`);
      } else {
        toast.warning(`⚠️ Guardado parcial: ${mismatches.join(', ')}`);
      }

      setColors(received);
      onColorsChange?.(received);
      onSaved?.(received);
    } catch (error) {
      console.error('Error saving colors:', error);
      toast.error('❌ Error al guardar los colores');
    } finally {
      setSaving(false);
    }
  };

  const validateColor = (color: string) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-smartops-blue" />
          Personalización de Colores
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paletas predefinidas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Paletas Predefinidas</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_COLORS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Editor de colores personalizados */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Colores Personalizados</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Color Primario */}
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="text-sm">
                Primario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={colors.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  placeholder="#4f46e5"
                  className="flex-1"
                />
              </div>
              {!validateColor(colors.primary_color) && (
                <p className="text-xs text-red-500">Formato inválido (ej: #4f46e5)</p>
              )}
            </div>

            {/* Color Secundario */}
            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="text-sm">
                Secundario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={colors.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
              {!validateColor(colors.secondary_color) && (
                <p className="text-xs text-red-500">Formato inválido (ej: #7c3aed)</p>
              )}
            </div>

            {/* Color de Acento */}
            <div className="space-y-2">
              <Label htmlFor="accent-color" className="text-sm">
                Acento
              </Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={colors.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
              {!validateColor(colors.accent_color) && (
                <p className="text-xs text-red-500">Formato inválido (ej: #ffffff)</p>
              )}
            </div>
          </div>

          {/* Fuente */}
          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-sm">
              Fuente Principal
            </Label>
            <Select
              value={colors.font_family}
              onValueChange={(value) => handleColorChange('font_family', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vista previa */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Vista Previa</Label>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.primary_color,
              color: getContrastColor(colors.primary_color),
              fontFamily: colors.font_family
            }}
          >
            <div className="space-y-2">
              <h3 className="font-bold">Título Principal</h3>
              <p className="text-sm opacity-90">Texto secundario con el color secundario</p>
              <div 
                className="px-3 py-1 rounded text-sm inline-block"
                style={{ backgroundColor: colors.secondary_color }}
              >
                Botón de ejemplo
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !validateColor(colors.primary_color) || !validateColor(colors.secondary_color) || !validateColor(colors.accent_color)}
            className="flex-1 bg-smartops-blue hover:bg-smartops-blue-hover"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Colores
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Perfil
          </Button>
          
          <Button
            variant="outline"
            onClick={loadCurrentColors}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Elimina por completo el stub del final del archivo
// export default function ProfileColorsEditor({ tenantId, initialColors, onSaved, onColorsChange }: ProfileColorsEditorProps) {
//   // stub con <button> Guardar colores
// }
export default function ProfileColorsEditor({
  tenantId,
  initialColors,
  onSaved,
  onColorsChange
}: ProfileColorsEditorProps) {
  const navigate = useNavigate();
  
  const [colors, setColors] = useState<ProfileColors>({
    primary_color: initialColors?.primary_color ?? '#4f46e5',
    secondary_color: initialColors?.secondary_color ?? '#7c3aed',
    accent_color: initialColors?.accent_color ?? '#ffffff',
    font_family: initialColors?.font_family ?? 'Montserrat'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentColors();
  }, [tenantId]);

  const loadCurrentColors = async () => {
    setLoading(true);
    try {
      const response = await profileApi.getProfileColors(tenantId);
      if (response.success && response.data.theme) {
        const themeColors = {
          primary_color: response.data.theme.primary_color || '#4f46e5',
          secondary_color: response.data.theme.secondary_color || '#7c3aed',
          accent_color: response.data.theme.accent_color || '#ffffff',
          font_family: response.data.theme.font_family || 'Montserrat'
        };
        setColors(themeColors);
        onColorsChange?.(themeColors);
      }
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('Error al cargar los colores actuales');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field: keyof ProfileColors, value: string) => {
    const newColors = { ...colors, [field]: value };
    setColors(newColors);
    onColorsChange?.(newColors);
  };

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    const newColors = {
      ...colors,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent
    };
    setColors(newColors);
    onColorsChange?.(newColors);
    toast.success(`Paleta "${preset.name}" aplicada`);
  };

  const validateColor = (color: string) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...(validateColor(colors.primary_color) ? { primary_color: colors.primary_color } : {}),
        ...(validateColor(colors.secondary_color) ? { secondary_color: colors.secondary_color } : {}),
        ...(validateColor(colors.accent_color) ? { accent_color: colors.accent_color } : {}),
        font_family: colors.font_family
      };

      const response = await profileApi.updateProfileColors(tenantId, payload);

      // Fallback para perfil nuevo
      if (!response?.success) {
        const status = (response as any)?.status || (response as any)?.error?.response?.status;
        if (status === 404) {
          const created = await profileApi.createOrUpdateProfile(tenantId, { theme: payload });
          if (created?._id) {
            toast.success('🎨 Colores guardados creando el perfil');
          }
        } else {
          toast.error('❌ No se pudo guardar los colores');
          return;
        }
      }

      const fresh = await profileApi.getProfileColors(tenantId);
      const serverTheme = fresh?.data?.theme || {};
      const received = {
        primary_color: serverTheme.primary_color || colors.primary_color,
        secondary_color: serverTheme.secondary_color || colors.secondary_color,
        accent_color: serverTheme.accent_color || colors.accent_color,
        font_family: serverTheme.font_family || colors.font_family
      };

      const mismatches: string[] = [];
      if (payload.primary_color && received.primary_color !== payload.primary_color) mismatches.push('primary_color');
      if (payload.secondary_color && received.secondary_color !== payload.secondary_color) mismatches.push('secondary_color');
      if (payload.accent_color && received.accent_color !== payload.accent_color) mismatches.push('accent_color');

      if (mismatches.length === 0) {
        toast.success(`🎨 Guardado OK: ${received.primary_color}, ${received.secondary_color}, ${received.accent_color}`);
      } else {
        toast.warning(`⚠️ Guardado parcial: ${mismatches.join(', ')}`);
      }

      setColors(received);
      onColorsChange?.(received);
      onSaved?.(received);
    } catch (error) {
      console.error('Error saving colors:', error);
      toast.error('❌ Error al guardar los colores');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-smartops-blue" />
          Personalización de Colores
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paletas predefinidas */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Paletas Predefinidas</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_COLORS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 flex flex-col items-center gap-2 hover:scale-105 transition-transform"
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="flex gap-1">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.accent }}
                  />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Editor de colores personalizados */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Colores Personalizados</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Color Primario */}
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="text-sm">
                Primario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={colors.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.primary_color}
                  onChange={(e) => handleColorChange('primary_color', e.target.value)}
                  placeholder="#4f46e5"
                  className="flex-1"
                />
              </div>
              {!validateColor(colors.primary_color) && (
                <p className="text-xs text-red-500">Formato inválido (ej: #4f46e5)</p>
              )}
            </div>

            {/* Color Secundario */}
            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="text-sm">
                Secundario
              </Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={colors.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.secondary_color}
                  onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                  placeholder="#7c3aed"
                  className="flex-1"
                />
              </div>
              {!validateColor(colors.secondary_color) && (
                <p className="text-xs text-red-500">Formato inválido (ej: #7c3aed)</p>
              )}
            </div>

            {/* Color de Acento */}
            <div className="space-y-2">
              <Label htmlFor="accent-color" className="text-sm">
                Acento
              </Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={colors.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={colors.accent_color}
                  onChange={(e) => handleColorChange('accent_color', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
              {!validateColor(colors.accent_color) && (
                <p className="text-xs text-red-500">Formato inválido (ej: #ffffff)</p>
              )}
            </div>
          </div>

          {/* Fuente */}
          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-sm">
              Fuente Principal
            </Label>
            <Select
              value={colors.font_family}
              onValueChange={(value) => handleColorChange('font_family', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar fuente" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vista previa */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Vista Previa</Label>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.primary_color,
              color: getContrastColor(colors.primary_color),
              fontFamily: colors.font_family
            }}
          >
            <div className="space-y-2">
              <h3 className="font-bold">Título Principal</h3>
              <p className="text-sm opacity-90">Texto secundario con el color secundario</p>
              <div 
                className="px-3 py-1 rounded text-sm inline-block"
                style={{ backgroundColor: colors.secondary_color }}
              >
                Botón de ejemplo
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || !validateColor(colors.primary_color) || !validateColor(colors.secondary_color) || !validateColor(colors.accent_color)}
            className="flex-1 bg-smartops-blue hover:bg-smartops-blue-hover"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Colores
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Perfil
          </Button>
          
          <Button
            variant="outline"
            onClick={loadCurrentColors}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}