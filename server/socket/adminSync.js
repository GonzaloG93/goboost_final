// backend/socket/adminSync.js - VERSIÓN OPTIMIZADA PARA DASHBOARD
export const setupAdminSyncSocket = (socket) => {
  console.log(`🔄 Configurando adminSync para admin: ${socket.username}`);

  // Verificar que sea admin (ya se verifica en server.js, pero por seguridad)
  if (socket.userRole !== 'admin') {
    console.log(`❌ Intento de acceso no autorizado a adminSync: ${socket.username}`);
    socket.emit('sync_error', { message: 'Acceso denegado. Solo administradores.' });
    return;
  }

  console.log(`✅ Configurando handlers admin para: ${socket.username}`);

  // ========== SUSCRIPCIONES ESPECÍFICAS ==========
  
  socket.on('subscribe_dashboard_updates', () => {
    socket.join('dashboard_updates');
    console.log(`📊 Admin ${socket.username} suscrito a dashboard_updates`);
    
    socket.emit('subscription_confirmed', {
      type: 'dashboard',
      message: 'Suscripción a dashboard activa',
      timestamp: new Date(),
      room: 'dashboard_updates'
    });
  });

  socket.on('subscribe_orders_updates', () => {
    socket.join('orders_updates');
    console.log(`📦 Admin ${socket.username} suscrito a orders_updates`);
    
    socket.emit('subscription_confirmed', {
      type: 'orders', 
      message: 'Suscripción a órdenes activa',
      timestamp: new Date(),
      room: 'orders_updates'
    });
  });

  socket.on('subscribe_services_updates', () => {
    socket.join('services_updates');
    console.log(`🎮 Admin ${socket.username} suscrito a services_updates`);
    
    socket.emit('subscription_confirmed', {
      type: 'services',
      message: 'Suscripción a servicios activa', 
      timestamp: new Date(),
      room: 'services_updates'
    });
  });

  socket.on('subscribe_tickets_updates', () => {
    socket.join('tickets_updates');
    console.log(`🎫 Admin ${socket.username} suscrito a tickets_updates`);
    
    socket.emit('subscription_confirmed', {
      type: 'tickets',
      message: 'Suscripción a tickets activa',
      timestamp: new Date(),
      room: 'tickets_updates'
    });
  });

  // ========== EVENTOS PARA EL DASHBOARD ==========
  
  // Solicitar actualización manual del dashboard
  socket.on('request_dashboard_refresh', (data) => {
    console.log(`🔄 Admin ${socket.username} solicitó actualización del dashboard`);
    
    // Emitir evento de actualización a todos los admins suscritos
    socket.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'manual_refresh',
      requestedBy: socket.username,
      timestamp: new Date(),
      message: 'Dashboard actualizado manualmente'
    });
    
    socket.emit('dashboard_refresh_complete', {
      success: true,
      message: 'Dashboard actualizado',
      timestamp: new Date()
    });
  });

  // ========== EVENTOS DE SISTEMA (EMITIDOS DESDE EL BACKEND) ==========
  
  // Orden actualizada (desde cualquier parte del sistema)
  socket.on('system_order_updated', (data) => {
    console.log(`📦 Sistema notifica orden actualizada: ${data.orderId}`);
    
    // Emitir a todos los admins
    socket.to('admin_room').emit('order_updated', {
      ...data,
      source: 'system',
      timestamp: new Date()
    });
    
    // Emitir a la sala de dashboard
    socket.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'order_update',
      orderId: data.orderId,
      newStatus: data.newStatus,
      timestamp: new Date(),
      message: `Orden ${data.orderId} actualizada a ${data.newStatus}`
    });
  });

  // Nueva orden creada (desde cualquier parte del sistema)
  socket.on('system_order_created', (data) => {
    console.log(`🆕 Sistema notifica nueva orden: ${data.orderId}`);
    
    // Emitir a todos los admins
    socket.to('admin_room').emit('order_created', {
      ...data,
      source: 'system',
      timestamp: new Date()
    });
    
    // Emitir a la sala de dashboard
    socket.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'new_order',
      orderId: data.orderId,
      timestamp: new Date(),
      message: `Nueva orden creada: ${data.orderNumber || data.orderId}`
    });
  });

  // Servicio actualizado (desde cualquier parte del sistema)
  socket.on('system_service_updated', (data) => {
    console.log(`🎮 Sistema notifica servicio actualizado: ${data.serviceId || data.name}`);
    
    // Emitir a todos los admins
    socket.to('admin_room').emit('service_modified', {
      ...data,
      source: 'system',
      timestamp: new Date()
    });
    
    // Emitir a la sala de servicios
    socket.to('services_updates').emit('service_updated', {
      ...data,
      timestamp: new Date()
    });
    
    // Actualizar dashboard
    socket.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'service_update',
      serviceId: data.serviceId,
      timestamp: new Date(),
      message: `Servicio actualizado: ${data.name}`
    });
  });

  // Usuario registrado/actualizado (desde cualquier parte del sistema)
  socket.on('system_user_updated', (data) => {
    console.log(`👤 Sistema notifica usuario actualizado: ${data.userId || data.username}`);
    
    // Emitir a todos los admins
    socket.to('admin_room').emit('user_modified', {
      ...data,
      source: 'system',
      timestamp: new Date()
    });
  });

  // ========== EVENTOS MANUALES (EMITIDOS DESDE FRONTEND ADMIN) ==========
  
  // Admin actualiza manualmente una orden
  socket.on('admin_update_order', (data) => {
    const { orderId, updates } = data;
    console.log(`👑 Admin ${socket.username} actualiza orden: ${orderId}`);
    
    // Emitir a todos los admins
    socket.to('admin_room').emit('order_updated_by_admin', {
      orderId,
      updates,
      adminId: socket.userId,
      adminUsername: socket.username,
      timestamp: new Date()
    });
    
    // Actualizar dashboard
    socket.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'admin_order_update',
      orderId,
      timestamp: new Date(),
      message: `Orden ${orderId} actualizada por admin`
    });
    
    // Confirmar al admin que lo envió
    socket.emit('admin_update_confirmed', {
      success: true,
      orderId,
      timestamp: new Date()
    });
  });

  // ========== MANEJO DE DESCONEXIÓN ==========
  
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Admin ${socket.username} desconectado de adminSync: ${reason}`);
  });

  // ========== ERROR HANDLING ==========
  
  socket.on('sync_error', (error) => {
    console.error(`❌ Error en adminSync para ${socket.username}:`, error);
  });
};

// ✅ FUNCIONES GLOBALES PARA EMITIR DESDE CUALQUIER PARTE DEL BACKEND
export const adminSyncHelpers = (io) => ({
  // Emitir actualización de orden desde cualquier parte del sistema
  emitOrderUpdate: (orderData) => {
    io.to('admin_room').emit('order_updated', {
      ...orderData,
      source: 'backend_system',
      timestamp: new Date()
    });
    
    io.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'order_update',
      orderId: orderData.orderId,
      newStatus: orderData.newStatus,
      timestamp: new Date(),
      source: 'backend_system',
      message: `Orden ${orderData.orderId} actualizada`
    });
    
    console.log(`📊 Orden ${orderData.orderId} sincronizada con admins`);
  },

  // Emitir nueva orden desde cualquier parte del sistema
  emitNewOrder: (orderData) => {
    io.to('admin_room').emit('order_created', {
      ...orderData,
      source: 'backend_system',
      timestamp: new Date()
    });
    
    io.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'new_order',
      orderId: orderData.orderId,
      timestamp: new Date(),
      source: 'backend_system',
      message: `Nueva orden: ${orderData.orderNumber || orderData.orderId}`
    });
    
    console.log(`📊 Nueva orden ${orderData.orderId} sincronizada con admins`);
  },

  // Emitir actualización de servicio desde cualquier parte del sistema
  emitServiceUpdate: (serviceData) => {
    io.to('admin_room').emit('service_modified', {
      ...serviceData,
      source: 'backend_system',
      timestamp: new Date()
    });
    
    io.to('services_updates').emit('service_updated', {
      ...serviceData,
      timestamp: new Date()
    });
    
    io.to('dashboard_updates').emit('dashboard_refresh', {
      type: 'service_update',
      serviceId: serviceData.serviceId,
      timestamp: new Date(),
      source: 'backend_system',
      message: `Servicio actualizado: ${serviceData.name}`
    });
    
    console.log(`📊 Servicio ${serviceData.serviceId || serviceData.name} sincronizado con admins`);
  },

  // Emitir actualización de usuario desde cualquier parte del sistema
  emitUserUpdate: (userData) => {
    io.to('admin_room').emit('user_modified', {
      ...userData,
      source: 'backend_system',
      timestamp: new Date()
    });
    
    console.log(`📊 Usuario ${userData.userId || userData.username} sincronizado con admins`);
  },

  // Emitir actualización de dashboard desde cualquier parte del sistema
  emitDashboardRefresh: (data) => {
    io.to('dashboard_updates').emit('dashboard_refresh', {
      ...data,
      source: 'backend_system',
      timestamp: new Date()
    });
    
    console.log(`📊 Dashboard actualizado desde backend`);
  },

  // Emitir a todos los admins
  emitToAdmins: (event, data) => {
    io.to('admin_room').emit(event, {
      ...data,
      source: 'backend_system',
      timestamp: new Date()
    });
    
    console.log(`📊 Evento ${event} emitido a todos los admins`);
  }
});