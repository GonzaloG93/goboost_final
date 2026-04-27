// backend/middleware/validation.js - VERSIÓN CORREGIDA PARA VARIABLE_LEVELING
import { body, query, validationResult } from 'express-validator';

// ======================
// MIDDLEWARE BÁSICOS
// ======================

// Sanitización básica
export const sanitizeInput = (req, res, next) => {
  // Sanitizar body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  
  // Sanitizar query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }
  
  next();
};

// Middleware de validación
export const validate = (validations) => {
  return async (req, res, next) => {
    try {
      for (const validation of validations) {
        await validation.run(req);
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array().map(error => ({
            field: error.path,
            message: error.msg
          }))
        });
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno en validación'
      });
    }
  };
};

// ======================
// VALIDACIONES DE USUARIO
// ======================

export const validateRegistration = validate([
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor proporciona un email válido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
]);

export const validateLogin = validate([
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
]);

// ======================
// VALIDACIONES DE TICKETS
// ======================

export const validateTicketCreate = validate([
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El asunto debe tener entre 5 y 200 caracteres'),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
  
  body('category')
    .isIn(['technical', 'billing', 'general', 'order_issue', 'account', 'other'])
    .withMessage('Categoría no válida')
]);

export const validateTicketReply = validate([
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('El mensaje debe tener entre 1 y 1000 caracteres')
]);

export const validateTicketStatus = validate([
  body('status')
    .isIn(['open', 'in_progress', 'waiting_support', 'waiting_customer', 'resolved', 'closed'])
    .withMessage('Estado no válido')
]);

// ======================
// VALIDACIONES DE SERVICIOS - VERSIÓN CORREGIDA PARA VARIABLE_LEVELING
// ======================

export const validateServiceCreate = validate([
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre del servicio debe tener entre 3 y 100 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('La descripción debe tener entre 10 y 500 caracteres'),
  
  body('game')
    .trim()
    .notEmpty()
    .withMessage('El juego es requerido'),
  
  body('serviceType')
    .isIn([
      // Competitivo
      'placement', 'wins', 'arena', 'duo', 'pvp_boost', 'battle_cup',
      
      // Coaching
      'coaching',
      
      // Leveling
      'leveling', 'powerleveling', 'variable_leveling', 'achievements',
      
      // Farming
      'currency_farming', 'gold_farming', 'item_farming', 'bounty_services', 'monolith_farming',
      
      // Contenido PvE
      'boss_killing', 'uber_services', 'greater_rift', 'season_journey', 
      'mythic_plus', 'raiding', 'dungeon_clearing', 'challenge_completion', 
      'legendary_crafting', 'build_services',
      
      // Otros
      'custom'
    ])
    .withMessage('Tipo de servicio no válido'),
  
  body('estimatedTime')
    .trim()
    .notEmpty()
    .withMessage('El tiempo estimado es requerido'),
  
  // ✅ VALIDACIÓN CORREGIDA PARA VARIABLE_LEVELING
  body().custom((value, { req }) => {
    const serviceType = req.body.serviceType;
    
    // Si es variable_leveling, NO requiere precio fijo
    if (serviceType === 'variable_leveling') {
      // Para variable_leveling, el precio se calculará dinámicamente
      // No necesitamos validar precio aquí
      return true;
    }
    
    // Para otros servicios, validar precio normalmente
    const hasPrice = req.body.price !== undefined && req.body.price !== null && req.body.price !== '';
    const hasBasePrice = req.body.basePrice !== undefined && req.body.basePrice !== null && req.body.basePrice !== '';
    
    // Verificar que al menos uno de los campos esté presente
    if (!hasPrice && !hasBasePrice) {
      throw new Error('El precio es requerido (enviar como "price" o "basePrice")');
    }
    
    // Obtener el valor del precio (priorizar basePrice si ambos existen)
    const priceValue = hasBasePrice ? req.body.basePrice : req.body.price;
    
    // Convertir a número
    const numericPrice = Number(priceValue);
    
    // Validar que sea un número válido
    if (isNaN(numericPrice)) {
      throw new Error('El precio debe ser un número válido');
    }
    
    // Validar que sea positivo
    if (numericPrice <= 0) {
      throw new Error('El precio debe ser un número positivo mayor que 0');
    }
    
    // Validar que no sea demasiado grande
    if (numericPrice > 10000) {
      throw new Error('El precio no puede ser mayor a 10,000');
    }
    
    // ✅ NORMALIZAR: Guardar el precio como 'basePrice' para el modelo
    req.body.basePrice = numericPrice;
    if (hasPrice && !hasBasePrice) {
      // Si solo enviaron 'price', lo usamos como basePrice y eliminamos el campo original
      delete req.body.price;
    } else if (hasPrice && hasBasePrice) {
      // Si enviaron ambos, nos quedamos con basePrice y eliminamos price para limpieza
      delete req.body.price;
    }
    
    return true;
  }),
  
  body('available')
    .optional()
    .isBoolean()
    .withMessage('El campo available debe ser booleano'),
  
  body('category')
    .optional()
    .isIn(['competitive', 'coaching', 'leveling', 'farming', 'content', 'other'])
    .withMessage('Categoría no válida'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Las características deben ser un array')
]);

// ======================
// VALIDACIONES DE ÓRDENES
// ======================

export const validateOrderCreate = validate([
  body('service')
    .isMongoId()
    .withMessage('ID de servicio inválido'),
  
  body('gameDetails.currentRank')
    .optional()
    .trim(),
  
  body('gameDetails.desiredRank')
    .optional()
    .trim(),
  
  body('gameDetails.currentLevel')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El nivel actual debe ser un número positivo'),
  
  body('gameDetails.desiredLevel')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El nivel deseado debe ser un número positivo')
    .custom((value, { req }) => {
      if (req.body.gameDetails?.currentLevel && value <= req.body.gameDetails.currentLevel) {
        throw new Error('El nivel deseado debe ser mayor que el nivel actual');
      }
      return true;
    }),
  
  body('gameDetails.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número positivo'),
  
  body('gameDetails.server')
    .optional()
    .trim()
    .isIn(['NA', 'EU', 'AS', 'OC', 'SA'])
    .withMessage('Servidor no válido'),
  
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('El precio total debe ser un número positivo'),
  
  body('priority')
    .optional()
    .isIn(['normal', 'high', 'express'])
    .withMessage('Prioridad no válida')
]);

export const validateOrderStatus = validate([
  body('status')
    .isIn(['pending', 'paid', 'in_progress', 'completed', 'cancelled', 'refunded'])
    .withMessage('Estado de orden no válido')
]);

// ======================
// VALIDACIONES DE PAGOS
// ======================

export const validatePaymentProcess = validate([
  body('orderId')
    .isMongoId()
    .withMessage('ID de orden inválido'),
  
  body('paymentMethod')
    .isIn(['paypal', 'binance', 'credit_card', 'crypto'])
    .withMessage('Método de pago no válido'),
  
  body('paymentDetails')
    .optional()
    .isObject()
    .withMessage('Los detalles de pago deben ser un objeto')
]);

// ======================
// VALIDACIONES DE ADMIN
// ======================

export const validateAdminQuery = validate([
  query('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'all', 'pending', 'paid', 'completed', 'cancelled'])
    .withMessage('Estado no válido'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('El orden debe ser asc o desc'),
  
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio no válida'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin no válida')
]);

// ======================
// VALIDACIONES DE PERFIL
// ======================

export const validateProfileUpdate = validate([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/)
    .withMessage('Número de teléfono no válido'),
  
  body('discord')
    .optional()
    .trim()
    .matches(/^.{3,32}#[0-9]{4}$/)
    .withMessage('Usuario de Discord no válido (formato: Nombre#1234)')
]);

// ======================
// VALIDACIONES AUXILIARES
// ======================

export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Formato de ID inválido'
    });
  }
  
  next();
};

export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'La página debe ser mayor o igual a 1'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'El límite debe estar entre 1 y 100'
    });
  }
  
  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

// ======================
// EXPORTACIÓN SIMPLIFICADA
// ======================

export default {
  sanitizeInput,
  validate,
  validateRegistration,
  validateLogin,
  validateTicketCreate,
  validateTicketReply,
  validateTicketStatus,
  validateServiceCreate,
  validateOrderCreate,
  validateOrderStatus,
  validatePaymentProcess,
  validateAdminQuery,
  validateProfileUpdate,
  validateObjectId,
  validatePagination
};