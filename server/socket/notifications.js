// backend/socket/notifications.js - VERSIÓN CORREGIDA SIN NAMESPACE
export const setupNotificationSocket = (socket) => {
  console.log(`🔔 Configurando notificaciones para: ${socket.username}`);

  // Unir al usuario a su canal personal de notificaciones
  socket.join(`notifications_${socket.userId}`);
  console.log(`🔔 Usuario ${socket.username} unido a su canal de notificaciones`);

  // ✅ ESCUCHAR EVENTOS DE NOTIFICACIONES
  socket.on('mark_as_read', async (data) => {
    try {
      const { notificationId } = data;
      
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.findByIdAndUpdate(
        notificationId,
        { 
          read: true,
          readAt: new Date()
        }
      );

      // Emitir confirmación
      socket.emit('notification_marked_read', { notificationId });

    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      socket.emit('notification_error', { message: 'Error actualizando notificación' });
    }
  });

  socket.on('mark_all_read', async () => {
    try {
      const Notification = (await import('../models/Notification.js')).default;
      await Notification.updateMany(
        { 
          user: socket.userId,
          read: false 
        },
        { 
          read: true,
          readAt: new Date()
        }
      );

      // Emitir confirmación
      socket.emit('all_notifications_marked_read');

    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      socket.emit('notification_error', { message: 'Error actualizando notificaciones' });
    }
  });

  socket.on('get_unread_count', async () => {
    try {
      const Notification = (await import('../models/Notification.js')).default;
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        read: false
      });

      socket.emit('unread_count', { count: unreadCount });

    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      socket.emit('notification_error', { message: 'Error obteniendo notificaciones' });
    }
  });

  socket.on('get_recent_notifications', async () => {
    try {
      const Notification = (await import('../models/Notification.js')).default;
      const notifications = await Notification.find({
        user: socket.userId
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('data.order', 'orderNumber')
      .populate('sender', 'username avatar');

      socket.emit('recent_notifications', { notifications });

    } catch (error) {
      console.error('Error obteniendo notificaciones recientes:', error);
      socket.emit('notification_error', { message: 'Error obteniendo notificaciones' });
    }
  });

  // ✅ MANEJAR SUSCRIPCIONES A TIPOS ESPECÍFICOS DE NOTIFICACIONES
  socket.on('subscribe_to_order_updates', (orderId) => {
    socket.join(`order_updates_${orderId}`);
    console.log(`🔔 Usuario ${socket.username} suscrito a updates de orden ${orderId}`);
  });

  socket.on('subscribe_to_support_updates', (ticketId) => {
    socket.join(`support_updates_${ticketId}`);
    console.log(`🔔 Usuario ${socket.username} suscrito a updates de ticket ${ticketId}`);
  });

  socket.on('subscribe_to_system_announcements', () => {
    socket.join('system_announcements');
    console.log(`🔔 Usuario ${socket.username} suscrito a anuncios del sistema`);
  });

  // Manejar desconexión específica de notificaciones
  socket.on('disconnect', (reason) => {
    console.log(`🔔 Usuario desconectado de notificaciones: ${socket.username} - Razón: ${reason}`);
  });
};

// ✅ FUNCIONES GLOBALES PARA ENVIAR NOTIFICACIONES DESDE CUALQUIER PARTE DEL SISTEMA
export const notificationHelpers = (io) => ({
  // Notificar a un usuario específico
  notifyUser: (userId, notificationData) => {
    io.to(`notifications_${userId}`).emit('new_notification', {
      ...notificationData,
      timestamp: new Date(),
      type: 'personal'
    });
  },

  // Notificar a múltiples usuarios
  notifyUsers: (userIds, notificationData) => {
    userIds.forEach(userId => {
      io.to(`notifications_${userId}`).emit('new_notification', {
        ...notificationData,
        timestamp: new Date(),
        type: 'personal'
      });
    });
  },

  // Notificar a todos los usuarios de un rol específico
  notifyRole: (role, notificationData) => {
    io.to(`role_${role}`).emit('new_notification', {
      ...notificationData,
      timestamp: new Date(),
      type: 'role_based'
    });
  },

  // Notificar actualización de orden
  notifyOrderUpdate: (orderId, notificationData) => {
    io.to(`order_updates_${orderId}`).emit('order_notification', {
      ...notificationData,
      timestamp: new Date(),
      type: 'order_update'
    });
  },

  // Notificar actualización de ticket de soporte
  notifySupportUpdate: (ticketId, notificationData) => {
    io.to(`support_updates_${ticketId}`).emit('support_notification', {
      ...notificationData,
      timestamp: new Date(),
      type: 'support_update'
    });
  },

  // Anuncio del sistema a todos los usuarios
  systemAnnouncement: (notificationData) => {
    io.to('system_announcements').emit('system_notification', {
      ...notificationData,
      timestamp: new Date(),
      type: 'system_announcement'
    });
  },

  // Notificar a todos los admins
  notifyAdmins: (notificationData) => {
    io.to('admin_room').emit('admin_notification', {
      ...notificationData,
      timestamp: new Date(),
      type: 'admin_alert'
    });
  }
});