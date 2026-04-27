// config/payment.config.js - PAYMENT CONFIGURATION FOR GONBOOST
export const paymentConfig = {
  // ✅ PayPal Configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox',
    baseUrl: process.env.PAYPAL_MODE === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com',
    webhookId: process.env.PAYPAL_WEBHOOK_ID,
    returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
    cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
    
    // Settings
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    autoCapture: true,
    
    // Branding
    brandName: 'GonBoost',
    logoUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/images/logo.png`,
    landingPage: 'LOGIN', // LOGIN, BILLING, NO_PREFERENCE
    
    // Currency support
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    defaultCurrency: 'USD'
  },
  
  // ✅ NowPayments Configuration
  nowPayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY,
    baseUrl: process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io/v1',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
    
    // URLs
    successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
    cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
    webhookUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/nowpayments/webhook`,
    
    // Settings
    paymentTimeout: 1800, // 30 minutes in seconds
    isFixedRate: true,
    payCurrency: 'usdterc20', // Default payment currency
    
    // Fees
    platformFeePercent: 1.0, // Platform fee percentage
    nowPaymentsFeePercent: 0.5, // NowPayments fee percentage
    
    // Supported cryptocurrencies
    supportedCrypto: [
      'btc', 'eth', 'usdt', 'usdterc20', 'usdttrc20', 
      'bnb', 'sol', 'xrp', 'ada', 'doge', 'dot', 'matic'
    ]
  },
  
  // ✅ Application Configuration
  app: {
    name: 'GonBoost',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@gonboost.com',
    
    // Currency settings
    currency: 'USD',
    currencySymbol: '$',
    
    // Amount limits
    minAmount: 1,
    maxAmount: 10000,
    
    // Timeouts
    paymentTimeoutMinutes: 30, // Payment timeout in minutes
    orderHoldHours: 24, // How long to hold unpaid orders
    
    // Retry and limits
    maxRetries: 3,
    dailyPaymentLimit: 5000, // Max daily payments per user
    commissionRate: 0.10, // 10% platform commission
    
    // Features
    autoCancelUnpaid: true,
    emailNotifications: true,
    smsNotifications: false
  },
  
  // ✅ Wallet Configuration
  wallet: {
    // Deposit limits
    minDeposit: 5,
    maxDeposit: 1000,
    maxDailyDeposits: 5000,
    
    // Withdrawal limits
    minWithdrawal: 10,
    maxWithdrawal: 5000,
    maxDailyWithdrawals: 2000,
    
    // Transaction limits
    maxDailyTransactions: 10,
    minBalance: 0,
    
    // Processing
    instantTransfers: true,
    withdrawalProcessingHours: 24, // Time to process withdrawals
    
    // Fees
    depositFeePercent: 0,
    withdrawalFeePercent: 1.0
  },
  
  // ✅ Payment Methods Configuration
  methods: {
    enabled: ['crypto', 'paypal', 'wallet'],
    
    crypto: {
      enabled: true,
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, USDT and more',
      currencies: ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE', 'DOT', 'MATIC'],
      networkFees: 0.02, // 2% estimated network fee
      confirmationBlocks: {
        btc: 3,
        eth: 12,
        usdt: 12,
        default: 6
      }
    },
    
    paypal: {
      enabled: true,
      name: 'PayPal',
      description: 'Pay with your PayPal account or credit card',
      currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      requireShipping: false,
      captureMethod: 'automatic', // automatic, manual
      refundPolicy: {
        enabled: true,
        days: 30,
        feePercent: 0
      }
    },
    
    wallet: {
      enabled: true,
      name: 'Wallet Balance',
      description: 'Use your available wallet balance',
      instant: true,
      minPayment: 1,
      requireVerification: false
    }
  },
  
  // ✅ Security Configuration
  security: {
    // IPN/Webhook security
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    ipnWhitelist: ['::1', '127.0.0.1', 'localhost'], // Add production IPs
    
    // Rate limiting
    maxRequestsPerMinute: 60,
    paymentVerification: true,
    
    // Fraud prevention
    geoBlocking: false,
    highRiskCountries: [], // List of high-risk country codes
    requireKYC: false,
    kycThreshold: 1000 // Amount requiring KYC verification
  },
  
  // ✅ Notification Configuration
  notifications: {
    email: {
      paymentReceived: true,
      paymentCompleted: true,
      paymentFailed: true,
      refundIssued: true
    },
    
    webhook: {
      enabled: true,
      events: [
        'payment.created',
        'payment.completed',
        'payment.failed',
        'payment.refunded',
        'order.paid',
        'order.cancelled'
      ]
    },
    
    adminNotifications: {
      highValuePayment: 1000, // Notify admin for payments over this amount
      failedPaymentThreshold: 3, // Notify after X failed attempts
      suspiciousActivity: true
    }
  },
  
  // ✅ Testing Configuration
  testing: {
    mockPayments: process.env.NODE_ENV !== 'production',
    testCardNumbers: {
      paypal: {
        sandbox: {
          visa: '4032035375362582',
          mastercard: '5555555555554444'
        }
      }
    },
    skipVerification: process.env.NODE_ENV === 'development'
  }
};

// ✅ Helper functions
export const getPaymentMethodConfig = (method) => {
  if (!paymentConfig.methods.enabled.includes(method)) {
    return null;
  }
  
  switch(method) {
    case 'paypal':
      return {
        ...paymentConfig.paypal,
        ...paymentConfig.methods.paypal,
        type: 'paypal'
      };
    case 'crypto':
      return {
        ...paymentConfig.nowPayments,
        ...paymentConfig.methods.crypto,
        type: 'crypto'
      };
    case 'wallet':
      return {
        ...paymentConfig.wallet,
        ...paymentConfig.methods.wallet,
        type: 'wallet'
      };
    default:
      return null;
  }
};

// ✅ Validate payment amount with method-specific rules
export const validatePaymentAmount = (amount, method = null) => {
  const { minAmount, maxAmount } = paymentConfig.app;
  
  if (amount < minAmount) {
    throw new Error(`El monto mínimo es $${minAmount}`);
  }
  
  if (amount > maxAmount) {
    throw new Error(`El monto máximo es $${maxAmount}`);
  }
  
  // Method-specific validations
  if (method) {
    const methodConfig = getPaymentMethodConfig(method);
    
    if (!methodConfig) {
      throw new Error(`Método de pago no válido: ${method}`);
    }
    
    if (method === 'wallet') {
      if (amount < paymentConfig.wallet.minDeposit) {
        throw new Error(`El depósito mínimo en wallet es $${paymentConfig.wallet.minDeposit}`);
      }
    }
  }
  
  return true;
};

// ✅ Calculate fees
export const calculateFees = (amount, method) => {
  const baseFees = {
    platformFee: 0,
    paymentFee: 0,
    total: amount
  };
  
  switch (method) {
    case 'crypto':
      baseFees.paymentFee = amount * paymentConfig.nowPayments.nowPaymentsFeePercent / 100;
      baseFees.platformFee = amount * paymentConfig.app.commissionRate;
      break;
      
    case 'paypal':
      // PayPal typically charges ~3.49% + $0.49 per transaction
      baseFees.paymentFee = (amount * 0.0349) + 0.49;
      baseFees.platformFee = amount * paymentConfig.app.commissionRate;
      break;
      
    case 'wallet':
      baseFees.paymentFee = 0; // No fee for wallet-to-wallet
      baseFees.platformFee = amount * paymentConfig.app.commissionRate;
      break;
  }
  
  baseFees.total = amount + baseFees.paymentFee;
  
  return {
    ...baseFees,
    amount,
    method,
    breakdown: {
      subtotal: amount,
      paymentGatewayFee: baseFees.paymentFee,
      platformFee: baseFees.platformFee,
      total: baseFees.total
    }
  };
};

// ✅ Get supported currencies for method
export const getSupportedCurrencies = (method) => {
  switch (method) {
    case 'paypal':
      return paymentConfig.methods.paypal.currencies;
    case 'crypto':
      return paymentConfig.methods.crypto.currencies;
    case 'wallet':
      return [paymentConfig.app.currency];
    default:
      return [paymentConfig.app.currency];
  }
};

// ✅ Check if payment method is available
export const isPaymentMethodAvailable = (method) => {
  return paymentConfig.methods.enabled.includes(method) && 
         paymentConfig.methods[method]?.enabled === true;
};

export default paymentConfig;