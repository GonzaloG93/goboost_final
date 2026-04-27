const Joi = require('joi');

// Esquemas de validación con Joi
const userValidation = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'El usuario solo puede contener letras y números',
        'string.min': 'El usuario debe tener al menos 3 caracteres',
        'string.max': 'El usuario no puede tener más de 30 caracteres',
        'any.required': 'El usuario es requerido'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Debe ser un email válido',
        'any.required': 'El email es requerido'
      }),
    
    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 6 caracteres',
        'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
        'any.required': 'La contraseña es requerida'
      }),
    
    role: Joi.string()
      .valid('customer', 'booster', 'admin')
      .default('customer')
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    
    password: Joi.string()
      .required()
  }),

  updateProfile: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30),
    
    games: Joi.array().items(
      Joi.object({
        game: Joi.string().required(),
        username: Joi.string().required(),
        rank: Joi.string().required()
      })
    )
  })
};

const orderValidation = {
  create: Joi.object({
    service: Joi.string()
      .hex()
      .length(24)
      .required()
      .messages({
        'string.hex': 'ID de servicio inválido',
        'string.length': 'ID de servicio debe tener 24 caracteres',
        'any.required': 'El servicio es requerido'
      }),
    
    gameDetails: Joi.object({
      currentRank: Joi.string().required(),
      desiredRank: Joi.string().required(),
      username: Joi.string().required(),
      password: Joi.string().required(),
      server: Joi.string().required(),
      notes: Joi.string().allow('').optional()
    }).required(),
    
    priority: Joi.string()
      .valid('normal', 'high', 'urgent')
      .default('normal')
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'paid', 'in_progress', 'completed', 'cancelled')
      .required(),
    
    completionProof: Joi.array().items(Joi.string().uri())
  }),

  rate: Joi.object({
    rating: Joi.number()
      .min(1)
      .max(5)
      .required(),
    
    review: Joi.string()
      .max(500)
      .allow('')
      .optional()
  })
};

const paymentValidation = {
  process: Joi.object({
    orderId: Joi.string()
      .hex()
      .length(24)
      .required(),
    
    paymentMethod: Joi.string()
      .valid('credit_card', 'paypal', 'wallet', 'crypto')
      .required()
  }),

  walletDeposit: Joi.object({
    amount: Joi.number()
      .min(1)
      .max(10000)
      .required()
  })
};

const serviceValidation = {
  create: Joi.object({
    game: Joi.string()
      .valid('League of Legends', 'Valorant', 'Overwatch', 'CS:GO', 'Dota 2', 'Other')
      .required(),
    
    serviceType: Joi.string()
      .valid('rank_boost', 'placement_matches', 'coaching', 'win_boost', 'division_boost')
      .required(),
    
    name: Joi.string()
      .min(3)
      .max(100)
      .required(),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .required(),
    
    basePrice: Joi.number()
      .min(1)
      .max(10000)
      .required(),
    
    estimatedTime: Joi.string().required(),
    
    features: Joi.array().items(Joi.string()),
    
    requirements: Joi.array().items(Joi.string())
  })
};

module.exports = {
  userValidation,
  orderValidation,
  paymentValidation,
  serviceValidation
};