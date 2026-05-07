const multer = require('multer');
const path = require('path');
const { storageService } = require('../../../../core/file-uploads/middlewares/uploadMiddleware');
const { validateReceipt } = require('../validators/paymentReceiptValidator');
const PaymentReceiptPolicy = require('../policies/PaymentReceiptPolicy');
const CartService = require('../../services/CartService');
const AppError = require('../../../../shared/errors.utils');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.strategy.uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, storageService.generateFileName(file.originalname, 'receipt_'));
  }
});

const fileFilter = (req, file, cb) => {
  try {
    validateReceipt(file);
    cb(null, true);
  } catch (error) {
    cb(new AppError(error.message, 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: PaymentReceiptPolicy.maxFileSize() }
});

// Middleware que combina la subida con validación de carrito
const paymentReceiptUpload = (req, res, next) => {
  const uploadSingle = upload.single('receipt');
  
  uploadSingle(req, res, async (err) => {
    try {
      if (err) return next(err);
      
      // Validar que el usuario puede subir para este carrito
      const tenantId = req.tenant?.id;
      const userId = req.user?._id;
      const cartService = new CartService(tenantId, userId);
      const cart = await cartService.getCart();
      
      if (!PaymentReceiptPolicy.canUpload(req.user, cart)) {
        throw new AppError('No autorizado para subir comprobantes', 403);
      }
      
      req.cart = cart; // Adjuntamos el carrito para uso posterior
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = {
  paymentReceiptUpload
};