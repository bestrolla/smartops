class PaymentReceiptPolicy {
  static canUpload(user, cart) {
    // Solo el dueño del carrito puede subir comprobantes
    return user._id.equals(cart.user);
  }

  static allowedMimeTypes() {
    return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  }

  static maxFileSize() {
    return 5 * 1024 * 1024; // 5MB
  }
}

module.exports = PaymentReceiptPolicy;