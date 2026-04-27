// backend/socket.js - VERSIÓN FINAL CORREGIDA PARA RENDER
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { allowedOrigins } from '../middleware/cors.js'; 

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.query.token ||
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) return next(new Error('Authentication error: No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id).select('username role isActive email');
    
    if (!user || !user.isActive) {
      return next(new Error('Authentication error: User not found or inactive'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    socket.userRole = user.role;
    socket.userEmail = user.email;
    socket.authenticated = true;
    
    next();
  } catch (error) {
    next(new Error(`Authentication error: ${error.message}`));
  }
};

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
      allowedHeaders: ["Authorization", "Content-Type"]
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true,
    path: '/socket.io/'
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`🔗 Nueva conexión socket: ${socket.username} (${socket.id})`);

    socket.join(`user:${socket.userId}`);
    socket.join('global');
    
    if (socket.userRole === 'admin') {
      socket.join('admin');
      socket.join('admin_room');
    }

    socket.emit('connected', {
      userId: socket.userId,
      socketId: socket.id
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${socket.username} - ${reason}`);
    });
  });

  // ✅ CORRECCIÓN DE RUTA DINÁMICA: 
  // Usamos un try/catch más robusto para que el servidor no explote si no encuentra el archivo
  const loadModules = async () => {
    try {
      // Si adminSync.js está en ./socket/adminSync.js relativo a este archivo:
      const adminModule = await import('./socket/adminSync.js');
      if (adminModule.setupAdminSyncSocket) {
        adminModule.setupAdminSyncSocket(io);
        console.log('✅ Módulo adminSync cargado correctamente');
      }
    } catch (err) {
      console.log('ℹ️ Nota: Módulo adminSync no cargado (verificar ruta si es necesario)');
    }
  };

  loadModules();

  console.log('✅ Configuración Socket.IO completada exitosamente');
  return io;
};