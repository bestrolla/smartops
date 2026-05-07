const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Epayment');
const Order = require('../../orders/models/Order');
const Inventory = require('../../inventory/models/Inventory');

class EPaymentService {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async createPaymentIntent(cart, paymentMethod) {
    // 1. Convertir carrito a orden
    const order = new Order({
      tenant: this.tenantId,
      customer: cart.user,
      items: cart.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      totalAmount: cart.total,
      paymentMethod,
      status: 'pending'
    });

    // 2. Crear intención de pago en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(cart.total * 100), // Stripe usa centavos
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { tenantId: this.tenantId, orderId: order._id.toString() }
    });

    // 3. Guardar pago en DB
    const payment = new Payment({
      tenantId: this.tenantId,
      order: order._id,
      amount: cart.total,
      paymentMethod,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });

    await Promise.all([order.save(), payment.save()]);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    };
  }

  async handleWebhook(event) {
    const paymentIntent = event.data.object;
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });

    if (!payment) throw new Error('Pago no encontrado');

    switch (event.type) {
      case 'payment_intent.succeeded':
        payment.status = 'succeeded';
        await Order.updateOne(
          { _id: payment.order }, 
          { 
            paymentStatus: 'paid',
            status: 'processing'
          }
        );
        
        // Actualizar inventario
        const order = await Order.findById(payment.order).populate('items.product');
        for (const item of order.items) {
          await Inventory.updateOne(
            { product_id: item.product._id, tenant_id: this.tenantId },
            { $inc: { current_stock: -item.quantity } }
          );
        }
        break;
        
      case 'payment_intent.payment_failed':
        payment.status = 'failed';
        await Order.updateOne(
          { _id: payment.order }, 
          { paymentStatus: 'failed' }
        );
        break;
    }

    await payment.save();
    return payment;
  }
}

module.exports = EPaymentService;