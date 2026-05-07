import api  from './api';

export interface NFCCard {
  _id?: string;
  card_uid: string;
  is_linked: boolean;
  tenant_id?: string;
  profile_id?: string;
  last_updated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NFCPayload {
  tenant_id: string;
  profile_url: string;
  public_name: string;
  bio?: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  };
  card_uid: string | null;
}

export interface NFCStats {
  total_cards: number;
  linked_cards: number;
  unlinked_cards: number;
  recent_scans: number;
}

// Deriva la base del servidor para rutas públicas montadas en "/"
function getServerBase(): string {
  const raw = import.meta.env.VITE_API_URL || '';
  return raw.replace(/\/api\/?$/, '');
}

// Obtener configuración NFC pública por slug (no requiere token)
export async function getPublicNfcConfig(
  slug: string
): Promise<{ url: string; qr_code?: string }> {
  const url = `${getServerBase()}/nfc/${encodeURIComponent(slug)}`;
  const response = await api.get(url, {
    headers: { Accept: 'application/json' },
  });
  // Respuesta: { success: true, data: { url, qr_code } }
  return response.data.data as { url: string; qr_code?: string };
}

// Protegido: obtener payload NFC del perfil por tenantId
export async function getNFCPayload(tenantId: string, token: string) {
  const res = await api.get(`/profiles/${encodeURIComponent(tenantId)}/nfc`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  // El controlador retorna el objeto directamente (sin wrapper { data })
  return res.data; // { type, payload, qr_code, card_uid }
}

// Protegido: vincular tarjeta NFC al perfil por tenantId
function getApiBase(): string {
  return import.meta.env.VITE_API_URL || '/api';
}

const base = `${getApiBase()}/profiles`;

async function handleJsonResponse(res: Response) {
  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const msg = data?.errors?.[0]?.message || data?.message || 'Error de API';
    throw new Error(msg);
  }
  return data;
}

export async function linkNfcCard(tenantId: string, cardUid: string, token: string) {
  const res = await fetch(`${base}/${encodeURIComponent(tenantId)}/nfc/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ card_uid: cardUid }),
  });
  return handleJsonResponse(res);
}

export async function unlinkNfcCard(tenantId: string, token: string) {
  const res = await fetch(`${base}/${encodeURIComponent(tenantId)}/nfc/unlink`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJsonResponse(res);
}

export async function updateNfcLabel(tenantId: string, cardLabel: string, token: string) {
  const res = await fetch(`${base}/${encodeURIComponent(tenantId)}/nfc/label`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ card_label: cardLabel }),
  });
  return handleJsonResponse(res);
}

export async function linkNfcCardByLabel(tenantId: string, cardLabel: string, token: string) {
  const res = await fetch(`${base}/${encodeURIComponent(tenantId)}/nfc/link-by-label`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ card_label: cardLabel }),
  });
  return handleJsonResponse(res);
}

// Público: escanear tarjeta NFC por UID y resolver perfil
export async function scanNfcCard(cardUid: string) {
  const res = await api.post(
    `/profiles/nfc/scan`,
    { card_uid: cardUid },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );
  // Retorna el perfil directamente o 404 con { error }
  return res.data;
}

// Simulaciones para gestión avanzada (placeholder hasta que se implemente en backend)
export const getAllNFCCards = async (): Promise<NFCCard[]> => {
  return [
    {
      _id: '1',
      card_uid: 'NFC001ABC123',
      is_linked: true,
      tenant_id: 'tenant1',
      profile_id: 'profile1',
      last_updated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      card_uid: 'NFC002DEF456',
      is_linked: false,
      last_updated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: '3',
      card_uid: 'NFC003GHI789',
      is_linked: true,
      tenant_id: 'tenant2',
      profile_id: 'profile2',
      last_updated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const getNFCStats = async (): Promise<NFCStats> => {
  return {
    total_cards: 15,
    linked_cards: 8,
    unlinked_cards: 7,
    recent_scans: 23,
  };
};

export const createNFCCard = async (cardUid: string): Promise<NFCCard> => {
  return {
    _id: Date.now().toString(),
    card_uid: cardUid,
    is_linked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const deleteNFCCard = async (cardId: string): Promise<void> => {
  console.log(`Deleting NFC card: ${cardId}`);
};

export const updateNFCCard = async (cardId: string, updates: Partial<NFCCard>): Promise<NFCCard> => {
  return {
    _id: cardId,
    card_uid: updates.card_uid || 'UPDATED',
    is_linked: updates.is_linked || false,
    updatedAt: new Date().toISOString(),
  } as NFCCard;
};