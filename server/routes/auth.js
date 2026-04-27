// backend/routes/auth.js - VERSIÓN COMPLETA CON reCAPTCHA
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Middleware para verificar reCAPTCHA
const verifyRecaptcha = async (req, res, next) => {
  const token = req.body.captchaToken;
  
  if (!token) {
    console.log('❌ Token de reCAPTCHA no proporcionado');
    return res.status(400).json({
      success: false,
      message: 'Por favor completa la verificación de seguridad (CAPTCHA)'
    });
  }

  try {
    console.log('🔐 Verificando reCAPTCHA token...');
    
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    const { success, 'error-codes': errorCodes } = response.data;

    if (success) {
      console.log('✅ reCAPTCHA verificado exitosamente');
      next();
    } else {
      console.error('❌ reCAPTCHA verification failed:', errorCodes);
      
      let message = 'Verificación de seguridad fallida';
      if (errorCodes && errorCodes.includes('timeout-or-duplicate')) {
        message = 'La verificación de seguridad ha expirado. Por favor intenta de nuevo.';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }
  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar la seguridad. Intenta nuevamente.'
    });
  }
};

// Helper: Generar token sin expiración
const generateToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      timestamp: Date.now()
    }, 
    JWT_SECRET
  );
};

// Helper: Formatear respuesta de usuario
const getUserResponse = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  ...(user.games && { games: user.games }),
  ...(user.balance !== undefined && { balance: user.balance }),
  ...(user.rating !== undefined && { rating: user.rating }),
  ...(user.completedOrders !== undefined && { completedOrders: user.completedOrders }),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    console.log('🔐 Intentando login para:', req.body.email);
    
    const { email, password } = req.body;
    
    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email y contraseña son requeridos' 
      });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    // Buscar usuario incluyendo password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    console.log('✅ Usuario encontrado:', user.email);
    
    // Verificar contraseña
    const isPasswordValid = await user.correctPassword(password);
    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      console.log('❌ Usuario inactivo:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador.' 
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generar token
    const token = generateToken(user._id);
    
    console.log('✅ Login exitoso para:', user.email);

    res.json({
      success: true,
      token,
      user: getUserResponse(user)
    });
    
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ==================== REGISTER ====================
const register = async (req, res) => {
  try {
    console.log('👤 Intentando registro:', req.body.email);
    
    const { username, email, password, name } = req.body;

    // Validaciones
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos son requeridos' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar username
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres'
      });
    }

    // Verificar si ya existe el usuario
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ 
          success: false,
          message: 'Ya existe una cuenta con este email' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: 'El nombre de usuario ya está en uso' 
      });
    }

    // Crear usuario
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name: name || username,
      role: 'customer',
      isActive: true
    });

    await user.save();
    
    // Generar token
    const token = generateToken(user._id);
    
    console.log('✅ Usuario registrado exitosamente:', user.email);

    res.status(201).json({
      success: true,
      token,
      user: getUserResponse(user)
    });
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Manejar errores de validación de MongoDB
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: messages.join(', ') 
      });
    }
    
    // Manejar errores de duplicados
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        success: false,
        message: `El ${field === 'email' ? 'email' : 'nombre de usuario'} ya existe` 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

// ==================== OBTENER USUARIO ACTUAL ====================
const getCurrentUser = async (req, res) => {
  try {
    console.log('🔍 Obteniendo usuario actual:', req.user._id);
    
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: getUserResponse(user)
    });
  } catch (error) {
    console.error('❌ Error en getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener datos del usuario'
    });
  }
};

// ==================== RUTAS ====================
// Login y Register con verificación reCAPTCHA
router.post('/login', verifyRecaptcha, login);
router.post('/register', verifyRecaptcha, register);

// Rutas protegidas
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, name } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: getUserResponse(user)
    });
  } catch (error) {
    console.error('❌ Error en updateProfile:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Verificar token
router.post('/verify', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: getUserResponse(req.user)
  });
});

export default router;