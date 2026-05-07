const NFCService = require("../services/nfc.service")
const ProfileModel  =  require("../models/profile.model")

const NFCController = {
  async getPayload(req, res, next) {
    try {
      const { tenant_id } = req.params;
      
      console.log('[NFCController] Generando payload NFC:', {
        tenant_id,
        user: req.user
      });

      const payload = await NFCService.generateNFCPayload(tenant_id);
      res.json(payload);
    } catch (error) {
      console.error('[NFCController] Error generando payload:', error);
      next(error);
    }
  },

  async linkCard(req, res, next) {
    try {
      const { tenant_id } = req.params;
      let { card_uid } = req.body;

      card_uid = String(card_uid || '').replace(/[^0-9a-f]/gi, '').toUpperCase();

      const profile = await NFCService.linkNFCCard(tenant_id, card_uid);
      res.json(profile);
    } catch (error) {
      console.error('[NFCController] Error linking card:', error);
      next(error);
    }
  },

  async linkByLabel(req, res, next) {
    try {
      const { tenant_id } = req.params;
      const { card_label } = req.body;

      const profile = await NFCService.linkNFCCardByLabel(tenant_id, card_label);
      res.json(profile);
    } catch (error) {
      console.error('[NFCController] Error linking by label:', error);
      next(error);
    }
  },

  async updateLabel(req, res, next) {
    try {
      const { tenant_id } = req.params;
      const { card_label } = req.body;

      const profile = await NFCService.updateNFCLabel(tenant_id, card_label);
      res.json(profile);
    } catch (error) {
      console.error('[NFCController] Error updating NFC label:', error);
      next(error);
    }
  },

  async unlinkCard(req, res, next) {
    try {
      const { tenant_id } = req.params;

      const profile = await NFCService.unlinkNFCCard(tenant_id);
      res.json(profile);
    } catch (error) {
      console.error('[NFCController] Error unlinking card:', error);
      next(error);
    }
  },

  async getProfileByNFC(req, res) {
    let { card_uid } = req.body;
    card_uid = String(card_uid || '').replace(/[^0-9a-f]/gi, '').toUpperCase();

    const profile = await ProfileModel.findOne({ 'nfc.card_uid': card_uid });

    if (!profile) {
      return res.status(404).json({ error: 'NFC card not registered or profile not found' });
    }
    res.json(profile);
  }
};

module.exports = NFCController;