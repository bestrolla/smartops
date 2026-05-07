import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Link as LinkIcon,
  Unlink,
  QrCode,
  Smartphone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getPublicNfcConfig, getNFCPayload, linkNfcCard, unlinkNfcCard, updateNfcLabel, linkNfcCardByLabel } from '@/lib/nfcApi';
import { getPublicTenantProfile } from '@/lib/tenantApi';
import { getProfile } from '@/lib/profileApi';
import { useAuth } from '../lib/AuthContext';

export default function NFCSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [publicNfc, setPublicNfc] = useState<{ url: string; qr_code?: string } | null>(null);

  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [nfcPayload, setNFCPayload] = useState<any>(null);

  const [linkCardUID, setLinkCardUID] = useState('');

  const { auth } = useAuth();
  const token = auth?.token ?? null;
  const authTenantId = auth?.tenantId ?? null;
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [cardLabel, setCardLabel] = useState('');

  // Helper: normaliza UID (quita separadores y mayúsculas)
  const normalizeUid = (raw: string) => raw.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
  const normalizedUIDPreview = normalizeUid(linkCardUID);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Usa el endpoint público y ayuda al backend a identificar el tenant por ID
      const tenantResponse = await getPublicTenantProfile({ tenantId: authTenantId ?? undefined });

      const effectiveTenantId = tenantResponse?.tenant?._id ?? authTenantId;
      const effectiveSlug = tenantResponse?.tenant?.slug ?? null;

      if (!effectiveTenantId) {
        setError('No se pudo determinar el tenant. Inicia sesión o verifica la conexión con el backend.');
        setLoading(false);
        return;
      }

      setTenantId(effectiveTenantId);
      setSlug(effectiveSlug);

      // Cargar configuración pública NFC por slug si existe
      if (effectiveSlug) {
        const cfg = await getPublicNfcConfig(effectiveSlug);
        setPublicNfc(cfg);
      } else {
        setPublicNfc(null);
      }

      // Si no hay token, evita endpoints protegidos y avisa
      if (!token) {
        setRequiresAuth(true);
        setError(null);
        setLoading(false);
        return;
      }

      // Cargar perfil y payload NFC (protegidos) usando el tenantId y token
      await Promise.all([
        fetchCurrentProfile(effectiveTenantId),
        loadNfcPayload(effectiveTenantId),
      ]);

      setError(null);
      setRequiresAuth(false);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar la configuración NFC');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentProfile = async (id: string) => {
    try {
      const profileData = await getProfile(id);
      setCurrentProfile(profileData);
    } catch (err) {
      console.error('Error al cargar perfil actual:', err);
    }
  };

  const loadNfcPayload = async (id: string) => {
    try {
      if (!token) return;
      const payloadData = await getNFCPayload(id, token);
      setNFCPayload(payloadData);
    } catch (err) {
      console.error('Error al cargar payload NFC:', err);
    }
  };

  const handleLinkCard = async () => {
    if (!tenantId || !linkCardUID.trim()) {
      setError('Se requiere el UID de la tarjeta y el tenant ID');
      return;
    }
    if (!token) {
      setError('Token no disponible para vincular la tarjeta');
      return;
    }
    const uid = normalizeUid(linkCardUID.trim());
    if (!uid) {
      setError('UID inválido. Ingresa un UID hexadecimal.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await linkNfcCard(tenantId, uid, token);
      setLinkCardUID('');
      setSuccess('Tarjeta vinculada exitosamente al perfil');
      await Promise.all([fetchCurrentProfile(tenantId), loadNfcPayload(tenantId)]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setSuccess(null);
      setError(err?.message || 'Error al vincular la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkCard = async () => {
    if (!tenantId) {
      setError('Tenant ID requerido');
      return;
    }
    if (!token) {
      setError('Token no disponible para desvincular la tarjeta');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await unlinkNfcCard(tenantId, token);
      setSuccess('Tarjeta desvinculada exitosamente del perfil');
      await Promise.all([fetchCurrentProfile(tenantId), loadNfcPayload(tenantId)]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setSuccess(null);
      setError(err?.message || 'Error al desvincular la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLabel = async () => {
    if (!tenantId || !cardLabel.trim()) {
      setError('Ingresa una etiqueta y verifica el tenant ID');
      return;
    }
    if (!token) {
      setError('Token no disponible para guardar la etiqueta');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await updateNfcLabel(tenantId, cardLabel.trim(), token);
      setSuccess('Etiqueta guardada');
      await fetchCurrentProfile(tenantId);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      setSuccess(null);
      setError(err?.message || 'Error al guardar la etiqueta');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkByLabel = async () => {
    if (!tenantId || !cardLabel.trim()) {
      setError('Ingresa una etiqueta y verifica el tenant ID');
      return;
    }
    if (!token) {
      setError('Token no disponible para vincular por etiqueta');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await linkNfcCardByLabel(tenantId, cardLabel.trim(), token);
      setCardLabel(''); // limpiar el formulario para permitir nueva vinculación
      setSuccess('Tarjeta vinculada (UID autogenerado por el backend)');
      await Promise.all([fetchCurrentProfile(tenantId), loadNfcPayload(tenantId)]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setSuccess(null);
      setError(err?.message || 'Error al vincular por etiqueta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-smartops-gray-light p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <CreditCard className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold font-montserrat">Configuración NFC</h1>
              <p className="text-blue-100 font-montserrat">
                Escribe la URL pública de tu perfil en la tarjeta NFC
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-montserrat">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-montserrat">{success}</span>
          </div>
        )}

        {/* Aviso de autenticación requerida para acciones protegidas */}
        {requiresAuth && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-montserrat">
              Inicia sesión para ver el estado NFC y vincular/desvincular tarjetas.
            </span>
          </div>
        )}

        {/* Bloque superior: Enlace público + estado de tarjeta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Enlace público y QR */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-smartops-blue to-smartops-blue-hover text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 font-montserrat">
                <QrCode className="w-6 h-6" />
                Enlace público de tu perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {publicNfc?.url ? (
                <>
                  <div>
                    <span className="font-semibold font-montserrat text-smartops-dark">URL para escribir en la tarjeta:</span>
                    <div className="mt-2 flex items-center gap-3">
                      <Input readOnly value={publicNfc.url} className="font-mono" />
                      <Button
                        onClick={() => navigator.clipboard.writeText(publicNfc.url)}
                        className="bg-smartops-blue hover:bg-smartops-blue-hover font-montserrat"
                      >
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(publicNfc.url, '_blank')}
                        className="font-montserrat"
                      >
                        Abrir
                      </Button>
                    </div>
                  </div>

                  {publicNfc.qr_code && (
                    <div className="mt-4">
                      <span className="font-semibold font-montserrat text-smartops-dark">QR para pruebas rápidas:</span>
                      <div className="mt-2">
                        <img
                          src={publicNfc.qr_code}
                          alt="QR del perfil público"
                          className="w-40 h-40 border rounded"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600 font-montserrat">
                  {slug
                    ? 'Cargando configuración pública NFC...'
                    : 'No se encontró el slug del tenant.'}
                </p>
              )}
              <p className="text-xs text-gray-500 font-montserrat">
                Formato esperado: https://smartopsve.com&lt;slug&gt;
              </p>
            </CardContent>
          </Card>

          {/* Tarjeta vinculada (visible sólo cuando está configurada y vinculada) */}
          {currentProfile?.nfc?.is_linked && (
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 font-montserrat">
                  <LinkIcon className="w-6 h-6" />
                  Tarjeta vinculada
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <Badge variant="default" className="font-montserrat">Vinculada</Badge>

                {currentProfile.nfc?.card_label && (
                  <div>
                    <span className="font-montserrat text-sm text-gray-600">Etiqueta:</span>
                    <p className="text-sm text-gray-700 font-montserrat mt-1">
                      {currentProfile.nfc.card_label}
                    </p>
                  </div>
                )}

                {currentProfile.nfc?.card_uid && (
                  <div>
                    <span className="font-montserrat text-sm text-gray-600">UID:</span>
                    <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded mt-1">
                      {currentProfile.nfc.card_uid}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(currentProfile.nfc.card_uid)}
                        className="font-montserrat"
                      >
                        Copiar UID
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleUnlinkCard}
                        disabled={loading || requiresAuth || !tenantId}
                        className="font-montserrat"
                      >
                        Desvincular
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 font-montserrat mt-2">
                  Esta tarjeta ya está lista para usar con tu URL pública.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instrucciones NFC Tools */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <Smartphone className="w-6 h-6" />
              Instrucciones con NFC Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 font-montserrat">
              <li>Instala “NFC Tools” en tu móvil.</li>
              <li>Abre “Escribir” → “Añadir un registro” → elige “URL/URI”.</li>
              <li>Pega la URL pública mostrada arriba.</li>
              <li>Acerca la tarjeta NFC al móvil para escribir.</li>
              <li>Prueba la tarjeta: al tocar, debe abrir tu perfil público.</li>
            </ol>
          </CardContent>
        </Card>

        {/* Vincular una nueva tarjeta (limpio tras éxito) */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 font-montserrat">
              <LinkIcon className="w-6 h-6" />
              Vincular tarjeta al perfil (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-montserrat text-smartops-dark">Etiqueta de la Tarjeta</Label>
                <Input
                  value={cardLabel}
                  onChange={(e) => setCardLabel(e.target.value)}
                  className="mt-2 font-montserrat"
                  placeholder="Ej: NXP-NTAG215 (solo texto descriptivo)"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleLinkByLabel}
                    disabled={loading || !cardLabel.trim() || !tenantId || requiresAuth}
                    className="bg-green-600 hover:bg-green-700 font-montserrat"
                  >
                    Vincular
                  </Button>
                </div>
              </div>

              <div>
                <span className="font-semibold font-montserrat text-smartops-dark">Estado actual:</span>
                {currentProfile ? (
                  <div className="mt-2 space-y-2">
                    <Badge variant={currentProfile.nfc?.is_linked ? 'default' : 'secondary'}>
                      {currentProfile.nfc?.is_linked ? 'Vinculado' : 'Sin vincular'}
                    </Badge>
                    {currentProfile.nfc?.card_uid && (
                      <div>
                        <span className="font-montserrat text-sm text-gray-600">UID:</span>
                        <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded mt-1">
                          {currentProfile.nfc.card_uid}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 font-montserrat">Cargando perfil...</p>
                )}
              </div>
            </div>

            {/* Payload NFC (para depuración) */}
            {nfcPayload && (
              <div className="mt-6">
                <span className="font-semibold font-montserrat text-smartops-dark">Payload NFC:</span>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto mt-2">
                  <pre>{JSON.stringify(nfcPayload, null, 2)}</pre>
                </div>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  Este payload se usa cuando el backend genera datos de NFC para tu perfil.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}