const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const config = require('../config/uploads.config');

class LocalStorageStrategy {
  constructor() {
    this.baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../../../../uploads');
  }

  async upload(file, options) {
    const { tenantId = 'common', category = 'general' } = options;
    const uploadDir = path.join(this.baseUploadPath, 'tenants', tenantId, category);
    
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, file.filename);
    await fs.rename(file.path, filePath); // Mover el archivo temporal de Multer
    
    // Retornar una URL relativa para el acceso público
    const relativePath = path.relative(this.baseUploadPath, filePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  async delete(fileUrl) {
    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(this.baseUploadPath, relativePath);
    try {
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Error deleting local file:', error);
      return false;
    }
  }
}

module.exports = LocalStorageStrategy;