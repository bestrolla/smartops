const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/uploads.config');
const LocalStorageStrategy = require('../strategies/LocalStorageStrategy');
const FileValidator = require('./FileValidator');

class FileUploadService {
  constructor() {
    this.strategy = new LocalStorageStrategy(); // Usar solo LocalStorageStrategy por ahora
    this.tempDir = path.join(config.UPLOAD_BASE_DIR, config.FOLDERS.TEMP);
    this.ensureDirExists(this.tempDir);
  }

  async ensureDirExists(dirPath) {
    const fs = require('fs').promises;
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  getTenantPath(tenantId) {
    return path.join(
      config.UPLOAD_BASE_DIR, 
      config.FOLDERS.TENANTS, 
      tenantId
    );
  }

  createUploadMiddleware(options = {}) {
    const {
      tenantId = 'common',
      category = 'general',
      fieldName = 'file',
      prefix = '',
      useTemp = false,
      allowedTypes = config.MIME_TYPES.ALL,
      maxFileSize = config.MAX_FILE_SIZE
    } = options;

    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          let uploadPath;
          
          if (useTemp) {
            uploadPath = this.tempDir;
            console.log('[FileUploadService] Usando carpeta temporal:', uploadPath);
            await this.ensureDirExists(uploadPath);
          } else {
            const currentTenantId = (req.params && req.params.tenant_id) ? req.params.tenant_id : tenantId;
            uploadPath = path.join(
              this.getTenantPath(currentTenantId), 
              config.FOLDERS.CATEGORIES[category.toUpperCase()] || category
            );
            await this.ensureDirExists(uploadPath);
          }
          
          console.log('[FileUploadService] Carpeta de destino:', uploadPath);
          cb(null, uploadPath);
        } catch (error) {
          console.error('[FileUploadService] Error en destination:', error);
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        try {
          FileValidator.validateFile(file, { allowedTypes, maxSize: maxFileSize });
          const ext = path.extname(file.originalname);
          const filename = `${prefix}${uuidv4()}${ext}`;
          console.log('[FileUploadService] Generando nombre de archivo:', {
            originalname: file.originalname,
            filename,
            prefix,
            ext
          });
          cb(null, filename);
        } catch (error) {
          console.error('[FileUploadService] Error en filename:', error);
          cb(error);
        }
      }
    });

    return multer({ 
      storage,
      limits: { fileSize: maxFileSize }
    });
  }

  async saveFile(file, options = {}) {
    return this.strategy.upload(file, options);
  }

  async deleteFile(fileUrl) {
    return this.strategy.delete(fileUrl);
  }

  async moveToPermanent(tenantId, tempFilename, category) {
    const fs = require('fs').promises;
    const tempPath = path.join(this.tempDir, tempFilename);
    const finalPath = path.join(
      this.getTenantPath(tenantId),
      config.FOLDERS.CATEGORIES[category.toUpperCase()] || category,
      tempFilename
    );

    console.log('[FileUploadService] Moviendo archivo:', {
      tempPath,
      finalPath,
      tempFilename,
      tenantId,
      category
    });

    // Verificar que el archivo temporal existe
    try {
      await fs.access(tempPath);
      console.log('[FileUploadService] Archivo temporal encontrado');
    } catch (error) {
      console.error('[FileUploadService] Archivo temporal no encontrado:', tempPath);
      throw new Error(`Archivo temporal no encontrado: ${tempPath}`);
    }

    // Crear carpeta de destino si no existe
    await this.ensureDirExists(path.dirname(finalPath));
    
    // Mover archivo
    await fs.rename(tempPath, finalPath);
    
    console.log('[FileUploadService] Archivo movido exitosamente a:', finalPath);
    return this.getPublicUrl(tenantId, category, tempFilename);
  }

  getPublicUrl(tenantId, category, filename) {
    return `/uploads/tenants/${tenantId}/${category}/${filename}`;
  }
}

module.exports = new FileUploadService();