const FileUploadService = require('../services/fileUpload.service');
const config = require('../config/uploads.config');

module.exports = {
  // For payment proofs
  paymentProof: FileUploadService.createUploadMiddleware({
    category: config.FOLDERS.CATEGORIES.PAYMENTS,
    allowedTypes: [...config.MIME_TYPES.IMAGES, ...config.MIME_TYPES.DOCUMENTS],
    prefix: 'payment_'
  }),

  // For profile images
  profileImage: FileUploadService.createUploadMiddleware({
    category: config.FOLDERS.CATEGORIES.PROFILE,
    allowedTypes: config.MIME_TYPES.IMAGES,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    prefix: 'profile_'
  }),

  // For product images
  productImage: FileUploadService.createUploadMiddleware({
    category: config.FOLDERS.CATEGORIES.PRODUCTS,
    allowedTypes: config.MIME_TYPES.IMAGES,
    prefix: 'product_'
  }),

  // For service gallery
  serviceGallery: FileUploadService.createUploadMiddleware({
    category: config.FOLDERS.CATEGORIES.SERVICES,
    allowedTypes: config.MIME_TYPES.IMAGES,
    prefix: 'service_'
  }),

  // Temporary upload (for later processing)
  tempUpload: FileUploadService.createUploadMiddleware({
    useTemp: true,
    prefix: 'temp_'
  })
};