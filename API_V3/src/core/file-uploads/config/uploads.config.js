const path = require('path');

const UPLOAD_BASE_DIR = path.join(__dirname, '../../../../uploads');

const FOLDERS = {
  TENANTS: 'tenants',
  TEMP: 'temp',
  CATEGORIES: {
    GENERAL: 'general',
    PROFILES: 'profiles',
    PRODUCTS: 'products',
    PAYMENTS: 'payments',
    CHECKOUT_RECEIPTS: 'checkout-receipts'
  }
};

const MIME_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  PDF: ['application/pdf'],
  DOCUMENTS: ['application/pdf'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

module.exports = {
  UPLOAD_BASE_DIR,
  FOLDERS,
  MIME_TYPES,
  MAX_FILE_SIZE
};