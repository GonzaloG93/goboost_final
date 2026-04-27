// backend/controllers/supportController.js - VERSIÓN PRODUCCIÓN
import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';

// ==================== FUNCIONES AUXILIARES ====================
const generateTicketNumber = async () => {
  try {
    const lastTicket = await SupportTicket.findOne()
      .sort({ createdAt: -1 })
      .select('ticketNumber');
    
    let nextNumber = 1;
    if (lastTicket && lastTicket.ticketNumber && lastTicket.ticketNumber !== 'TEMP') {
      const match = lastTicket.ticketNumber.match(/TKT(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `TKT${nextNumber.toString().padStart(6, '0')}`;
  } catch (error) {
    return `TKT${Date.now().toString().slice(-6)}`;
  }
};

// ==================== FUNCIONES PÚBLICAS ====================

export const debugTawkTo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupportTicket = async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    const userId = req.user._id;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required'
      });
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = new SupportTicket({
      ticketNumber,
      user: userId,
      subject: subject.trim(),
      description: message.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
      messages: [{
        sender: userId,
        message: message.trim(),
        content: message.trim(),
        messageType: 'text',
        senderRole: 'customer',
        createdAt: new Date()
      }]
    });

    await ticket.save();
    await ticket.populate('user', 'username email');

    if (req.io) {
      req.io.to(`user_tickets_${userId}`).emit('ticket_created', { ticket });
      req.io.to('admin_tickets').emit('new_ticket_created', { 
        ticket, 
        customerId: userId,
        customerName: req.user.username
      });
    }

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Ticket created successfully'
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user._id;

    const query = { user: userId };
    if (status) query.status = status;

    const tickets = await SupportTicket.find(query)
      .populate('assignedTo', 'username')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tickets' });
  }
};

export const getUserTicketsFormatted = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { user: userId };
    if (status && status !== 'all') query.status = status;

    const tickets = await SupportTicket.find(query)
      .populate('user', 'username email')
      .populate('assignedTo', 'username')
      .populate('messages.sender', 'username role')
      .sort({ updatedAt: -1 });

    const formattedTickets = tickets.map(ticket => ({
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      message: ticket.description,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: ticket.user,
      assignedTo: ticket.assignedTo,
      replies: (ticket.messages || []).map(msg => ({
        _id: msg._id,
        message: msg.message,
        content: msg.content || msg.message,
        isAdmin: msg.senderRole === 'admin' || msg.senderRole === 'support',
        sender: msg.sender,
        senderRole: msg.senderRole,
        createdAt: msg.createdAt,
        read: msg.read
      })),
      messageCount: ticket.messages?.length || 0
    }));

    res.json({ success: true, data: formattedTickets });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tickets' });
  }
};

export const getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId })
      .populate('user', 'username email')
      .populate('assignedTo', 'username email')
      .populate('messages.sender', 'username role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.messages?.length) {
      ticket.messages.forEach(msg => {
        if (msg.senderRole !== 'customer' && !msg.read) {
          msg.read = true;
          msg.readAt = new Date();
        }
      });
      await ticket.save();
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching ticket' });
  }
};

export const addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot add messages to a resolved or closed ticket' 
      });
    }

    const newMessage = {
      sender: userId,
      message: message.trim(),
      content: message.trim(),
      messageType: 'text',
      senderRole: 'customer',
      createdAt: new Date()
    };

    ticket.messages.push(newMessage);
    ticket.status = 'waiting_support';
    ticket.updatedAt = new Date();
    
    await ticket.save();

    if (req.io) {
      req.io.to('admin_tickets').emit('customer_replied', {
        ticketId,
        message: newMessage,
        customerId: userId,
        customerName: req.user.username
      });
    }

    res.json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (['resolved', 'closed'].includes(ticket.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reply to a resolved or closed ticket' 
      });
    }

    const newMessage = {
      sender: userId,
      message: message.trim(),
      content: message.trim(),
      senderRole: 'customer',
      messageType: 'text',
      createdAt: new Date(),
      read: false
    };

    ticket.messages.push(newMessage);
    ticket.status = 'waiting_support';
    ticket.updatedAt = new Date();
    
    await ticket.save();

    const updatedTicket = await SupportTicket.findById(ticketId)
      .populate('user', 'username email')
      .populate('assignedTo', 'username')
      .populate('messages.sender', 'username role');

    if (req.io) {
      req.io.to('admin_tickets').emit('customer_replied', {
        ticketId,
        message: newMessage,
        customerId: userId,
        customerName: req.user.username
      });
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending reply' });
  }
};

export const updateTicketStatusUser = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['resolved', 'closed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only "resolved" or "closed" status allowed for users' 
      });
    }

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    
    if (status === 'resolved') ticket.resolvedAt = new Date();
    else if (status === 'closed') ticket.closedAt = new Date();
    
    ticket.updatedAt = new Date();
    
    ticket.messages.push({
      sender: userId,
      message: `📝 Usuario cambió estado: ${oldStatus} → ${status}`,
      content: `📝 Usuario cambió estado: ${oldStatus} → ${status}`,
      senderRole: 'customer',
      messageType: 'system',
      createdAt: new Date(),
      read: true
    });
    
    await ticket.save();

    res.json({
      success: true,
      data: ticket,
      message: `Ticket marked as ${status}`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating ticket status' });
  }
};

export const getTawkToWidget = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;

    const ticket = await SupportTicket.findOne({ _id: ticketId, user: userId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({
      success: true,
      data: {
        propertyId: process.env.TAWKTO_PROPERTY_ID,
        widgetId: process.env.TAWKTO_WIDGET_ID,
        autoload: true,
        userData: {
          name: req.user.username,
          email: req.user.email,
          ticketNumber: ticket.ticketNumber
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error getting chat configuration' });
  }
};

// ==================== FUNCIONES DE ADMIN ====================

export const getAdminTickets = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20, search } = req.query;

    let filter = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'username email')
      .populate('assignedTo', 'username')
      .populate('messages.sender', 'username role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupportTicket.countDocuments(filter);

    res.json({
      success: true,
      tickets,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener los tickets' });
  }
};

export const adminReplyToTicket = async (req, res) => {
  try {
    const { message } = req.body;
    const { ticketId } = req.params;
    
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }

    if (!ticket.messages) {
      ticket.messages = [];
    }

    const newMessage = {
      sender: req.user._id,
      message: message.trim(),
      content: message.trim(),
      senderRole: req.user.role === 'admin' ? 'admin' : 'support',
      messageType: 'text',
      createdAt: new Date(),
      read: false
    };

    ticket.messages.push(newMessage);
    
    if (ticket.status === 'open' || ticket.status === 'waiting_support') {
      ticket.status = 'in_progress';
    }
    
    ticket.updatedAt = new Date();
    
    await ticket.save();

    await ticket.populate('user', 'username email');
    await ticket.populate('assignedTo', 'username');
    await ticket.populate('messages.sender', 'username role');

    if (req.io) {
      req.io.to(`user_tickets_${ticket.user._id}`).emit('admin_replied', {
        ticketId: ticket._id,
        message: newMessage,
        adminName: req.user.username,
        ticket
      });
      
      req.io.to(`ticket_${ticket._id}`).emit('ticket_message_added', {
        ticketId: ticket._id,
        message: newMessage,
        sender: {
          _id: req.user._id,
          username: req.user.username,
          role: req.user.role
        }
      });
    }

    res.json({
      success: true,
      message: 'Respuesta enviada exitosamente',
      ticket
    });

  } catch (error) {
    console.error('Error en adminReplyToTicket:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar la respuesta'
    });
  }
};

export const updateTicketStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const { ticketId } = req.params;

    const validStatuses = ['open', 'in_progress', 'waiting_support', 'waiting_customer', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Estado no válido' });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date();
    
    if (status === 'resolved') ticket.resolvedAt = new Date();
    else if (status === 'closed') ticket.closedAt = new Date();

    if (!ticket.messages) ticket.messages = [];
    
    ticket.messages.push({
      sender: req.user._id,
      message: `📝 Estado cambiado: ${oldStatus} → ${status}`,
      content: `📝 Estado cambiado: ${oldStatus} → ${status}`,
      senderRole: 'system',
      messageType: 'system',
      createdAt: new Date(),
      read: true
    });

    await ticket.save();
    await ticket.populate('user', 'username email');

    if (req.io) {
      req.io.to(`user_tickets_${ticket.user._id}`).emit('ticket_status_updated', {
        ticketId,
        status,
        oldStatus,
        updatedBy: req.user.username
      });
    }

    res.json({
      success: true,
      message: 'Estado del ticket actualizado',
      ticket
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar el estado' });
  }
};

export const getTicketStatsAdmin = async (req, res) => {
  try {
    const [statusStats, priorityStats, total] = await Promise.all([
      SupportTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      SupportTicket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      SupportTicket.countDocuments()
    ]);

    const statusCounts = {
      open: 0, in_progress: 0, waiting_support: 0,
      waiting_customer: 0, resolved: 0, closed: 0
    };
    
    statusStats.forEach(stat => { statusCounts[stat._id] = stat.count; });

    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    priorityStats.forEach(stat => { priorityCounts[stat._id] = stat.count; });

    res.json({
      success: true,
      stats: {
        status: statusCounts,
        priority: priorityCounts,
        summary: {
          total,
          open: statusCounts.open + statusCounts.waiting_support,
          inProgress: statusCounts.in_progress,
          resolved: statusCounts.resolved + statusCounts.closed,
          urgent: priorityCounts.urgent
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener las estadísticas' });
  }
};

// Funciones legacy para compatibilidad
export const getSupportTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, assigned } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (assigned === 'me') query.assignedTo = req.user._id;
    if (assigned === 'unassigned') query.assignedTo = { $exists: false };

    const tickets = await SupportTicket.find(query)
      .populate('user', 'username email')
      .populate('assignedTo', 'username')
      .sort({ priority: -1, updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupportTicket.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching support tickets' });
  }
};

export const assignTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { assignTo } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const assignee = await User.findOne({ _id: assignTo, role: { $in: ['admin', 'support'] } });

    if (!assignee) {
      return res.status(400).json({ success: false, message: 'Invalid support user' });
    }

    ticket.assignedTo = assignTo;
    ticket.status = 'in_progress';
    await ticket.save();

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = status;
    if (status === 'resolved') ticket.resolvedAt = new Date();
    await ticket.save();

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { resolutionNotes } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.resolutionNotes = resolutionNotes;
    await ticket.save();

    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORT DEFAULT ====================
export default {
  createSupportTicket,
  getUserTickets,
  getUserTicketsFormatted,
  getTicket,
  addMessage,
  replyToTicket,
  updateTicketStatusUser,
  getTawkToWidget,
  debugTawkTo,
  getAdminTickets,
  adminReplyToTicket,
  updateTicketStatusAdmin,
  getTicketStatsAdmin,
  getSupportTickets,
  assignTicket,
  updateTicketStatus,
  resolveTicket
};