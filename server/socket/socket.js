// backend/socket/socket.js - VERSIÓN CORREGIDA Y UNIFICADA
import { Server } from 'socket.io';
import { socketAuth } from '../middleware/authMiddleware.js'; 
import { allowedOrigins } from '../middleware/cors.js';        
import { setupLiveChatSocket } from './liveChat.js';                 
import { setupAdminSyncSocket } from './adminSync.js';

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

  // Middleware unificado de autenticación
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`🔗 Nueva conexión socket: ${socket.username} (${socket.id})`);

    socket.join(`user:${socket.userId}`);
    socket.join('global');
    
    if (socket.userRole === 'admin') {
      socket.join('admin');
      socket.join('admin_room');

      // Registrar los handlers de adminSync para el socket del administrador
      try {
        setupAdminSyncSocket(socket);
      } catch (err) {
        console.error('❌ Error al vincular adminSync en la conexión:', err.message);
      }
    }

    socket.emit('connected', {
      userId: socket.userId,
      socketId: socket.id
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${socket.username} - ${reason}`);
    });
  });

  // Cargar namespace /live-chat
  try {
    setupLiveChatSocket(io, socketAuth);
    console.log('✅ Módulo LiveChat cargado correctamente');
  } catch (err) {
    console.warn('⚠️ No se pudo cargar LiveChat:', err.message);
  }

  console.log('✅ Configuración Socket.IO y adminSync completada exitosamente');
  return io;
};