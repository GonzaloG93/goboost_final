// backend/socket/orderTracking.js
export const setupOrderTrackingSocket = (io, socketAuthMiddleware) => {
  const orderTrackingIo = io.of('/order-tracking');
  
  orderTrackingIo.use(socketAuthMiddleware);

  orderTrackingIo.on('connection', (socket) => {
    console.log(`📊 Usuario conectado a order tracking: ${socket.username}`);

    // Unir a usuario a sus órdenes activas
    socket.on('join_my_orders', async () => {
      try {
        const Order = (await import('../models/Order.js')).default;
        const userOrders = await Order.find({
          $or: [
            { user: socket.userId },
            { assignedBooster: socket.userId }
          ],
          status: { $in: ['pending', 'in_progress', 'assigned'] }
        });

        userOrders.forEach(order => {
          socket.join(`order_${order._id}`);
        });

        console.log(`📊 Usuario ${socket.username} unido a ${userOrders.length} órdenes activas`);
      } catch (error) {
        console.error('Error uniendo a órdenes:', error);
      }
    });

    // Actualización de progreso en tiempo real
    socket.on('order_progress_update', async (data) => {
      try {
        const { orderId, progress, status, message } = data;
        
        const Order = (await import('../models/Order.js')).default;
        const order = await Order.findById(orderId);

        if (!order) {
          socket.emit('error', { message: 'Orden no encontrada' });
          return;
        }

        // Verificar permisos
        const canUpdate = socket.userId === order.assignedBooster?.toString() || 
                         socket.userRole === 'admin';

        if (!canUpdate) {
          socket.emit('error', { message: 'No tienes permisos para actualizar esta orden' });
          return;
        }

        // Actualizar orden
        order.progress = progress;
        if (status) order.status = status;
        
        order.updates.push({
          booster: socket.userId,
          progress: progress,
          status: status,
          message: message,
          timestamp: new Date()
        });

        await order.save();

        // Emitir actualización a todos los interesados
        const updateData = {
          orderId: order._id,
          progress: progress,
          status: status,
          message: message,
          updatedBy: socket.username,
          timestamp: new Date()
        };

        orderTrackingIo.to(`order_${orderId}`).emit('order_updated', updateData);

      } catch (error) {
        console.error('Error en order_progress_update:', error);
        socket.emit('error', { message: 'Error actualizando progreso' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`📊 Usuario desconectado de order tracking: ${socket.username}`);
    });
  });
};