const ProfileModel  =  require("../models/profile.model")
const TenantService = require('../../tenant/services/tenant.service');
const crypto = require('crypto');

class NFCService {
  static async generateNFCPayload(tenant_id) {
    console.log('[NFCService] Buscando perfil:', { tenant_id });
    
    try {
      const profile = await ProfileModel.findOne({ tenant_id });
      
      console.log('[NFCService] Resultado de búsqueda:', {
        found: !!profile,
        profileId: profile?._id,
        tenant_id: profile?.tenant_id
      });

      if (!profile) {
        throw new Error(`Profile not found for tenant_id: ${tenant_id}`);
      }

      // Resolver base del sitio sin slash final
      const siteBase = (process.env.FRONTEND_URL || process.env.PUBLIC_SITE_URL || 'https://smartopsve.com').replace(/\/+$/, '');
      // Obtener slug del tenant
      const tenant = await TenantService.findById(tenant_id);
      const slug = tenant?.slug || tenant?.name;
  
      // URL pública del perfil por slug
      const profileUrl = `${siteBase}/${slug}`;
  
      return {
        type: 'URL',
        payload: profileUrl,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`,
        card_uid: profile.nfc?.card_uid || null
      };
    } catch (error) {
      console.error('[NFCService] Error en generateNFCPayload:', error);
      throw error;
    }
  }

  static async linkNFCCard(tenant_id, card_uid) {
    // Normalización defensiva en el servicio
    const normalized = String(card_uid || '').replace(/[^0-9a-f]/gi, '').toUpperCase();

    // Bloquea solo si el UID pertenece a otro tenant
    const existingCard = await ProfileModel.findOne({
      'nfc.card_uid': normalized,
      tenant_id: { $ne: tenant_id }
    });
    if (existingCard) throw new Error('NFC card already linked to another profile');

    return ProfileModel.findOneAndUpdate(
      { tenant_id },
      { 
        $set: { 
          'nfc.card_uid': normalized,
          'nfc.is_linked': true,
          'nfc.last_updated': new Date() 
        } 
      },
      { new: true }
    );
  }

  static generateUidFromLabel(tenant_id, card_label) {
    const base = `${tenant_id}:${String(card_label || '').trim().toUpperCase()}`;
    return crypto.createHash('sha1').update(base).digest('hex').slice(0, 20).toUpperCase();
  }

  static async linkNFCCardByLabel(tenant_id, card_label) {
    const uid = NFCService.generateUidFromLabel(tenant_id, card_label);

    // Evita colisión con otra cuenta
    const existingCard = await ProfileModel.findOne({ 'nfc.card_uid': uid, tenant_id: { $ne: tenant_id } });
    if (existingCard) throw new Error('NFC card already linked to another profile');

    return ProfileModel.findOneAndUpdate(
      { tenant_id },
      { 
        $set: { 
          'nfc.card_label': String(card_label || '').trim(),
          'nfc.card_uid': uid,
          'nfc.is_linked': true,
          'nfc.last_updated': new Date()
        } 
      },
      { new: true }
    );
  }

  static async unlinkNFCCard(tenant_id) {
    return ProfileModel.findOneAndUpdate(
      { tenant_id },
      { $set: { 'nfc.is_linked': false } },
      { new: true }
    );
  }

  static getPublicNfcConfigBySlug(slug) {
    const siteBase = (process.env.FRONTEND_URL || process.env.PUBLIC_SITE_URL || 'https://smartopsve.com').replace(/\/+$/, '');
    const url = `${siteBase}/${slug}`;
    return {
      url,
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
    };
  }
}

module.exports = NFCService;