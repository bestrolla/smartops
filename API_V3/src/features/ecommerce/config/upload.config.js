const fileUploadService = require('../../../core/file-uploads/services/fileUpload.service');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const checkoutUpload = fileUploadService.createUploadMiddleware(
  'checkout/receipts',
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
);

module.exports = {
  checkoutUpload
}; 