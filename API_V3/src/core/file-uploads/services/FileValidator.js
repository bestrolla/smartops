const config = require('../config/uploads.config');

class FileValidator {
  static validateFile(file, options = {}) {
    const {
      allowedTypes = config.MIME_TYPES.ALL,
      maxSize = config.MAX_FILE_SIZE
    } = options;

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
    }

    return true;
  }

  static isImage(mimetype) {
    return config.MIME_TYPES.IMAGES.includes(mimetype);
  }

  static isDocument(mimetype) {
    return config.MIME_TYPES.DOCUMENTS.includes(mimetype);
  }
}

module.exports = FileValidator;