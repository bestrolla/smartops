// strategies/S3StorageStrategy.js
const AWS = require('aws-sdk');

class S3StorageStrategy {
  constructor(config) {
    this.s3 = new AWS.S3(config);
    this.bucketName = config.bucketName;
  }

  async upload(file, options = {}) {
    const fileContent = await fs.promises.readFile(file.path);
    const params = {
      Bucket: this.bucketName,
      Key: `tenants/${options.tenantId}/${options.category}/${file.filename}`,
      Body: fileContent,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await this.s3.upload(params).promise();
    return result.Location; // URL pública del archivo
  }

  // Implementar otros métodos necesarios...
}

module.exports = S3StorageStrategy;