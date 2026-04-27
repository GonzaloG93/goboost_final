import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'order_created',
      'order_accepted', 
      'order_completed',
      'order_cancelled',
      'payment_received',
      'system_alert',
      'new_message',
      // ✅ NUEVOS TIPOS PARA SOPORTE
      'new_ticket',
      'ticket_assigned',
      'ticket_reply', 
      'ticket_resolved',
      'ticket_updated'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // ✅ MEJORAR LA ESTRUCTURA DATA PARA SOPORTAR MÚLTIPLES TIPOS
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket'
    },
    // Campos adicionales para flexibilidad
    additionalData: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Índice para búsquedas eficientes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);