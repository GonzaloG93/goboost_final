// backend/routes/orders.js - VERSIÓN CORREGIDA Y MEJORADA
import express from 'express';
import Order from '../models/Order.js';
import BoostService from '../models/BoostService.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ MIDDLEWARE DE LOGGING PARA DEBUG
router.use((req, res, next) => {
  console.log(`📦 [${req.method}] ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log('📤 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ✅ OBTENER ÓRDENES DEL USUARIO ACTUAL - CORREGIDO
router.get('/my-orders', auth, async (req, res) => {
  try {
    console.log('📦 Obteniendo órdenes para usuario:', req.user._id);
    
    const orders = await Order.find({ user: req.user._id })
      .populate('service', 'name game serviceType basePrice estimatedTime')
      .populate('adminAssignedTo', 'username email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Encontradas ${orders.length} órdenes para usuario ${req.user._id}`);
    
    res.json({
      success: true,
      orders: orders || []
    });
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo órdenes' 
    });
  }
});

// ✅ OBTENER UNA ORDEN ESPECÍFICA - MEJORADO
router.get('/:orderId', auth, async (req, res) => {
  try {
    console.log('🔍 Buscando orden específica:', req.params.orderId);
    
    const order = await Order.findById(req.params.orderId)
      .populate('service', 'name game serviceType basePrice estimatedTime description')
      .populate('user', 'username email')
      .populate('adminAssignedTo', 'username email');

    if (!order) {
      console.log('❌ Orden no encontrada:', req.params.orderId);
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada' 
      });
    }

    // ✅ VERIFICAR PERMISOS: Usuario dueño o admin
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      console.log('❌ Permiso denegado:', {
        orderUser: order.user._id,
        requester: req.user._id,
        requesterRole: req.user.role
      });
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para ver esta orden' 
      });
    }

    console.log('✅ Orden encontrada:', order._id);
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Error obteniendo orden:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'ID de orden inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo orden' 
    });
  }
});

// ✅ CREAR NUEVA ORDEN - COMPLETAMENTE CORREGIDO
router.post('/', auth, async (req, res) => {
  try {
    console.log('🆕 === CREANDO NUEVA ORDEN ===');
    console.log('📤 Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const { service, gameDetails, totalPrice, priceBreakdown, priority = 'normal' } = req.body;
    
    // ✅ VALIDACIONES BÁSICAS
    if (!service) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de servicio requerido' 
      });
    }

    // Verificar que el servicio existe
    const serviceDoc = await BoostService.findById(service);
    if (!serviceDoc) {
      return res.status(404).json({ 
        success: false,
        message: 'Servicio no encontrado' 
      });
    }

    console.log('✅ Servicio encontrado:', serviceDoc.name);

    // ✅ CREAR DATOS DE LA ORDEN
    const orderData = {
      user: req.user._id,
      service,
      gameDetails: {
        ...gameDetails,
        game: serviceDoc.game || 'Unknown'
      },
      totalPrice: totalPrice || serviceDoc.basePrice || 0,
      priceBreakdown: priceBreakdown || [],
      priority,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'paypal',
      metadata: {
        createdFrom: 'custom_order_form',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    };

    console.log('📦 Datos de orden a crear:', JSON.stringify(orderData, null, 2));

    // ✅ CREAR Y GUARDAR LA ORDEN
    const order = new Order(orderData);
    
    try {
      await order.validate(); // Validar antes de guardar
      console.log('✅ Validación de orden exitosa');
    } catch (validationError) {
      console.error('❌ Error de validación:', validationError.errors);
      return res.status(400).json({ 
        success: false,
        message: 'Error de validación: ' + Object.values(validationError.errors).map(e => e.message).join(', '),
        details: validationError.errors
      });
    }

    await order.save();
    
    // ✅ POPULAR LOS DATOS PARA LA RESPUESTA
    await order.populate('service', 'name game serviceType basePrice');
    await order.populate('user', 'username email');

    // ✅ AGREGAR NOTA DEL SISTEMA
    await order.addNote(
      `Orden creada por ${req.user.username}. Estado: pendiente de pago. Total: $${order.totalPrice}`,
      'system'
    );

    console.log('✅ === ORDEN CREADA EXITOSAMENTE ===');
    console.log('📊 Detalles:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      status: order.status
    });

    // ✅ EMITIR EVENTO SOCKET SI EXISTE
    if (req.io) {
      req.io.emit('new_order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: req.user._id,
        username: req.user.username,
        totalPrice: order.totalPrice,
        serviceName: serviceDoc.name
      });
    }
    
    // ✅ RESPUESTA CON FORMATO CONSISTENTE
    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        service: order.service,
        gameDetails: order.gameDetails,
        priceBreakdown: order.priceBreakdown
      }
    });

  } catch (error) {
    console.error('❌ === ERROR CRÍTICO CREANDO ORDEN ===');
    console.error('Error completo:', error);
    console.error('Stack:', error.stack);
    
    let errorMessage = 'Error interno del servidor al crear orden';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Error de validación: ' + Object.values(error.errors).map(e => e.message).join(', ');
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = 'ID inválido proporcionado';
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = 'Error de duplicación (orderNumber duplicado)';
      statusCode = 409;
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ ENDPOINT PARA PAGAR ORDEN
router.patch('/:id/pay', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'paypal', paymentReference, providerId, details } = req.body;

    console.log(`💰 Procesando pago para orden ${id}, método: ${paymentMethod}`);

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada' 
      });
    }

    // ✅ VERIFICAR QUE EL USUARIO ES EL DUEÑO DE LA ORDEN
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para pagar esta orden' 
      });
    }

    // ✅ VERIFICAR QUE LA ORDEN ESTÁ PENDIENTE
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: `La orden ya está ${order.status === 'paid' ? 'pagada' : order.status}` 
      });
    }

    // ✅ VALIDAR MÉTODO DE PAGO
    const validPaymentMethods = ['paypal', 'nowpayments', 'wallet', 'transfer', 'cash'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false,
        message: `Método de pago inválido. Usa: ${validPaymentMethods.join(', ')}` 
      });
    }

    // ✅ ACTUALIZAR ORDEN CON DATOS DE PAGO
    order.status = 'paid';
    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    order.paymentReference = paymentReference;
    order.paymentProviderId = providerId;
    order.paymentDetails = details;
    order.paidAt = new Date();

    // ✅ AGREGAR NOTA DEL SISTEMA
    await order.addNote(
      `Pago procesado exitosamente mediante ${paymentMethod}`,
      'system',
      req.user._id
    );

    await order.save();
    await order.populate('service');
    await order.populate('user', 'username email');

    console.log(`✅ Pago exitoso para orden ${id} - Monto: $${order.totalPrice}`);

    // ✅ EMITIR EVENTO DE SOCKET
    if (req.io) {
      req.io.emit('order_updated', {
        orderId: order._id,
        newStatus: 'paid',
        updatedBy: req.user._id,
        updatedByUsername: req.user.username,
        timestamp: new Date().toISOString()
      });

      // Notificar al usuario específico
      req.io.to(`user_${order.user._id}`).emit('order_paid', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.totalPrice,
        paymentMethod: paymentMethod,
        paidAt: order.paidAt
      });

      // Notificar a admins
      req.io.to('admin_room').emit('order_paid_admin', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: order.user._id,
        username: order.user.username,
        amount: order.totalPrice,
        paymentMethod: paymentMethod
      });
    }

    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        paidAt: order.paidAt
      }
    });

  } catch (error) {
    console.error('❌ Error procesando pago:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'ID de orden inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error procesando el pago' 
    });
  }
});

// ✅ ENDPOINT PARA CANCELAR ORDEN
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log(`❌ Solicitando cancelación para orden ${id}`);

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada' 
      });
    }

    // ✅ VERIFICAR PERMISOS: Usuario dueño o admin
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para cancelar esta orden' 
      });
    }

    // ✅ VERIFICAR QUE LA ORDEN ESTÁ PENDIENTE
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: `No se puede cancelar una orden con estado: ${order.status}` 
      });
    }

    // ✅ ACTUALIZAR ESTADO
    order.status = 'cancelled';
    order.paymentStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason || (isOwner ? 'Cancelado por el cliente' : 'Cancelado por administrador');

    // ✅ AGREGAR NOTA DEL SISTEMA
    await order.addNote(
      `Orden cancelada por ${req.user.username}. Razón: ${order.cancellationReason}`,
      'system',
      req.user._id
    );

    await order.save();
    await order.populate('service');
    await order.populate('user', 'username email');

    console.log(`✅ Orden ${id} cancelada exitosamente`);

    // ✅ EMITIR EVENTO DE SOCKET
    if (req.io) {
      req.io.emit('order_updated', {
        orderId: order._id,
        newStatus: 'cancelled',
        updatedBy: req.user._id,
        updatedByUsername: req.user.username,
        timestamp: new Date().toISOString(),
        reason: order.cancellationReason
      });

      // Notificar al usuario específico
      req.io.to(`user_${order.user._id}`).emit('order_cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        cancelledAt: order.cancelledAt,
        cancelledBy: req.user.username,
        reason: order.cancellationReason
      });

      // Notificar a admins
      if (isOwner) {
        req.io.to('admin_room').emit('order_cancelled_admin', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          userId: order.user._id,
          username: order.user.username,
          reason: order.cancellationReason,
          cancelledAt: order.cancelledAt
        });
      }
    }

    res.json({
      success: true,
      message: 'Orden cancelada exitosamente',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.cancellationReason
      }
    });

  } catch (error) {
    console.error('❌ Error cancelando orden:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'ID de orden inválido' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error cancelando la orden' 
    });
  }
});

// ✅ ENDPOINT PARA ACTUALIZAR ESTADO DE ORDEN (ADMIN)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assignToAdmin } = req.body;

    // ✅ SOLO ADMINS PUEDEN ACTUALIZAR ESTADO
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Se requieren privilegios de administrador' 
      });
    }

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada' 
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    // Actualizar fechas según estado
    if (status === 'in_progress' && !order.startedAt) {
      order.startedAt = new Date();
    } else if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date();
    }
    
    // Asignar admin si se solicita
    if (assignToAdmin === true) {
      order.adminAssignedTo = req.user._id;
    }
    
    // Agregar nota si se proporciona
    if (notes) {
      await order.addNote(
        notes,
        'admin',
        req.user._id
      );
    }

    await order.save();
    await order.populate('service');
    await order.populate('user', 'username email');
    await order.populate('adminAssignedTo', 'username email');

    console.log(`🔄 Estado actualizado: ${oldStatus} → ${status} (Orden: ${id})`);

    // ✅ EMITIR EVENTO DE SOCKET
    if (req.io) {
      req.io.emit('order_updated', {
        orderId: order._id,
        oldStatus,
        newStatus: status,
        updatedBy: req.user._id,
        updatedByUsername: req.user.username,
        timestamp: new Date().toISOString(),
        notes
      });

      // Notificar al usuario
      req.io.to(`user_${order.user._id}`).emit('order_status_changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus: status,
        updatedBy: req.user.username,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Estado actualizado a ${status}`,
      order
    });

  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error actualizando estado' 
    });
  }
});

// ✅ ENDPOINT PARA AGREGAR MENSAJE A ORDEN
router.post('/:id/message', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada' 
      });
    }

    // ✅ VERIFICAR PERMISOS: Usuario dueño o admin
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permiso para enviar mensajes a esta orden' 
      });
    }

    // Agregar mensaje
    await order.addMessage(req.user._id, message, 'text');
    
    // ✅ EMITIR EVENTO DE SOCKET
    if (req.io) {
      req.io.to(`order_${order._id}`).emit('new_order_message', {
        orderId: order._id,
        sender: {
          _id: req.user._id,
          username: req.user.username,
          role: req.user.role
        },
        message,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error enviando mensaje' 
    });
  }
});

// ✅ ENDPOINT PARA ADMIN OBTENER TODAS LAS ÓRDENES
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Se requieren privilegios de administrador' 
      });
    }

    const { status, paymentStatus, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('service', 'name game serviceType')
      .populate('user', 'username email')
      .populate('adminAssignedTo', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo órdenes para admin:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo órdenes' 
    });
  }
});

// ✅ ENDPOINT: ESTADÍSTICAS DE ÓRDENES
router.get('/stats/user', auth, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalPrice' },
        pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        paidOrders: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
      }}
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalOrders: 0,
        totalAmount: 0,
        pendingOrders: 0,
        paidOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error obteniendo estadísticas' 
    });
  }
});

export default router;