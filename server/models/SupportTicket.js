// backend/models/SupportTicket.js - VERSIÓN FINAL COMPLETA
import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  content: { // ✅ Campo alternativo para compatibilidad
    type: String,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'system', 'internal'],
    default: 'text'
  },
  senderRole: {
    type: String,
    enum: ['customer', 'support', 'admin', 'system'],
    default: 'customer'
  },
  attachments: [{
    filename: String,
    url: String,
    mimetype: String,
    size: Number
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isInternal: { // ✅ Para notas internas
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  _id: true 
});

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true,
    default: 'TEMP',
    index: true
  },
  tawkToId: {
    type: String,
    sparse: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'general', 'order_issue', 'account', 'payment', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_support', 'waiting_customer', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  messages: [ticketMessageSchema],
  resolvedAt: Date,
  closedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  resolutionNotes: String,
  customerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  customerFeedback: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// ✅ MIDDLEWARE PRE-SAVE ROBUSTO
supportTicketSchema.pre('save', async function(next) {
  try {
    // Solo generar ticketNumber para nuevos tickets
    if (this.isNew || this.ticketNumber === 'TEMP') {
      console.log('🔄 Generando ticketNumber para nuevo ticket...');
      
      // Buscar el ticket con el número más alto
      const lastTicket = await mongoose.model('SupportTicket')
        .findOne({ ticketNumber: { $regex: /^TKT\d+$/ } })
        .sort({ ticketNumber: -1 })
        .select('ticketNumber');
      
      let nextNumber = 1;
      
      if (lastTicket && lastTicket.ticketNumber) {
        // Extraer número: "TKT000123" -> 123
        const match = lastTicket.ticketNumber.match(/TKT(\d+)/);
        if (match && match[1]) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      // Formatear con 6 dígitos
      this.ticketNumber = `TKT${nextNumber.toString().padStart(6, '0')}`;
      console.log(`✅ TicketNumber asignado: ${this.ticketNumber}`);
    }
    
    // Actualizar lastUpdated siempre
    this.lastUpdated = new Date();
    
    next();
  } catch (error) {
    console.error('❌ Error en middleware de SupportTicket:', error);
    
    // Fallback seguro si hay error
    if (this.isNew || this.ticketNumber === 'TEMP') {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      this.ticketNumber = `TKT-${timestamp}-${random}`;
      console.log(`⚠️ Usando ticketNumber fallback: ${this.ticketNumber}`);
    }
    
    next();
  }
});

// ✅ ÍNDICES COMPLETOS
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, status: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ ticketNumber: 'text', subject: 'text', description: 'text' });

// ✅ VIRTUAL FIELDS PARA FRONTEND
supportTicketSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';
});

supportTicketSchema.virtual('formattedUpdatedAt').get(function() {
  return this.updatedAt ? this.updatedAt.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';
});

supportTicketSchema.virtual('unreadMessagesCount').get(function() {
  if (!this.messages) return 0;
  return this.messages.filter(msg => !msg.read && msg.senderRole !== 'admin').length;
});

supportTicketSchema.virtual('lastMessage').get(function() {
  if (!this.messages || this.messages.length === 0) return null;
  return this.messages[this.messages.length - 1];
});

supportTicketSchema.virtual('messageCount').get(function() {
  return this.messages ? this.messages.length : 0;
});

// ✅ MÉTODOS DE INSTANCIA
supportTicketSchema.methods.addMessage = async function(senderId, content, senderRole = 'customer', isInternal = false) {
  const newMessage = {
    sender: senderId,
    message: content,
    content: content, // Para compatibilidad
    senderRole: senderRole,
    messageType: isInternal ? 'internal' : 'text',
    isInternal: isInternal,
    createdAt: new Date(),
    read: senderRole === 'admin' || senderRole === 'support'
  };
  
  this.messages.push(newMessage);
  
  // Actualizar estado automáticamente
  if (senderRole === 'admin' || senderRole === 'support') {
    if (this.status === 'open' || this.status === 'waiting_support') {
      this.status = 'in_progress';
    }
  } else if (senderRole === 'customer') {
    if (this.status === 'in_progress' || this.status === 'waiting_customer') {
      this.status = 'waiting_support';
    }
  }
  
  this.lastUpdated = new Date();
  
  return this.save();
};

supportTicketSchema.methods.updateStatus = async function(newStatus, userId = null, notes = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Actualizar timestamps
  if (newStatus === 'resolved') {
    this.resolvedAt = new Date();
  } else if (newStatus === 'closed') {
    this.closedAt = new Date();
  }
  
  this.lastUpdated = new Date();
  
  // Agregar mensaje del sistema
  if (notes || (userId && oldStatus !== newStatus)) {
    const systemMessage = {
      sender: userId || this.user,
      message: notes || `📝 Estado cambiado: ${oldStatus} → ${newStatus}`,
      content: notes || `📝 Estado cambiado: ${oldStatus} → ${newStatus}`,
      senderRole: userId ? 'admin' : 'system',
      messageType: 'system',
      createdAt: new Date(),
      read: true
    };
    
    this.messages.push(systemMessage);
  }
  
  return this.save();
};

supportTicketSchema.methods.markMessagesAsRead = async function(userRole) {
  if (userRole === 'admin' || userRole === 'support') {
    this.messages.forEach(msg => {
      if (!msg.read && msg.senderRole === 'customer') {
        msg.read = true;
        msg.readAt = new Date();
      }
    });
  }
  
  return this.save();
};

supportTicketSchema.methods.assignToAdmin = async function(adminId, assignedById) {
  this.assignedTo = adminId;
  this.status = 'in_progress';
  this.lastUpdated = new Date();
  
  // Agregar mensaje del sistema
  this.messages.push({
    sender: assignedById,
    message: `👤 Ticket asignado a administrador`,
    content: `👤 Ticket asignado a administrador`,
    senderRole: 'admin',
    messageType: 'system',
    createdAt: new Date(),
    read: false
  });
  
  return this.save();
};

// ✅ MÉTODOS ESTÁTICOS
supportTicketSchema.statics.getStats = async function() {
  try {
    const [statusStats, priorityStats, categoryStats, total] = await Promise.all([
      this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      this.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      this.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      this.countDocuments()
    ]);
    
    return {
      total,
      status: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {
        open: 0, in_progress: 0, waiting_support: 0,
        waiting_customer: 0, resolved: 0, closed: 0
      }),
      priority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {
        low: 0, medium: 0, high: 0, urgent: 0
      }),
      category: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return {
      total: 0,
      status: {},
      priority: {},
      category: {}
    };
  }
};

supportTicketSchema.statics.findByTicketNumber = async function(ticketNumber) {
  return this.findOne({ ticketNumber })
    .populate('user', 'username email avatar')
    .populate('assignedTo', 'username email')
    .populate('messages.sender', 'username email role');
};

// ✅ VALIDACIONES
supportTicketSchema.path('subject').validate(function(subject) {
  return subject && subject.trim().length >= 5;
}, 'El asunto debe tener al menos 5 caracteres');

supportTicketSchema.path('description').validate(function(description) {
  return description && description.trim().length >= 10;
}, 'La descripción debe tener al menos 10 caracteres');

// ✅ MIDDLEWARE POST-SAVE PARA SOCKETS
supportTicketSchema.post('save', function(doc) {
  // Esto se ejecutará después de guardar, útil para emitir eventos
  console.log(`✅ Ticket ${doc.ticketNumber} guardado/actualizado`);
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;