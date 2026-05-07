import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useProfileLocalStorage } from '@/hooks/useProfileLocalStorage';
import { PendingChangesBadge } from '@/components/ui/PendingChangesBadge';
import { LocationMapFullsize } from '@/components/ui/LocationMapFullsize';
import { 
  MapPin, 
  Clock, 
  Save,
  Navigation,
  Building,
  Globe,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Location, getLocation, updateLocation, getCoordinatesFromAddress } from '@/lib/locationApi';

interface LocationEditorProps {
  onLocationChange?: (location: Location) => void;
  defaultShowMap?: boolean;       // nuevo: mostrar mapa por defecto
  enableMapToggle?: boolean;      // nuevo: mostrar botón para alternar
}

const DEFAULT_LOCATION: Location = {
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  coordinates: undefined,
  business_hours: {},
  additional_info: ''
};

export function LocationEditor({ onLocationChange, defaultShowMap = false, enableMapToggle = true }: LocationEditorProps) {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBusinessHours, setShowBusinessHours] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(defaultShowMap);

  // Hook para manejo de localStorage
  const { getDraft, setDraft, clearDraft, buildFinalPayload } = useProfileLocalStorage(auth.tenantId || '');
  const hasUnsavedChanges = Boolean(getDraft().location);

  useEffect(() => {
    if (auth.tenantId) {
      loadLocation();
    }
  }, [auth.tenantId]);

  const loadLocation = async () => {
    if (!auth.tenantId) return;
    
    setLoading(true);
    try {
      const response = await getLocation(auth.tenantId);
      if (response.success) {
        const nextLocation = { ...DEFAULT_LOCATION, ...(response.data || {}) };
        setLocation(nextLocation);
        if (onLocationChange) {
          onLocationChange(nextLocation);
        }
      } else {
        setLocation(DEFAULT_LOCATION);
        if (onLocationChange) {
          onLocationChange(DEFAULT_LOCATION);
        }
        console.log('No hay información de ubicación guardada');
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setLocation(DEFAULT_LOCATION);
      if (onLocationChange) {
        onLocationChange(DEFAULT_LOCATION);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.tenantId) return;

    if (!location.address || !location.city || !location.country) {
      toast.error('❌ Completa los campos requeridos (Dirección, Ciudad, País)');
      return;
    }

    setSaving(true);
    try {
      let updatedLocation = { ...location };
      if (!location.coordinates && location.address) {
        const coordinates = await getCoordinatesFromAddress(
          `${location.address}, ${location.city}, ${location.country}`
        );
        if (coordinates) {
          updatedLocation.coordinates = coordinates;
          setLocation(updatedLocation);
        }
      }

      setDraft('location', updatedLocation);
      if (onLocationChange) {
        onLocationChange(updatedLocation);
      }

      const result = await updateLocation(auth.tenantId, updatedLocation);
      if (result.success) {
        toast.success('📍 Ubicación guardada correctamente');
        await loadLocation();
      } else {
        toast.error('❌ No se pudo guardar la ubicación');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('❌ Error al procesar ubicación');
    } finally {
      setSaving(false);
    }
  };

  // Nueva función para guardar todos los cambios al servidor
  const handleSaveToServer = async () => {
    setLoading(true);
    try {
      const draft = getDraft();
      const payload = draft.location || location;
      if (!auth.tenantId) {
        // Tenant not available; stop and optionally notify the user
        return;
      }
      const result = await updateLocation(auth.tenantId!, payload);
      if (result.success) {
        await loadLocation();
      }
    } catch (error) {
      console.error('Error saving to server:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Location, value: any) => {
    setLocation(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHoursChange = (day: string, hours: string) => {
    setLocation(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: hours
      }
    }));
  };

  const businessHoursDays = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  // Abre Google Maps con coordenadas o dirección (DEFINICIÓN NUEVA)
  const openInGoogleMaps = () => {
    const query = location.coordinates
      ? `${location.coordinates.latitude},${location.coordinates.longitude}`
      : [location.address, location.city, location.state, location.country]
          .filter(Boolean)
          .join(', ');
    const url = `https://www.google.com/maps?q=${encodeURIComponent(query)}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Error opening Google Maps:', e);
      toast.error('No se pudo abrir Google Maps');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Ubicación</h3>
          {location.address && (
            <Badge variant="secondary">Configurada</Badge>
          )}
          <PendingChangesBadge show={hasUnsavedChanges} />
        </div>
      </div>



      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dirección */}
          <div>
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              value={location.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Calle, número, piso, oficina"
            />
          </div>

          {/* Ciudad y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={location.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Ciudad"
              />
            </div>
            <div>
              <Label htmlFor="state">Estado/Provincia</Label>
              <Input
                id="state"
                value={location.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Estado o provincia"
              />
            </div>
          </div>

          {/* País y Código Postal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={location.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="País"
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={location.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="Código postal"
              />
            </div>
          </div>

          {/* Coordenadas */}
          {location.coordinates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Latitud</Label>
                <Input
                  value={location.coordinates.latitude}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Longitud</Label>
                <Input
                  value={location.coordinates.longitude}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div>
            <Label htmlFor="additional_info">Información Adicional</Label>
            <Textarea
              id="additional_info"
              value={location.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              placeholder="Instrucciones de llegada, puntos de referencia, etc."
              rows={3}
            />
          </div>

          {/* Horarios de atención */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBusinessHours(!showBusinessHours)}
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              {showBusinessHours ? 'Ocultar' : 'Mostrar'} Horarios de Atención
            </Button>

            {showBusinessHours && (
              <div className="mt-4 space-y-3">
                {businessHoursDays.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-20 text-sm">{label}</Label>
                    <Input
                      value={location.business_hours?.[key as keyof typeof location.business_hours] || ''}
                      onChange={(e) => handleBusinessHoursChange(key, e.target.value)}
                      placeholder="9:00 AM - 6:00 PM"
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving || loading}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Ubicación'}
            </Button>

            {enableMapToggle && location.address && (
              <Button 
                variant="outline" 
                onClick={() => setShowMapPreview(!showMapPreview)}
                disabled={loading}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showMapPreview ? 'Ocultar' : 'Vista Previa'} Mapa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      {location.address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">{location.address}</p>
                  <p className="text-sm text-gray-600">
                    {location.city}{location.state && `, ${location.state}`}{location.postal_code && ` ${location.postal_code}`}
                  </p>
                  <p className="text-sm text-gray-600">{location.country}</p>
                </div>
              </div>

              {location.coordinates && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Navigation className="w-4 h-4" />
                  <span>
                    {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
                  </span>
                </div>
              )}

              {location.additional_info && (
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-500 mt-0.5" />
                  <p className="text-sm text-gray-600">{location.additional_info}</p>
                </div>
              )}

              {Object.keys(location.business_hours || {}).length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Horarios de Atención:</p>
                    {businessHoursDays.map(({ key, label }) => {
                      const hours = location.business_hours?.[key as keyof typeof location.business_hours];
                      return hours ? (
                        <p key={key} className="text-xs">
                          <span className="font-medium">{label}:</span> {hours}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista previa del mapa grande */}
      {showMapPreview && location.address && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Mapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openInGoogleMaps}
                className="absolute right-3 top-3 z-10"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Ver en Maps
              </Button>
              <LocationMapFullsize location={location} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando información de ubicación...</p>
        </div>
      )}
    </div>
  );
}