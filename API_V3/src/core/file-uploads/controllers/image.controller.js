const path = require('path');
const fs = require('fs').promises;
const config = require('../config/uploads.config');

class ImageController {
  async serveImage(req, res) {
    try {
      console.log('🖼️ ImageController.serveImage llamado con:', req.params);
      const { imagePath } = req.params;
      
      // Decodificar la ruta de la imagen
      const decodedPath = decodeURIComponent(imagePath);
      
      // Construir la ruta completa del archivo
      const fullPath = path.join(config.UPLOAD_BASE_DIR, decodedPath);
      
      // Verificar que el archivo existe
      try {
        await fs.access(fullPath);
      } catch (error) {
        console.log('❌ Imagen no encontrada:', { decodedPath, fullPath });
        return res.status(404).json({ 
          error: 'Imagen no encontrada',
          path: decodedPath 
        });
      }
      
      // Obtener información del archivo
      const stats = await fs.stat(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      
      // Determinar el tipo MIME
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      // Configurar headers para evitar problemas de CORS
      res.set({
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
        'Last-Modified': stats.mtime.toUTCString()
      });
      
      // Servir el archivo
      console.log('✅ Sirviendo imagen exitosamente:', { decodedPath, fullPath, contentType });
      const stream = require('fs').createReadStream(fullPath);
      stream.pipe(res);
      
    } catch (error) {
      console.error('Error sirviendo imagen:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error.message 
      });
    }
  }
}

module.exports = new ImageController();
