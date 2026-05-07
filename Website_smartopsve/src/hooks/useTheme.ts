import { useState, useEffect } from 'react';

export interface Theme {
  name: 'minimal' | 'cards' | 'artistic' | 'professional';
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
}

// Temas predefinidos
const defaultThemes: Record<Theme['name'], Theme> = {
  minimal: {
    name: 'minimal',
    primary_color: '#000000',
    secondary_color: '#666666',
    accent_color: '#3B82F6',
    background_color: '#FFFFFF',
    text_color: '#000000',
    font_family: 'Inter'
  },
  cards: {
    name: 'cards',
    primary_color: '#3956FF',
    secondary_color: '#00D9C3',
    accent_color: '#FF6B6B',
    background_color: '#F8FAFC',
    text_color: '#1E293B',
    font_family: 'Montserrat'
  },
  artistic: {
    name: 'artistic',
    primary_color: '#8B5CF6',
    secondary_color: '#EC4899',
    accent_color: '#F59E0B',
    background_color: '#0F0F23',
    text_color: '#FFFFFF',
    font_family: 'Poppins'
  },
  professional: {
    name: 'professional',
    primary_color: '#1E40AF',
    secondary_color: '#059669',
    accent_color: '#DC2626',
    background_color: '#F9FAFB',
    text_color: '#111827',
    font_family: 'Inter'
  }
};

export function useTheme(initialTheme?: Theme) {
  // Always start with default theme to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme>(initialTheme || defaultThemes.cards);
  const [isClient, setIsClient] = useState(false);

  // Load theme from localStorage after hydration
  useEffect(() => {
    setIsClient(true);
    
    if (!initialTheme) {
      const savedTheme = localStorage.getItem('smartops-theme');
      if (savedTheme) {
        try {
          const parsedTheme = JSON.parse(savedTheme);
          setTheme(parsedTheme);
        } catch {
          // Si hay error al parsear, mantener tema por defecto
        }
      }
    }
  }, [initialTheme]);

  // Guardar tema en localStorage cuando cambie (solo en cliente)
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('smartops-theme', JSON.stringify(theme));
    }
  }, [theme, isClient]);

  // Función para cambiar a un tema predefinido
  const changeTheme = (themeName: Theme['name']) => {
    setTheme(defaultThemes[themeName]);
  };

  // Función para personalizar el tema actual
  const updateTheme = (updates: Partial<Theme>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  // Función para resetear al tema por defecto
  const resetTheme = () => {
    setTheme(defaultThemes.cards);
  };

  return {
    theme,
    setTheme,
    changeTheme,
    updateTheme,
    resetTheme,
    availableThemes: Object.keys(defaultThemes) as Theme['name'][]
  };
}