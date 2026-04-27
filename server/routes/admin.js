// backend/routes/admin.js
// VERSIÓN COMPLETA CON MODAL DE PAGOS A BOOSTERS

import express from 'express';
import { auth } from '../middleware/authMiddleware.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import BoostService from '../models/BoostService.js';
import Transaction from '../models/Transaction.js';
import SupportTicket from '../models/SupportTicket.js';
import { validateTicketReply, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// ============================================
// MIDDLEWARE UNIFICADO
// ============================================
const requireAdmin = [auth, (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ 
    success: false, 
    message: 'Se requieren privilegios de administrador' 
  });
}];

router.use(requireAdmin);

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...');

    const [
      totalUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenueResult,
      openTickets,
      paidOrders,
      inProgressOrders
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      // Pendientes: incluye 'pending' Y 'awaiting_payment_confirmation'
      Order.countDocuments({ 
        status: { $in: ['pending', 'awaiting_payment_confirmation'] } 
      }),
      Order.countDocuments({ status: 'completed' }),
      // Sumar TODAS las órdenes que generaron ingreso
      Order.aggregate([
        { 
          $match: { 
            status: { $in: ['completed', 'paid', 'in_progress'] } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      SupportTicket.countDocuments({ 
        status: { $in: ['open', 'in_progress', 'waiting_support'] } 
      }),
      Order.countDocuments({ status: 'paid' }),
      Order.countDocuments({ status: 'in_progress' })
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    console.log('📊 Stats calculados:', {
      totalUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      paidOrders,
      inProgressOrders,
      totalRevenue,
      averageOrderValue
    });

    res.json({
      success: true,
      totalUsers,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      openTickets,
      paidOrders,
      inProgressOrders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en /stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
});

router.get('/order-notes', async (req, res) => {
  try {
    console.log('📝 Obteniendo notas de órdenes recientes...');
    const { limit = 15 } = req.query;

    const orders = await Order.find({
      'notes': { $exists: true, $not: { $size: 0 } }
    })
      .select('orderNumber notes createdAt user service status boosterAssigned')
      .populate('user', 'username email')
      .populate('service', 'name game')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const allNotes = [];
    orders.forEach(order => {
      if (order.notes && order.notes.length > 0) {
        const latestNote = order.notes[order.notes.length - 1];
        allNotes.push({
          _id: latestNote._id || order._id + '_note',
          orderId: order._id,
          orderNumber: order.orderNumber || `BS${order._id.toString().slice(-6)}`,
          content: latestNote.content,
          type: latestNote.type || 'system',
          userName: order.user?.username || 'Sistema',
          author: latestNote.author,
          createdAt: latestNote.createdAt || order.createdAt,
          serviceName: order.service?.name || 'Servicio',
          game: order.service?.game || 'N/A',
          boosterAssigned: order.boosterAssigned || ''
        });
      } else if (order.boosterAssigned) {
        // Si no hay notas pero tiene booster asignado, crear una nota virtual
        allNotes.push({
          _id: order._id + '_booster',
          orderId: order._id,
          orderNumber: order.orderNumber || `BS${order._id.toString().slice(-6)}`,
          content: `Booster asignado: ${order.boosterAssigned}`,
          type: 'admin',
          userName: 'Sistema',
          createdAt: order.updatedAt || order.createdAt,
          serviceName: order.service?.name || 'Servicio',
          game: order.service?.game || 'N/A',
          boosterAssigned: order.boosterAssigned
        });
      }
    });

    allNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedNotes = allNotes.slice(0, parseInt(limit));

    console.log(`✅ Enviando ${limitedNotes.length} notas de órdenes`);

    res.json({
      success: true,
      notes: limitedNotes,
      total: allNotes.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo notas de órdenes:', error);
    res.json({
      success: true,
      notes: [],
      total: 0,
      warning: 'Error al cargar notas'
    });
  }
});

router.get('/recent-activity', async (req, res) => {
  try {
    console.log('📊 Obteniendo actividad reciente...');
    const { limit = 10 } = req.query;

    const recentOrders = await Order.find()
      .select('orderNumber user service status totalPrice createdAt boosterAssigned')
      .populate('user', 'username email')
      .populate('service', 'name game')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const recentTickets = await SupportTicket.find()
      .select('ticketNumber user subject status priority createdAt')
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const orderActivities = recentOrders.map(order => ({
      type: 'order',
      action: getOrderAction(order.status),
      description: getOrderDescription(order),
      user: order.user?.username || 'Cliente',
      timestamp: order.createdAt,
      metadata: {
        orderNumber: order.orderNumber,
        status: order.status,
        game: order.service?.game || 'N/A',
        boosterAssigned: order.boosterAssigned || ''
      }
    }));

    const ticketActivities = recentTickets.map(ticket => ({
      type: 'ticket',
      action: getTicketAction(ticket.status),
      description: getTicketDescription(ticket),
      user: ticket.user?.username || 'Usuario',
      timestamp: ticket.createdAt,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        priority: ticket.priority
      }
    }));

    const allActivities = [...orderActivities, ...ticketActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    console.log(`✅ Enviando ${allActivities.length} actividades recientes`);

    res.json({
      success: true,
      activity: allActivities,
      total: allActivities.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo actividad reciente:', error);
    res.json({
      success: true,
      activity: [],
      total: 0,
      warning: 'Error al cargar actividad'
    });
  }
});

function getOrderAction(status) {
  const actions = {
    'pending': '🆕 Nueva Orden',
    'paid': '💰 Pago Confirmado',
    'in_progress': '🔄 Orden en Progreso',
    'completed': '✅ Orden Completada',
    'cancelled': '❌ Orden Cancelada'
  };
  return actions[status] || '📦 Orden Actualizada';
}

function getOrderDescription(order) {
  const game = order.service?.game || 'Videojuego';
  const user = order.user?.username || 'Cliente';
  const amount = order.totalPrice ? `$${order.totalPrice}` : '';
  const booster = order.boosterAssigned ? ` | Booster: ${order.boosterAssigned}` : '';
  return `Orden #${order.orderNumber} - ${game} - ${user} ${amount ? `(${amount})` : ''}${booster}`;
}

function getTicketAction(status) {
  const actions = {
    'open': '📩 Nuevo Ticket',
    'in_progress': '🔄 Ticket en Progreso',
    'waiting_support': '⏳ Esperando Soporte',
    'waiting_customer': '💬 Esperando Cliente',
    'resolved': '✅ Ticket Resuelto',
    'closed': '🔒 Ticket Cerrado'
  };
  return actions[status] || '📝 Ticket Actualizado';
}

function getTicketDescription(ticket) {
  return `Ticket #${ticket.ticketNumber} - ${ticket.subject}`;
}

// ============================================
// ÓRDENES
// ============================================

router.get('/orders', async (req, res) => {
  const { limit = 10, status, game, startDate, endDate } = req.query;

  const query = {};
  if (status && status !== 'all') {
    // Manejar múltiples estados separados por coma
    if (status.includes(',')) {
      query.status = { $in: status.split(',') };
    } else {
      query.status = status;
    }
  }
  if (game && game !== 'all') query['gameDetails.game'] = game;

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  try {
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user', 'username email')
      .populate('service', 'name game basePrice priceType priceOptions')
      .lean();

    const processedOrders = orders.map(order => ({
      ...order,
      _id: order._id?.toString(),
      totalPrice: order.totalPrice || 0,
      paymentStatus: order.paymentStatus || (order.status === 'completed' ? 'paid' : 'pending'),
      orderNumber: order.orderNumber || `BS${(order._id?.toString() || '').slice(-6).toUpperCase()}`,
      user: order.user || { username: 'Usuario Desconocido', email: 'N/A' },
      service: order.service || { name: 'Servicio Desconocido', game: 'N/A' },
      createdAtFormatted: order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-ES') : 'N/A',
      boosterAssigned: order.boosterAssigned || ''
    }));

    res.json({ 
      success: true, 
      orders: processedOrders,
      total: await Order.countDocuments(query)
    });

  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener órdenes',
      error: error.message
    });
  }
});

// OBTENER UNA ORDEN POR ID
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'username email')
      .populate({
        path: 'service',
        model: 'BoostService',
        select: 'name game serviceType basePrice priceType priceOptions description features'
      })
      .populate('booster', 'username email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la orden',
      error: error.message
    });
  }
});

// ACTUALIZAR ESTADO DE ORDEN - PUT
router.put('/orders/:orderId/status', async (req, res) => {
  await updateOrderStatus(req, res);
});

// ACTUALIZAR ESTADO DE ORDEN - PATCH
router.patch('/orders/:orderId/status', async (req, res) => {
  await updateOrderStatus(req, res);
});

// Función compartida para actualizar estado
async function updateOrderStatus(req, res) {
  const { orderId } = req.params;
  const { status, notes } = req.body;

  console.log(`🔄 Admin actualizando orden ${orderId} a estado: ${status} (${req.method})`);

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        status,
        $push: {
          notes: {
            content: `Estado cambiado a ${status} por administrador${notes ? `: ${notes}` : ''}`,
            type: 'admin',
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'username email')
     .populate('service', 'name game');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Emitir eventos Socket
    if (req.io) {
      req.io.to('admin_room').emit('order_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: status,
        updatedBy: req.user.username,
        timestamp: new Date()
      });

      req.io.to(`user_${order.user._id}`).emit('order_status_changed', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: status,
        updatedBy: req.user.username,
        timestamp: new Date()
      });

      // Evento específico para actualizar estadísticas
      req.io.to('admin_room').emit('stats_updated', {
        reason: 'order_status_change',
        orderId: order._id,
        newStatus: status,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      order
    });
  } catch (error) {
    console.error(`❌ Error en /orders/:orderId/status (${req.method}):`, error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de orden',
      error: error.message
    });
  }
}

// ASIGNAR BOOSTER A ORDEN
router.put('/orders/:orderId/assign', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { boosterId } = req.body;

    const booster = await User.findById(boosterId);
    if (!booster) {
      return res.status(404).json({ success: false, message: 'Booster no encontrado' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        booster: boosterId,
        boosterAssigned: booster.username,
        $push: {
          notes: {
            content: `Booster asignado: ${booster.username}`,
            type: 'admin',
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'username email')
     .populate('service', 'name game')
     .populate('booster', 'username email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Error asignando booster:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GUARDAR NOTA DE BOOSTER EN ORDEN COMPLETADA (NUEVO ENDPOINT)
router.put('/orders/:orderId/booster-note', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { boosterName, note } = req.body;

    if (!boosterName || boosterName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre del booster es requerido' 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        boosterAssigned: boosterName.trim(),
        $push: {
          notes: {
            content: note || `Booster asignado: ${boosterName}`,
            type: 'admin',
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'username email')
     .populate('service', 'name game');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Orden no encontrada' 
      });
    }

    // Emitir evento de actualización
    if (req.io) {
      req.io.to('admin_room').emit('booster_assigned', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        boosterName: boosterName,
        timestamp: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: 'Booster asignado correctamente',
      order 
    });
  } catch (error) {
    console.error('❌ Error asignando booster:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al asignar booster',
      error: error.message 
    });
  }
});

// AGREGAR NOTA A ORDEN
router.post('/orders/:orderId/notes', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { content, type = 'admin' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'El contenido es requerido' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $push: {
          notes: {
            content: content.trim(),
            type,
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'username email')
     .populate('service', 'name game');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Error agregando nota:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ACTUALIZAR PRECIO DE ORDEN
router.put('/orders/:orderId/price', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { totalPrice } = req.body;

    if (!totalPrice || totalPrice < 0) {
      return res.status(400).json({ success: false, message: 'Precio inválido' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        totalPrice,
        $push: {
          notes: {
            content: `Precio actualizado a $${totalPrice} por administrador`,
            type: 'admin',
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'username email')
     .populate('service', 'name game');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Error actualizando precio:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// MARCAR ORDEN COMO PAGADA
router.put('/orders/:orderId/payment', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentMethod, notes } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: paymentMethod || 'manual',
        status: paymentStatus === 'paid' ? 'paid' : undefined,
        $push: {
          notes: {
            content: notes || `Orden marcada como pagada por administrador`,
            type: 'admin',
            author: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'username email')
     .populate('service', 'name game');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    // Emitir evento de stats actualizadas
    if (req.io) {
      req.io.to('admin_room').emit('stats_updated', {
        reason: 'payment_confirmed',
        orderId: order._id,
        timestamp: new Date()
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Error marcando como pagada:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ENVIAR RECORDATORIO
router.post('/orders/:orderId/remind', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('user', 'email username');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    }

    console.log(`📧 Enviando recordatorio a ${order.user?.email} para orden ${order.orderNumber}`);

    order.$push('notes', {
      content: 'Recordatorio enviado al cliente',
      type: 'admin',
      author: req.user._id,
      createdAt: new Date()
    });
    await order.save();

    res.json({ success: true, message: 'Recordatorio enviado' });
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// TICKETS MANAGEMENT
// ============================================

router.get('/tickets', async (req, res) => {
  try {
    const { 
      status = 'all',
      priority = 'all', 
      category = 'all',
      limit = 20, 
      page = 1,
      search = ''
    } = req.query;

    console.log('🎫 Admin buscando tickets:', { status, priority, category, search });

    const query = {};

    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (category && category !== 'all') query.category = category;

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(query)
      .populate('user', 'username email')
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    const ticketStats = {
      open: await SupportTicket.countDocuments({ status: 'open' }),
      in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      waiting_support: await SupportTicket.countDocuments({ status: 'waiting_support' }),
      waiting_customer: await SupportTicket.countDocuments({ status: 'waiting_customer' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
      closed: await SupportTicket.countDocuments({ status: 'closed' }),
      total: total
    };

    console.log(`✅ Encontrados ${tickets.length} tickets de ${total} totales`);

    res.json({
      success: true,
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      stats: ticketStats
    });
  } catch (error) {
    console.error('❌ Error obteniendo tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tickets',
      error: error.message
    });
  }
});

router.get('/tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    console.log('🎫 Obteniendo ticket por ID:', ticketId);

    const ticket = await SupportTicket.findById(ticketId)
      .populate('user', 'username email')
      .populate('assignedTo', 'username email')
      .populate('responses.user', 'username email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('❌ Error obteniendo ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ticket',
      error: error.message
    });
  }
});

router.post('/tickets/:ticketId/reply', sanitizeInput, validateTicketReply, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    console.log('📝 Admin respondiendo al ticket:', ticketId);

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'El mensaje es requerido' 
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket no encontrado' 
      });
    }

    ticket.responses.push({
      user: req.user._id,
      userModel: 'Admin',
      message: message.trim(),
      isAdmin: true
    });

    ticket.status = 'waiting_customer';
    ticket.lastActivity = new Date();

    await ticket.save();

    await ticket.populate('responses.user', 'username email');
    await ticket.populate('user', 'username email');

    console.log('✅ Respuesta añadida exitosamente');

    if (req.io) {
      req.io.to(`user_${ticket.user._id}`).emit('ticket_updated', {
        ticketId: ticket._id,
        newResponse: {
          message: message.trim(),
          isAdmin: true,
          createdAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      ticket,
      message: 'Respuesta enviada correctamente'
    });

  } catch (error) {
    console.error('❌ Error respondiendo al ticket:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al responder al ticket',
      error: error.message 
    });
  }
});

router.put('/tickets/:ticketId/status', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'waiting_support', 'waiting_customer', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { 
        status,
        lastActivity: new Date()
      },
      { new: true }
    ).populate('user', 'username email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('❌ Error actualizando ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando ticket',
      error: error.message
    });
  }
});

// ============================================
// USUARIOS
// ============================================

router.get('/users', async (req, res) => {
  const { role, isActive } = req.query;

  const query = {};
  if (role && role !== 'all') query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  try {
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    console.log(`👥 Encontrados ${users.length} usuarios`);

    res.json({
      success: true,
      users,
      total: users.length
    });
  } catch (error) {
    console.error('❌ Error en /users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

// OBTENER UN USUARIO POR ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
});

// ACTUALIZAR ROL DE USUARIO
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'booster', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error.message
    });
  }
});

// ACTIVAR/DESACTIVAR USUARIO
router.patch('/users/:userId/toggle-status', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      user: user.toObject({ getters: true, versionKey: false, transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }})
    });
  } catch (error) {
    console.error('❌ Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
});

export default router;