const axios = require('axios');
const PaymentMethod = require('../models/paymentMethod.model');
const createError = require('../../../shared/errors.utils');

class PaymentProcessor {
  constructor(tenantId) {
    this.tenantId = tenantId;
  }

  async processPayment(amount, currency, paymentData) {
    const method = await PaymentMethod.findOne({
      tenant: this.tenantId,
      currency,
      isActive: true
    });

    if (!method) {
      throw createError(400, 'Método de pago no configurado');
    }

    switch (method.type) {
      case 'paypal':
        return this._processPayPal(amount, method.config, paymentData);
      case 'binance':
        return this._processBinance(amount, method.config, paymentData);
      default:
        throw createError(400, 'Método de pago no soportado');
    }
  }

  async _processPayPal(amount, config, paymentData) {
    try {
      const response = await axios.post('https://api.paypal.com/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2)
          }
        }]
      }, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        paymentId: response.data.id,
        status: 'pending',
        approvalUrl: response.data.links.find(link => link.rel === 'approve').href
      };
    } catch (error) {
      throw createError(502, 'Error en PayPal: ' + error.message);
    }
  }

  async _processBinance(amount, config, paymentData) {
    try {
      // Binance Pay API (documentación: https://developers.binance.com/docs/binance-pay/api-order-create)
      const timestamp = Date.now();
      const nonce = crypto.randomUUID();
      const body = {
        env: {
          terminalType: 'WEB'
        },
        merchantTradeNo: `pay_${timestamp}`,
        orderAmount: amount.toFixed(2),
        currency: 'USDT',
        goods: {
          goodsType: '02',
          goodsCategory: 'Z000',
          referenceGoodsId: 'subscription',
          goodsName: 'Pago de suscripción'
        }
      };

      const signature = this._generateBinanceSignature(config.apiSecret, body, timestamp, nonce);

      const response = await axios.post('https://bpay.binanceapi.com/binancepay/openapi/v2/order', body, {
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp,
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': config.apiKey,
          'BinancePay-Signature': signature
        }
      });

      return {
        paymentId: response.data.merchantTradeNo,
        status: 'pending',
        qrCode: response.data.qrcodeLink
      };
    } catch (error) {
      throw createError(502, 'Error en Binance: ' + error.message);
    }
  }

  _generateBinanceSignature(apiSecret, body, timestamp, nonce) {
    const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
    return crypto.createHmac('sha512', apiSecret).update(payload).digest('hex');
  }
}

module.exports = PaymentProcessor;