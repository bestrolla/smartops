'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { ProfileData } from '@/types';
import { FaLinkedinIn, FaTwitter, FaInstagram, FaFacebookF, FaTiktok, FaWhatsapp, FaGlobe, FaLink, FaYoutube, FaGithub } from 'react-icons/fa';

interface Theme {
  id?: string;
  name?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  layout?: {
    header?: string;
    stats?: string;
    services?: string;
    testimonials?: string;
  };
}

interface ProfileHeaderProps {
  profile?: ProfileData;
  theme?: Theme | null;
}

export function ProfileHeader({ profile, theme }: ProfileHeaderProps) {
  const defaultProfile = {
    logo: null,
    name: 'Usuario',
    description: 'Descripción no disponible',
    tags: [],
    socialLinks: {},
    stats: [],
    public_name: 'Usuario',
    bio: 'Descripción no disponible',
    title: '',
    specialty: '',
    profile_image: null,
    social_links: []
  };

  const profileData = profile || defaultProfile;

  useEffect(() => {
    // Component mounted - theme and profile data available
  }, [profile, theme]);

  // Determinar el estilo del header basado en el tema
  const getHeaderStyle = () => {
    if (!theme || !theme.layout) return 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900';
    
    switch (theme.layout.header) {
      case 'dark':
        return 'bg-gradient-to-br from-gray-900 to-black text-white';
      case 'light':
        return 'bg-gradient-to-br from-white to-gray-50 text-gray-900';
      case 'gradient-blue':
        return 'bg-gradient-to-br from-blue-500 to-blue-700 text-white';
      case 'gradient-art':
        return 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white';
      default:
        return 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900';
    }
  };

  // Determinar colores de texto basado en el tema
  const getTextColors = () => {
    if (!theme || !theme.layout) return {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-500 dark:text-gray-400',
      accent: 'text-gray-600 dark:text-gray-300'
    };

    const isDark = theme.layout.header === 'dark' || (theme.layout.header && theme.layout.header.includes('gradient'));
    
    return {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-200' : 'text-gray-600',
      accent: isDark ? 'text-gray-300' : 'text-gray-700'
    };
  };

  const textColors = getTextColors();

  const getGradientStyle = () => {
    if (!theme || !theme.colors) return 'bg-gradient-to-b from-indigo-500 to-purple-600';
    
    // Usar los colores exactos del tema de la base de datos
    const primaryColor = theme.colors.primary;
    const secondaryColor = theme.colors.secondary;
    
    // Si tenemos colores específicos del tema, crear un gradiente personalizado
    if (primaryColor && secondaryColor) {
      // Para el tema gradient-art específico
      if (theme.id === 'gradient-art' || theme.layout?.header === 'gradient-art') {
        return 'bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600';
      }
      
      // Mapear colores específicos de la base de datos
      if (primaryColor === '#6366f1' && secondaryColor === '#8b5cf6') {
        return 'bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600';
      }
      
      // Mapear otros colores comunes
      if (primaryColor.includes('#3B82F6') || primaryColor.includes('blue')) {
        return 'bg-gradient-to-b from-blue-500 to-blue-700';
      }
      if (primaryColor.includes('#10B981') || primaryColor.includes('green')) {
        return 'bg-gradient-to-b from-green-500 to-green-700';
      }
      if (primaryColor.includes('#F59E0B') || primaryColor.includes('yellow')) {
        return 'bg-gradient-to-b from-yellow-500 to-yellow-700';
      }
      if (primaryColor.includes('#EF4444') || primaryColor.includes('red')) {
        return 'bg-gradient-to-b from-red-500 to-red-700';
      }
    }
    
    // Fallback por defecto
    return 'bg-gradient-to-b from-indigo-500 to-purple-600';
  };

  return (
    <div 
      className={`relative text-white overflow-hidden ${getGradientStyle()}`}
      suppressHydrationWarning
    >
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gray-700 bg-opacity-30"></div>
      </div>

      <div className="relative text-center px-4 sm:px-6 py-6 sm:py-8" suppressHydrationWarning>

        {/* Avatar */}
        <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6 ring-4 ring-white/20 rounded-full overflow-hidden" suppressHydrationWarning>
          {(profileData.profile_image || (profileData as any).profileImage || profileData.logo) ? (
            <Image 
              src={profileData.profile_image || (profileData as any).profileImage || profileData.logo || ''} 
              alt={`${profileData.public_name || profileData.name} foto`} 
              width={112} 
              height={112}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-600 text-white" suppressHydrationWarning>
              <span className="text-sm sm:text-lg font-bold">
                {(profileData.public_name || profileData.name)?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {profileData.public_name || profileData.name || 'Tu Nombre'}
        </h1>

        <p className="text-gray-300 font-medium mb-3 sm:mb-4 text-base sm:text-lg">
          {profileData.title || profileData.specialty || 'Tu Profesión'}
        </p>

        {profileData.bio && (
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-sm mx-auto px-2">
            {profileData.bio}
          </p>
        )}

        {/* Decoración inferior */}
        <div className="flex justify-center mt-4 sm:mt-6">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30 rounded-full"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/50 rounded-full"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Social links removidos: existe sección dedicada */}

        {/* Línea divisoria elegante */}
        <div className="flex justify-center items-center space-x-3" suppressHydrationWarning>
          <div className={`w-8 h-px ${textColors.secondary.replace('text-', 'bg-')}`} suppressHydrationWarning></div>
          <div className={`w-2 h-2 ${textColors.secondary.replace('text-', 'bg-')} rounded-full`} suppressHydrationWarning></div>
          <div className={`w-8 h-px ${textColors.secondary.replace('text-', 'bg-')}`} suppressHydrationWarning></div>
        </div>
      </div>
    </div>
  );
}