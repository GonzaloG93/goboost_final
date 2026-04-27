// backend/socket/ticketSocket.js - CONFIGURACIÓN COMPLETA SOCKET.IO PARA TICKETS
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

export const setupTicketSocket = (io) => {
  const ticketNamespace = io.of('/tickets');
  
  // Middleware de autenticación para tickets
  ticketNamespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('❌ Socket ticket connection without token');
        return next(new Error('Authentication required'));
      }
      
      // Verificar token JWT (simplificado)
      const decoded = { id: socket.handshake.auth.userId };
      socket.userId = decoded.id;
      socket.userRole = socket.handshake.auth.role || 'customer';
      socket.username = socket.handshake.auth.username || 'User';
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  ticketNamespace.on('connection', (socket) => {
    console.log(`🎫 Usuario conectado a tickets: ${socket.username} (${socket.userRole})`);
    
    // Unirse a sala de tickets del usuario
    socket.on('join_user_tickets', () => {
      if (socket.userRole !== 'admin') {
        const userRoom = `user_tickets_${socket.userId}`;
        socket.join(userRoom);
        console.log(`👤 Usuario ${socket.username} unido a su sala de tickets: ${userRoom}`);
        
        socket.emit('tickets_subscribed', {
          room: userRoom,
          timestamp: new Date(),
          message: 'Suscripción a tickets activada'
        });
      }
    });

    // Admin se une a sala de tickets
    socket.on('join_admin_tickets', () => {
      if (socket.userRole === 'admin') {
        socket.join('admin_tickets');
        socket.join('dashboard_updates');
        console.log(`👑 Admin ${socket.username} unido a admin_tickets`);
        
        socket.emit('admin_tickets_subscribed', {
          timestamp: new Date(),
          message: 'Sala de tickets admin activada'
        });
      }
    });

    // Unirse a una sala específica de ticket
    socket.on('join_ticket', (ticketId) => {
      const roomName = `ticket_${ticketId}`;
      socket.join(roomName);
      console.log(`👤 ${socket.username} unido a ticket room: ${roomName}`);
    });

    // Dejar una sala de ticket específica
    socket.on('leave_ticket', (ticketId) => {
      const roomName = `ticket_${ticketId}`;
      socket.leave(roomName);
    });

    // Cliente crea un nuevo ticket
    socket.on('customer_ticket_created', async (data) => {
      try {
        console.log(`🎫 Nuevo ticket creado por ${socket.username}:`, data.ticket?.ticketNumber);
        
        // Notificar a todos los admins
        socket.to('admin_tickets').emit('new_ticket_created', {
          ticket: data.ticket,
          customerId: data.userId,
          customerName: data.customerName,
          timestamp: new Date(),
          type: 'new_ticket'
        });

        // Notificar al usuario
        socket.to(`user_tickets_${data.userId}`).emit('ticket_created_confirmed', {
          ticket: data.ticket,
          timestamp: new Date(),
          message: 'Ticket creado exitosamente'
        });

        // Emitir a sala global
        ticketNamespace.emit('ticket_created', {
          ticket: data.ticket,
          customerId: data.userId,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ Error en customer_ticket_created:', error);
      }
    });

    // Cliente envía una respuesta
    socket.on('customer_ticket_reply', async (data) => {
      try {
        const { ticketId, message, customerId } = data;
        console.log(`📤 Cliente ${socket.username} responde al ticket ${ticketId}`);
        
        if (!ticketId || !message || !message.trim()) {
          socket.emit('ticket_error', { 
            message: 'Datos inválidos: ticketId y message requeridos' 
          });
          return;
        }

        // Notificar al admin
        socket.to('admin_tickets').emit('customer_replied', {
          ticketId,
          message: message.trim(),
          customerId: customerId || socket.userId,
          customerName: socket.username,
          timestamp: new Date(),
          type: 'customer_reply'
        });

        // Notificar a la sala específica del ticket
        socket.to(`ticket_${ticketId}`).emit('ticket_message_added', {
          ticketId,
          message: {
            sender: socket.userId,
            senderName: socket.username,
            senderRole: 'customer',
            content: message.trim(),
            timestamp: new Date()
          },
          type: 'new_message',
          timestamp: new Date()
        });

        // Confirmar al cliente
        socket.emit('ticket_reply_sent', {
          success: true,
          ticketId,
          message: 'Respuesta enviada al administrador',
          timestamp: new Date()
        });

        console.log(`✅ Respuesta de cliente ${socket.username} procesada para ticket ${ticketId}`);

      } catch (error) {
        console.error('❌ Error en customer_ticket_reply:', error);
        socket.emit('ticket_error', { 
          message: 'Error al procesar respuesta' 
        });
      }
    });

    // Admin envía una respuesta
    socket.on('admin_ticket_reply', async (data) => {
      try {
        const { ticketId, message, customerId } = data;
        console.log(`📤 Admin ${socket.username} responde al ticket ${ticketId}`);
        
        if (!ticketId || !message || !message.trim() || !customerId) {
          socket.emit('ticket_error', { 
            message: 'Datos inválidos' 
          });
          return;
        }

        // Notificar al cliente específico
        socket.to(`user_tickets_${customerId}`).emit('admin_replied', {
          ticketId,
          message: {
            sender: socket.userId,
            senderName: socket.username,
            senderRole: 'admin',
            content: message.trim(),
            timestamp: new Date()
          },
          type: 'admin_reply',
          timestamp: new Date(),
          adminName: socket.username
        });

        // Notificar a la sala específica del ticket
        socket.to(`ticket_${ticketId}`).emit('ticket_message_added', {
          ticketId,
          message: {
            sender: socket.userId,
            senderName: socket.username,
            senderRole: 'admin',
            content: message.trim(),
            timestamp: new Date()
          },
          type: 'new_message',
          timestamp: new Date()
        });

        // Confirmar al admin
        socket.emit('admin_reply_sent', {
          success: true,
          ticketId,
          customerId,
          message: 'Respuesta enviada al cliente',
          timestamp: new Date()
        });

        console.log(`✅ Respuesta de admin ${socket.username} procesada para ticket ${ticketId}`);

      } catch (error) {
        console.error('❌ Error en admin_ticket_reply:', error);
        socket.emit('ticket_error', { 
          message: 'Error al procesar respuesta' 
        });
      }
    });

    // Admin actualiza estado de ticket
    socket.on('admin_ticket_status_update', async (data) => {
      try {
        const { ticketId, status, customerId } = data;
        console.log(`🔄 Admin ${socket.username} actualiza estado del ticket ${ticketId} a ${status}`);
        
        if (!ticketId || !status || !customerId) {
          socket.emit('ticket_error', { 
            message: 'Datos inválidos' 
          });
          return;
        }

        // Notificar al cliente
        socket.to(`user_tickets_${customerId}`).emit('ticket_status_updated', {
          ticketId,
          status,
          updatedBy: socket.username,
          timestamp: new Date(),
          type: 'status_update'
        });

        // Notificar a todos los admins
        socket.to('admin_tickets').emit('ticket_admin_updated', {
          ticketId,
          status,
          updatedBy: socket.username,
          updatedById: socket.userId,
          timestamp: new Date()
        });

        // Confirmar al admin
        socket.emit('ticket_status_update_confirmed', {
          success: true,
          ticketId,
          status,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('❌ Error en admin_ticket_status_update:', error);
        socket.emit('ticket_error', { 
          message: 'Error al actualizar estado' 
        });
      }
    });

    // Cliente está escribiendo
    socket.on('customer_typing', (data) => {
      const { ticketId, isTyping } = data;
      
      if (ticketId) {
        socket.to(`ticket_${ticketId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.username,
          userRole: socket.userRole,
          isTyping,
          ticketId,
          timestamp: new Date()
        });
      }
    });

    // Admin está escribiendo
    socket.on('admin_typing', (data) => {
      const { ticketId, isTyping, customerId } = data;
      
      if (ticketId && customerId) {
        socket.to(`user_tickets_${customerId}`).emit('admin_typing', {
          adminId: socket.userId,
          adminName: socket.username,
          isTyping,
          ticketId,
          timestamp: new Date()
        });
      }
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${socket.username} desconectado de ticketSocket: ${reason}`);
      
      // Limpiar salas específicas
      const rooms = Object.keys(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('ticket_') || room.startsWith('user_tickets_')) {
          socket.leave(room);
        }
      });
    });
  });

  console.log('✅ Socket.IO ticket namespace configurado');
};