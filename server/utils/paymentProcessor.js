// paymentProcessor.js - Con PayPal real y criptomonedas
const axios = require('axios');

class PaymentProcessor {
  constructor() {
    this.providers = {
      stripe: this.processStripePayment.bind(this),
      paypal: this.processPayPalPayment.bind(this),
      wallet: this.processWalletPayment.bind(this),
      crypto: this.processCryptoPayment.bind(this)
    };

    // Configuración PayPal
    this.paypalConfig = {
      clientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'your_paypal_client_secret',
      environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox', // 'sandbox' o 'live'
      apiUrl: process.env.PAYPAL_ENVIRONMENT === 'live' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com'
    };

    // Configuración para criptomonedas
    this.cryptoConfig = {
      coinbaseApiKey: process.env.COINBASE_API_KEY || 'your_coinbase_api_key',
      bitpayApiKey: process.env.BITPAY_API_KEY || 'your_bitpay_api_key',
      supportedCurrencies: ['BTC', 'ETH', 'USDC', 'DAI', 'LTC'],
      confirmationThreshold: 3,
      timeoutMinutes: 30
    };

    // Cache para access token de PayPal
    this.paypalAccessToken = null;
    this.tokenExpiry = null;
  }

  // Obtener access token de PayPal
  async getPayPalAccessToken() {
    if (this.paypalAccessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.paypalAccessToken;
    }

    try {
      const auth = Buffer.from(`${this.paypalConfig.clientId}:${this.paypalConfig.clientSecret}`).toString('base64');
      
      const response = await axios.post(`${this.paypalConfig.apiUrl}/v1/oauth2/token`, 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.paypalAccessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minuto antes

      return this.paypalAccessToken;
    } catch (error) {
      console.error('Error obteniendo token de PayPal:', error.response?.data || error.message);
      throw new Error('No se pudo autenticar con PayPal');
    }
  }

  async processPayment(provider, paymentData) {
    const processor = this.providers[provider];
    if (!processor) {
      throw new Error(`Proveedor de pago no soportado: ${provider}`);
    }

    return await processor(paymentData);
  }

  // PAYPAL - Implementación Real
  async processPayPalPayment(paymentData) {
    const { amount, currency = 'USD', orderId, returnUrl, cancelUrl, description = 'Compra en tienda' } = paymentData;

    try {
      // 1. Crear orden en PayPal
      const accessToken = await this.getPayPalAccessToken();
      
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString()
            },
            description: description,
            custom_id: orderId,
            invoice_id: `INV-${orderId}-${Date.now()}`
          }
        ],
        application_context: {
          brand_name: 'Tu Tienda',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
          shipping_preference: 'NO_SHIPPING'
        }
      };

      const createOrderResponse = await axios.post(
        `${this.paypalConfig.apiUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const paypalOrder = createOrderResponse.data;

      return {
        success: true,
        transactionId: paypalOrder.id,
        orderId: orderId,
        amount: amount,
        currency: currency,
        provider: 'paypal',
        approvalUrl: paypalOrder.links.find(link => link.rel === 'approve').href,
        status: paypalOrder.status,
        createdAt: paypalOrder.create_time
      };

    } catch (error) {
      console.error('Error en PayPal payment:', error.response?.data || error.message);
      throw new Error(`Error procesando pago con PayPal: ${error.response?.data?.message || error.message}`);
    }
  }

  // Capturar pago de PayPal (cuando el usuario aprueba el pago)
  async capturePayPalPayment(orderId) {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const captureResponse = await axios.post(
        `${this.paypalConfig.apiUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const captureData = captureResponse.data;
      const purchaseUnit = captureData.purchase_units[0];
      const capture = purchaseUnit.payments.captures[0];

      return {
        success: capture.status === 'COMPLETED',
        transactionId: capture.id,
        paypalOrderId: orderId,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        status: capture.status,
        captureTime: capture.create_time,
        payer: captureData.payer,
        provider: 'paypal'
      };

    } catch (error) {
      console.error('Error capturando pago PayPal:', error.response?.data || error.message);
      throw new Error(`Error capturando pago PayPal: ${error.response?.data?.message || error.message}`);
    }
  }

  // Obtener detalles de una orden PayPal
  async getPayPalOrderDetails(orderId) {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const response = await axios.get(
        `${this.paypalConfig.apiUrl}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalles de orden PayPal:', error.response?.data || error.message);
      throw new Error(`Error obteniendo detalles de orden PayPal: ${error.response?.data?.message || error.message}`);
    }
  }

  // Reembolsar pago de PayPal
  async refundPayPalPayment(captureId, amount = null, reason = '') {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const refundData = {};
      if (amount) {
        refundData.amount = {
          value: amount.value.toString(),
          currency_code: amount.currency
        };
      }
      if (reason) {
        refundData.note_to_payer = reason;
      }

      const refundResponse = await axios.post(
        `${this.paypalConfig.apiUrl}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return refundResponse.data;
    } catch (error) {
      console.error('Error en reembolso PayPal:', error.response?.data || error.message);
      throw new Error(`Error procesando reembolso PayPal: ${error.response?.data?.message || error.message}`);
    }
  }

  // CRIPTOMONEDAS (sin cambios)
  async processCryptoPayment(paymentData) {
    const { currency, amount, orderId, returnUrl, cancelUrl } = paymentData;

    if (!this.cryptoConfig.supportedCurrencies.includes(currency)) {
      throw new Error(`Criptomoneda no soportada: ${currency}`);
    }

    await this.simulateDelay();

    const cryptoInvoice = await this.createCryptoInvoice({
      currency,
      amount,
      orderId,
      returnUrl,
      cancelUrl
    });

    return {
      success: true,
      transactionId: `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: currency,
      provider: 'crypto',
      paymentAddress: cryptoInvoice.paymentAddress,
      paymentAmount: cryptoInvoice.paymentAmount,
      expiryTime: cryptoInvoice.expiryTime,
      qrCode: cryptoInvoice.qrCode
    };
  }

  async createCryptoInvoice(paymentDetails) {
    // Simulación para desarrollo
    return {
      paymentAddress: this.generateCryptoAddress(paymentDetails.currency),
      paymentAmount: paymentDetails.amount,
      expiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`crypto:${this.generateCryptoAddress(paymentDetails.currency)}?amount=${paymentDetails.amount}`)}`
    };
  }

  generateCryptoAddress(currency) {
    const prefixes = {
      BTC: '1',
      ETH: '0x',
      LTC: 'L'
    };
    
    const prefix = prefixes[currency] || '';
    const randomChars = Math.random().toString(36).substr(2, 25);
    return `${prefix}${randomChars}`.toUpperCase();
  }

  // MÉTODOS EXISTENTES (Stripe y Wallet)
  async processStripePayment(paymentData) {
    await this.simulateDelay();
    return {
      success: true,
      transactionId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: paymentData.amount,
      currency: 'usd',
      provider: 'stripe'
    };
  }

  async processWalletPayment(paymentData) {
    const { userId, amount, orderId } = paymentData;
    await this.simulateDelay();
    return {
      success: true,
      transactionId: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: 'usd',
      provider: 'wallet'
    };
  }

  async simulateDelay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateCreditCard(cardData) {
    const { number, expMonth, expYear, cvc } = cardData;

    if (!number || number.length !== 16) {
      throw new Error('Número de tarjeta inválido');
    }

    if (!expMonth || expMonth < 1 || expMonth > 12) {
      throw new Error('Mes de expiración inválido');
    }

    const currentYear = new Date().getFullYear();
    if (!expYear || expYear < currentYear) {
      throw new Error('Año de expiración inválido');
    }

    if (!cvc || cvc.length < 3) {
      throw new Error('CVC inválido');
    }

    return true;
  }
}

module.exports = new PaymentProcessor();