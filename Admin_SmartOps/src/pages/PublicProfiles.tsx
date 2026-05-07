import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { profileApi, type Profile } from '@/lib/profileApi';
import { getAllTenants, type Tenant } from '@/lib/tenantApi';

export default function PublicProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try API listing first
        const { profiles: docs } = await profileApi.listProfiles(1, 50);
        if (docs && docs.length) {
          setProfiles(docs);
        } else {
          // Fallback: get tenants and build minimal profiles list
          const tenants: Tenant[] = await getAllTenants();
          const mapped: Profile[] = tenants.map((t) => ({
            _id: t._id,
            tenant_id: t._id,
            public_name: t.publicProfile?.displayName || t.name,
            bio: t.publicProfile?.description || '',
            profile_image: t.publicProfile?.logoUrl || undefined,
            profileImage: t.publicProfile?.logoUrl || undefined,
            contact: { 
              emails: t.publicProfile?.contactEmail ? [{ 
                email: t.publicProfile.contactEmail, 
                type: 'business' as const 
              }] : [],
              phones: [],
              website: ''
            },
            social_links: [],
            stats: [],
            services: [],
            portfolio: [],
            testimonials: [],
            location: undefined,
            theme: {
              template_id: 'default',
              primary_color: '#111827',
              secondary_color: '#111827',
              accent_color: '#6366f1',
              font_family: 'Inter',
              layout_style: 'light',
            },
            nfc: { is_linked: false },
            custom_fields: {},
            profile_sections: undefined,
            section_order: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            appointment_config: undefined,
          }));
          setProfiles(mapped);
        }
      } catch (e: any) {
        console.error(e);
        setError('No se pudo cargar perfiles públicos');
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const sq = serviceQuery.trim().toLowerCase();
    return profiles.filter((p) => {
      const nameMatch = !s || p.public_name?.toLowerCase().includes(s);
      const servicesText = (p.services || [])
        .map((sv) => `${sv.name || ''} ${sv.description || ''}`.toLowerCase())
        .join(' ');
      const serviceMatch = !sq || servicesText.includes(sq);
      return nameMatch && serviceMatch;
    });
  }, [profiles, search, serviceQuery]);

  const renderCard = (p: Profile) => {
    const img = p.profile_image || p.profileImage;
    const initials = (p.public_name || 'P').split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase();
    return (
      <Card 
        key={p._id}
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/profile-public-smartops/${p.tenant_id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              {img ? (
                <AvatarImage src={img} alt={p.public_name} />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold truncate">{p.public_name}</h3>
                {p.services && p.services.length > 0 && (
                  <Badge variant="secondary" className="whitespace-nowrap">{p.services.length} servicios</Badge>
                )}
              </div>
              {p.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>
              )}
              {/* Servicios destacados */}
              {p.services && p.services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.services.slice(0, 3).map((sv) => (
                    <Badge key={sv.name || `service-${Math.random()}`} variant="outline" className="text-xs">
                      {sv.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Perfiles públicos</h1>
        <p className="text-sm text-muted-foreground">Explora perfiles por nombre y servicios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Buscar por nombre</label>
          <Input
            placeholder="Ej. Juan Pérez"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Filtrar por servicios</label>
          <Input
            placeholder="Ej. barbería, diseño web"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Cargando perfiles...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(renderCard)}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">Sin resultados con los filtros aplicados.</div>
        )}
      </div>
    </div>
  );
}