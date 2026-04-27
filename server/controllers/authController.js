// backend/controllers/authController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_here_change_in_production';

// ✅ FUNCIÓN PARA GENERAR TOKEN SIN EXPIRACIÓN
const generateToken = (userId, username, role) => {
  return jwt.sign(
    { 
      id: userId,
      username: username,
      role: role 
    },
    JWT_SECRET
    // ❌ SIN expiresIn - Token que nunca expira
  );
};

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.email);
    
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña'
      });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.correctPassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // ✅ Generar token SIN expiración
    const token = generateToken(user._id, user.username, user.role);
    
    console.log('✅ Login successful:', {
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance || 0,
        rating: user.rating || 0
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ REGISTER
export const register = async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body.email);
    
    const { username, email, password, name } = req.body;

    // Validaciones básicas
    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`
      });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      password,
      name,
      role: 'customer' // Rol por defecto
    });

    // ✅ Generar token SIN expiración
    const token = generateToken(user._id, user.username, user.role);
    
    console.log('✅ User registered:', {
      userId: user._id,
      email: user.email,
      username: user.username
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        balance: 0,
        rating: 0,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email o nombre de usuario ya existen'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ GET CURRENT USER (auth/me)
export const getCurrentUser = async (req, res) => {
  try {
    console.log('👤 Getting current user:', req.user?.id);
    
    // El usuario ya está autenticado por el middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name || '',
        balance: user.balance || 0,
        rating: user.rating || 0,
        games: user.games || [],
        completedOrders: user.completedOrders || 0,
        createdAt: user.createdAt,
        isActive: user.isActive !== false
      }
    });

  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario'
    });
  }
};

// ✅ LOGOUT (si es necesario)
export const logout = async (req, res) => {
  try {
    console.log('👋 Logout user:', req.user?.id);
    
    // En esta implementación simple, el logout es manejado por el frontend
    // eliminando el token del localStorage
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};

// ✅ UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { username, games, name } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        username,
        name,
        games: games || []
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'El nombre de usuario ya existe' 
      });
    }
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

export { JWT_SECRET };