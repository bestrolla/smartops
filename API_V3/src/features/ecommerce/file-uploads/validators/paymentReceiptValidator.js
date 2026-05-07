const PaymentReceiptPolicy = require('../policies/PaymentReceiptPolicy');

module.exports = {
  validateReceipt: (file) => {
    if (!PaymentReceiptPolicy.allowedMimeTypes().includes(file.mimetype)) {
      throw new Error(`Tipo de archivo no permitido. Formatos aceptados: ${PaymentReceiptPolicy.allowedMimeTypes().join(', ')}`);
    }

    if (file.size > PaymentReceiptPolicy.maxFileSize()) {
      throw new Error(`El archivo excede el tamaño máximo de ${PaymentReceiptPolicy.maxFileSize() / 1024 / 1024}MB`);
    }

    return true;
  }
};