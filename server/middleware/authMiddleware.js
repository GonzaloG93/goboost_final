// backend/middleware/authMiddleware.js - VERSIÓN COMPLETA CON TOKENS SIN EXPIRACIÓN
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ✅ USAR EL MISMO SECRET EN TODAS PARTES
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// ✅ MIDDLEWARE PRINCIPAL - ACEPTA TOKENS EXPIRADOS Y SIN EXPIRACIÓN
export const auth = async (req, res, next) => {
  try {
    console.log('🔐 Iniciando middleware de autenticación para:', req.method, req.url);
    
    let token;

    // Múltiples formas de obtener el token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('📨 Token obtenido de Authorization header');
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
      console.log('📨 Token obtenido de x-auth-token header');
    } else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log('📨 Token obtenido de cookies');
    } else if (req.handshake?.auth?.token) {
      token = req.handshake.auth.token;
      console.log('📨 Token obtenido de Socket.IO handshake');
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false,
        message: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    console.log('🔑 Token recibido (primeros 30 chars):', token.substring(0, 30) + '...');

    let decoded;
    let tokenExpired = false;
    
    try {
      // ✅ INTENTAR VERIFICAR TOKEN (SIN IGNORAR EXPIRACIÓN INICIALMENTE)
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verificado exitosamente (sin expiración o no expirado)');
    } catch (verifyError) {
      // ✅ SI EL TOKEN ESTÁ EXPIRADO, ACEPTARLO IGUAL
      if (verifyError.name === 'TokenExpiredError') {
        console.log('⚠️ Token expirado detectado, pero aceptándolo...');
        tokenExpired = true;
        
        // Decodificar token sin verificar expiración
        decoded = jwt.decode(token);
        
        if (!decoded || !decoded.id) {
          console.log('❌ Token expirado no se pudo decodificar');
          return res.status(401).json({ 
            success: false,
            message: 'Token inválido' 
          });
        }
        
        console.log('✅ Token expirado decodificado:', { 
          id: decoded.id,
          timestamp: decoded.timestamp ? new Date(decoded.timestamp) : 'Sin timestamp'
        });
      } else if (verifyError.name === 'JsonWebTokenError') {
        console.error('❌ JWT Error - Token inválido:', verifyError.message);
        return res.status(401).json({ 
          success: false,
          message: 'Token inválido' 
        });
      } else {
        console.error('❌ Error general en verify token:', verifyError);
        return res.status(401).json({ 
          success: false,
          message: 'Error de autenticación' 
        });
      }
    }
    
    // ✅ BUSCAR USUARIO EN LA BASE DE DATOS
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found for token, id:', decoded.id);
      return res.status(401).json({ 
        success: false,
        message: 'Token no válido - Usuario no existe' 
      });
    }

    if (user.isActive === false) {
      console.log('❌ User account inactive');
      return res.status(401).json({ 
        success: false,
        message: 'Cuenta desactivada' 
      });
    }

    console.log('✅ Usuario autenticado exitosamente:', { 
      id: user._id, 
      username: user.username, 
      email: user.email, 
      role: user.role,
      tokenStatus: tokenExpired ? 'EXPIRADO PERO ACEPTADO' : 'VÁLIDO'
    });
    
    // ✅ AGREGAR USUARIO AL REQUEST CON INFO DEL TOKEN
    req.user = {
      _id: user._id,
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      tokenExpired: tokenExpired, // Informar si el token estaba expirado
      tokenDecoded: decoded
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Error general en middleware auth:', error.message);
    
    // Error de base de datos
    if (error.name === 'CastError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido - ID de usuario no válido' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor en autenticación' 
    });
  }
};

// ✅ MIDDLEWARE ESPECÍFICO PARA SOCKET.IO
export const socketAuth = async (socket, next) => {
  try {
    console.log('🔐 Autenticando Socket.IO...');
    
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ Socket connection attempt without token');
      return next(new Error('Authentication error: No token provided'));
    }

    console.log('🔑 Socket token recibido:', token.substring(0, 20) + '...');

    let decoded;
    let tokenExpired = false;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Socket token verificado');
    } catch (verifyError) {
      if (verifyError.name === 'TokenExpiredError') {
        console.log('⚠️ Socket token expirado, pero aceptándolo...');
        tokenExpired = true;
        decoded = jwt.decode(token);
        
        if (!decoded || !decoded.id) {
          console.log('❌ Socket token expirado no se pudo decodificar');
          return next(new Error('Authentication error: Invalid token'));
        }
      } else {
        console.error('❌ Socket token inválido:', verifyError.message);
        return next(new Error('Authentication error: Invalid token'));
      }
    }

    const user = await User.findById(decoded.id).select('username email role isActive');
    
    if (!user || !user.isActive) {
      console.log('❌ Socket connection with invalid user');
      return next(new Error('Authentication error: Invalid user'));
    }

    // Adjuntar información del usuario al socket
    socket.userId = user._id.toString();
    socket.username = user.username;
    socket.userEmail = user.email;
    socket.userRole = user.role;
    socket.tokenExpired = tokenExpired;
    
    console.log(`✅ Socket authenticated: ${user.username} (${user.role}) - Token: ${tokenExpired ? 'EXPIRADO' : 'VÁLIDO'}`);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication error: ' + error.message));
  }
};

// Middleware de administrador
export const adminAuth = async (req, res, next) => {
  try {
    console.log('👑 Verificando permisos de administrador...');
    
    // Primero verificar autenticación normal
    await auth(req, res, () => {});
    
    // Luego verificar si es admin
    if (req.user && req.user.role === 'admin') {
      console.log('✅ Usuario es administrador:', req.user.username);
      next();
    } else {
      console.log('❌ Usuario no es administrador:', req.user?.username);
      res.status(403).json({ 
        success: false,
        message: 'Acceso denegado. Se requieren privilegios de administrador.' 
      });
    }
  } catch (error) {
    console.error('❌ Error en adminAuth:', error);
    res.status(401).json({ 
      success: false,
      message: 'Error de autenticación' 
    });
  }
};

// Middleware para roles específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(`🔒 Verificando roles permitidos: [${roles.join(', ')}]`);
    
    if (!req.user) {
      console.log('❌ Usuario no autenticado en authorize');
      return res.status(401).json({ 
        success: false,
        message: 'Acceso denegado. Usuario no autenticado.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`❌ Rol ${req.user.role} no tiene permisos. Roles permitidos: [${roles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Rol ${req.user.role} no tiene permisos para este recurso.`
      });
    }

    console.log(`✅ Rol autorizado: ${req.user.role}`);
    next();
  };
};

// Alias para roles específicos
export const boosterAuth = authorize('booster', 'admin');
export const customerAuth = authorize('customer', 'admin');
export const protect = auth;

// Middleware opcional (no requiere autenticación pero agrega user si existe)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
      token = req.headers['x-auth-token'];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      let decoded;
      
      try {
        // Intentar verificar
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (verifyError) {
        // Si está expirado, decodificar igual
        if (verifyError.name === 'TokenExpiredError') {
          decoded = jwt.decode(token);
        }
      }
      
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive !== false) {
          req.user = user;
          console.log('🔍 Usuario opcional encontrado:', user.email);
        }
      }
    }
    
    next();
  } catch (error) {
    // En optionalAuth, ignoramos los errores
    console.log('🔍 Autenticación opcional - Continuando sin usuario');
    next();
  }
};

// ✅ MIDDLEWARE PARA REGENERAR TOKEN (SI ES NECESARIO)
export const optionalAuthWithTokenRefresh = async (req, res, next) => {
  try {
    let token;
    let tokenExpired = false;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      let decoded;
      
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (verifyError) {
        if (verifyError.name === 'TokenExpiredError') {
          tokenExpired = true;
          decoded = jwt.decode(token);
        }
      }
      
      if (decoded && decoded.id) {
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive !== false) {
          req.user = user;
          req.tokenExpired = tokenExpired;
          
          // Si el token está expirado, agregar header para sugerir refresh
          if (tokenExpired) {
            res.setHeader('X-Token-Expired', 'true');
            res.setHeader('X-Token-Refresh-Suggested', 'true');
          }
          
          console.log('🔍 Usuario con token refresh:', {
            email: user.email,
            tokenExpired: tokenExpired
          });
        }
      }
    }
    
    next();
  } catch (error) {
    console.log('🔍 Optional auth with refresh - Continuando sin usuario');
    next();
  }
};

// ✅ FUNCIÓN PARA VERIFICAR TOKEN SIN EXPIRACIÓN
export const verifyTokenWithoutExpiration = (token) => {
  try {
    // Primero intentar verificar normalmente
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    // Si está expirado, decodificar sin verificar
    if (error.name === 'TokenExpiredError') {
      return jwt.decode(token);
    }
    throw error;
  }
};

// ✅ FUNCIÓN PARA GENERAR NUEVO TOKEN SIN EXPIRACIÓN
export const generatePermanentToken = (userId, username, role) => {
  return jwt.sign(
    { 
      id: userId,
      username: username,
      role: role,
      timestamp: Date.now(),
      permanent: true // Marcar como token permanente
    },
    JWT_SECRET
    // ✅ SIN expiresIn - NO CADUCA
  );
};

export { JWT_SECRET };