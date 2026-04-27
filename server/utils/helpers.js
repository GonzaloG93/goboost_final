// Generar IDs únicos
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

// Formatear dinero
const formatMoney = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Validar email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Calcular tiempo estimado
const calculateEstimatedTime = (currentRank, desiredRank, serviceType) => {
  const rankValues = {
    'Iron': 1, 'Bronze': 2, 'Silver': 3, 'Gold': 4,
    'Platinum': 5, 'Diamond': 6, 'Master': 7, 'Grandmaster': 8, 'Challenger': 9
  };

  const current = rankValues[currentRank] || 1;
  const desired = rankValues[desiredRank] || 1;
  
  if (desired <= current) return '1-2 días';

  const difference = desired - current;
  let baseDays = difference * 2;

  // Ajustar según el tipo de servicio
  if (serviceType === 'coaching') {
    baseDays = Math.ceil(baseDays / 2);
  } else if (serviceType === 'placement_matches') {
    baseDays = 1;
  }

  return `${baseDays}-${baseDays + 2} días`;
};

// Sanitizar datos
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Generar password temporal
const generateTempPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Calcular comisión
const calculateCommission = (totalPrice, userRole = 'booster') => {
  const commissionRates = {
    'booster': 0.7, // 70% para el booster
    'platform': 0.3  // 30% para la plataforma
  };

  return {
    booster: totalPrice * commissionRates.booster,
    platform: totalPrice * commissionRates.platform
  };
};

// Formatear fecha
const formatDate = (date, includeTime = false) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Date(date).toLocaleDateString('es-ES', options);
};

module.exports = {
  generateUniqueId,
  formatMoney,
  isValidEmail,
  calculateEstimatedTime,
  sanitizeInput,
  generateTempPassword,
  calculateCommission,
  formatDate
};