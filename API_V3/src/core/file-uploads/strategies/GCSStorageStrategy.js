const { Storage } = require('@google-cloud/storage');
const path = require('path');

class GCSStorageStrategy {
  constructor() {
    this.bucketName = process.env.GCS_BUCKET;
    this.publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL || `https://storage.googleapis.com/${this.bucketName}`;
    this.storage = new Storage();
    this.bucket = this.storage.bucket(this.bucketName);
  }

  async upload(file, options = {}) {
    const { tenantId = 'common', category = 'general' } = options;
    const destPath = path.posix.join('tenants', tenantId.toString(), category, file.filename);

    await this.bucket.upload(file.path, {
      destination: destPath,
      gzip: true,
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    return `${this.publicBaseUrl}/${destPath}`;
  }

  async delete(fileUrl) {
    try {
      const prefix = `${this.publicBaseUrl}/`;
      const objectPath = fileUrl.startsWith(prefix) ? fileUrl.slice(prefix.length) : fileUrl;
      await this.bucket.file(objectPath).delete({ ignoreNotFound: true });
      return true;
    } catch (err) {
      console.error('Error deleting GCS object:', err);
      return false;
    }
  }
}
module.exports = GCSStorageStrategy;