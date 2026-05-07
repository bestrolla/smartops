'use client';

import React, { useEffect } from 'react';
import { ProfileData } from '@/types';

type ThemeProviderProps = {
  colors: { primary: string; secondary: string; accent: string };
  fontFamily?: string;
  children: React.ReactNode;
};

export default function ThemeProvider({ colors, fontFamily = 'Montserrat', children, profile }: ThemeProviderProps & { profile?: any }) {
  useEffect(() => {
    if (!profile?.theme) return;

    const root = document.documentElement;
    
    // Aplicar colores personalizados como variables CSS
    if (profile.theme.primary_color) {
      root.style.setProperty('--theme-primary', profile.theme.primary_color);
    }
    
    if (profile.theme.secondary_color) {
      root.style.setProperty('--theme-secondary', profile.theme.secondary_color);
    }
    
    if (profile.theme.accent_color) {
      root.style.setProperty('--theme-accent', profile.theme.accent_color);
    }
    
    // Aplicar fuente personalizada
    if (profile.theme.font_family) {
      root.style.setProperty('--theme-font-family', profile.theme.font_family);
      document.body.style.fontFamily = profile.theme.font_family;
    }

    // Cleanup function para restaurar valores por defecto
    return () => {
      root.style.removeProperty('--theme-primary');
      root.style.removeProperty('--theme-secondary');
      root.style.removeProperty('--theme-accent');
      root.style.removeProperty('--theme-font-family');
      document.body.style.fontFamily = '';
    };
  }, [profile?.theme]);

  // Crear CSS dinámico como string
  // Si tienes un CSS string preconstruido para el tema:
  const themeCSS = `
    :root {
      --theme-primary: ${profile?.theme?.primary_color || '#6366f1'};
      --theme-secondary: ${profile?.theme?.secondary_color || '#8b5cf6'};
      --theme-accent: ${profile?.theme?.accent_color || '#a855f7'};
      --theme-font-family: ${profile?.theme?.font_family || 'Inter, sans-serif'};
    }
  `;
  
  return (
    <div>
      {/* Inyectar CSS personalizado si existe */}
      {profile?.theme?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: profile.theme.custom_css }} />
      )}
  
      {/* CSS base de tema desde variables */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
  
      {/* Variables CSS explícitas derivadas de props colors/font */}
      <style>{`
        :root {
          --theme-primary: ${colors.primary};
          --theme-secondary: ${colors.secondary};
          --theme-accent: ${colors.accent};
          --theme-font: ${fontFamily};
        }
      `}</style>
  
      {children}
    </div>
  );
}