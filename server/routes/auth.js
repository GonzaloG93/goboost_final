// backend/routes/auth.js - VERSIÓN COMPLETA CON TOKENS QUE NO CADUCAN
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ USAR EL MISMO SECRET QUE EN authMiddleware.js
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// ✅ HELPER CORREGIDO: GENERAR TOKEN SIN EXPIRACIÓN
const generateToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      timestamp: Date.now() // Agregar timestamp para hacer cada token único
    }, 
    JWT_SECRET
    // ❌ SIN expiresIn - ESTO HACE QUE EL TOKEN NO CADUQUE
  );
};

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

// ✅ CONTROLADORES CORREGIDOS
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
    
    // ✅ BUSCAR USUARIO INCLUYENDO PASSWORD
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas' 
      });
    }

    console.log('✅ Usuario encontrado:', user.email);
    console.log('🔐 Verificando contraseña...');

    // ✅ USAR EL MÉTODO CORREGIDO DEL MODELO USER
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

    // ✅ GENERAR TOKEN SIN EXPIRACIÓN
    const token = generateToken(user._id);
    
    // ✅ DEBUG: Verificar contenido del token
    console.log('✅ Login exitoso, token generado para:', user.email);
    console.log('🔑 Token generado (primeros 50 chars):', token.substring(0, 50) + '...');
    
    // Decodificar para verificar que no tiene expiración
    try {
      const decoded = jwt.decode(token);
      console.log('📋 Token decodificado:', {
        id: decoded.id,
        timestamp: new Date(decoded.timestamp),
        exp: decoded.exp ? 'TIENE EXPIRACIÓN' : 'NO TIENE EXPIRACIÓN',
        iat: decoded.iat ? 'TIENE IAT' : 'NO TIENE IAT'
      });
    } catch (e) {
      console.log('⚠️ No se pudo decodificar token:', e.message);
    }

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

const register = async (req, res) => {
  try {
    console.log('👤 Intentando registro:', req.body.email);
    
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos son requeridos' 
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Ya existe un usuario con este email o nombre de usuario' 
      });
    }

    // ✅ CREAR USUARIO - DEJAR QUE EL PRE-SAVE HOOK HAGA EL HASHING
    const user = new User({
      username,
      email,
      password, // ✅ Pasar en texto plano
      role: role || 'customer',
      isActive: true
    });

    await user.save();
    
    // ✅ GENERAR TOKEN SIN EXPIRACIÓN
    const token = generateToken(user._id);
    
    console.log('✅ Usuario registrado exitosamente:', user.email);
    console.log('🔑 Token generado sin expiración');

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
      return res.status(400).json({ 
        success: false,
        message: 'El email o nombre de usuario ya existe' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    console.log('🔍 Buscando usuario actual:', req.user._id);
    
    const user = req.user;
    
    if (!user) {
      console.log('❌ Usuario no encontrado en req.user');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario actual encontrado:', user.email);
    
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

const updateProfile = async (req, res) => {
  try {
    const { username, games } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, games },
      { new: true, runValidators: true }
    ).select('-password');

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
};

// ✅ ENDPOINT PARA REGENERAR TOKEN SIN EXPIRACIÓN
const regenerateToken = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña requeridos'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const isPasswordValid = await user.correctPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // ✅ GENERAR NUEVO TOKEN SIN EXPIRACIÓN
    const token = generateToken(user._id);
    
    console.log('🔄 Token regenerado sin expiración para:', user.email);
    
    res.json({
      success: true,
      token,
      user: getUserResponse(user),
      message: 'Token regenerado exitosamente (sin expiración)'
    });
    
  } catch (error) {
    console.error('❌ Error en regenerateToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ✅ RUTAS PRINCIPALES
router.post('/login', login);
router.post('/register', register);
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);
router.post('/verify', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: getUserResponse(req.user)
  });
});

// ✅ RUTA PARA REGENERAR TOKEN (útil si ya tienes tokens viejos con expiración)
router.post('/regenerate-token', regenerateToken);

// Mantener rutas de debug si las necesitas
router.post('/debug-check', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Debug check para:', email);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.json({ 
        userExists: false,
        message: 'Usuario no encontrado' 
      });
    }
    
    // Probar verificación de contraseña
    const passwordValid = await user.correctPassword(password);
    
    res.json({
      userExists: true,
      userEmail: user.email,
      userActive: user.isActive,
      passwordValid: passwordValid,
      userRole: user.role,
      userId: user._id
    });
    
  } catch (error) {
    console.error('❌ Error en debug-check:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/debug-users', async (req, res) => {
  try {
    const users = await User.find({}).select('email username isActive role createdAt');
    
    console.log('📊 Usuarios en la base de datos:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.username}): ${user.role}, active=${user.isActive}`);
    });

    res.json({
      success: true,
      totalUsers: users.length,
      users: users.map(user => ({
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        id: user._id
      }))
    });
  } catch (error) {
    console.error('Error en debug-users:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;