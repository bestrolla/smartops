import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { profileApi, type Profile } from '@/lib/profileApi';
import { LocationMap } from '@/components/ui/LocationMap';
import { getLocation, type Location } from '@/lib/locationApi';
import { formatServicePrice, formatServiceDuration } from '@/lib/servicesApi';
import { Calendar, MapPin } from 'lucide-react';
import '@/styles/public-profile.css';

export default function PublicProfile() {
  const { tenantId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const prof = await profileApi.getProfile(tenantId);
        setProfile(prof);
        if (prof.location) {
          setLocation(prof.location as any);
        } else {
          const resp = await getLocation(tenantId);
          if (resp.success) setLocation(resp.data);
        }
      } catch (e: any) {
        console.error(e);
        setError('No se pudo cargar el perfil público');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-muted-foreground">Cargando perfil...</div>;
  }
  if (error) {
    return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-red-600">{error}</div>;
  }
  if (!profile) {
    return <div className="max-w-3xl mx-auto px-4 py-6 text-sm text-muted-foreground">Perfil no encontrado.</div>;
  }

  const img = profile.profile_image || profile.profileImage;
  const initials = (profile.public_name || 'P').split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase();

  // Tema y tipografía como en el preview móvil
  const colors = useMemo(() => {
    const defaults = { primary: '#3B82F6', secondary: '#1F2937', accent: '#F59E0B' };
    const t = profile.theme || ({} as any);
    return {
      primary: t.primary_color || defaults.primary,
      secondary: t.secondary_color || t.primary_color || defaults.secondary,
      accent: t.accent_color || defaults.accent
    };
  }, [profile.theme]);
  const fontFamily = profile.theme?.font_family || 'Montserrat';

  return (
    <div 
      className="max-w-3xl mx-auto px-4 py-6 public-profile-container" 
      style={{ '--font-family': fontFamily } as React.CSSProperties}
    >
      {/* Encabezado estilo móvil con colores del tema */}
      <div 
        className="rounded-xl overflow-hidden text-white profile-header-gradient" 
        style={{ 
          '--primary-color': colors.primary, 
          '--secondary-color': colors.secondary 
        } as React.CSSProperties}
      >
        <div className="p-6 flex items-center gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-white/50">
            {img ? <AvatarImage src={img} alt={profile.public_name} /> : <AvatarFallback>{initials}</AvatarFallback>}
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{profile.public_name}</h1>
            {(profile.title || profile.specialty) && (
              <p className="text-sm opacity-90 truncate">{profile.title || profile.specialty}</p>
            )}
            {profile.bio && (
              <p className="text-xs mt-1 opacity-90 line-clamp-3">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Servicios del perfil (propios) */}
      {profile.services && profile.services.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Servicios</h2>
              <Badge 
                 className="service-badge"
                 style={{ '--primary-color': colors.primary } as React.CSSProperties}
               >
                 {profile.services.length}
               </Badge>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {profile.services.map((sv, index) => (
                 <div key={sv.name || index} className="rounded-lg border p-3">
                   <div className="font-medium">{sv.name}</div>
                   {sv.description && (
                     <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{sv.description}</div>
                   )}
                   <div className="text-xs mt-2 flex items-center gap-3">
                     {typeof (sv as any).price !== 'undefined' && (
                       <span className="inline-flex items-center gap-1">
                         <span 
                           className="inline-block w-3 h-3 rounded-sm service-accent-dot" 
                           style={{ '--accent-color': colors.accent } as React.CSSProperties}
                         />
                         {formatServicePrice(sv as any)}
                       </span>
                     )}
                     {typeof (sv as any).duration !== 'undefined' && (
                       <span className="inline-flex items-center gap-1">
                         <Calendar className="w-3 h-3" /> {formatServiceDuration((sv as any).duration)}
                       </span>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      )}

      {/* Mapa ubicación */}
      {location && location.address && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Ubicación</h2>
            <LocationMap location={location} />
          </CardContent>
        </Card>
      )}

      {/* CTA de citas (mapa va antes de agendar) */}
      {profile.appointment_config && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Agenda una cita</h2>
                <p className="text-sm text-muted-foreground">Consulta disponibilidad y reserva tu turno.</p>
              </div>
              <a
                href={`/appointments?tenantId=${tenantId}`}
                className="px-4 py-2 rounded-md text-white appointment-cta-button"
                style={{ '--primary-color': colors.primary } as React.CSSProperties}
              >
                Agendar
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}