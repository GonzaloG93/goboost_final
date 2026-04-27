// backend/models/Order.js - VERSIÓN COMPLETA CON boosterAssigned
import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['customer', 'admin', 'system'],
    default: 'system'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const orderSchema = new mongoose.Schema({
  // ✅ CORREGIDO: Sin required, se generará automáticamente
  orderNumber: {
    type: String,
    unique: true,
    index: true,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BoostService',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'in_progress', 'completed', 'cancelled', 'awaiting_payment_confirmation'],
    default: 'pending',
    index: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // ✅ CORREGIDO: Agregado 'pending_verification' al enum
  paymentStatus: {
    type: String,
    enum: ['pending', 'pending_verification', 'paid', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'stripe', 'manual', 'nowpayments', 'wallet', 'transfer', 'cash', 'binance'],
    default: 'paypal'
  },
  gameDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  },
  priceBreakdown: {
    type: [{
      item: String,
      amount: Number,
      isTotal: Boolean
    }],
    default: []
  },
  notes: [noteSchema],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  paidAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  paymentReference: String,
  paymentProviderId: String,
  paymentDetails: mongoose.Schema.Types.Mixed,
  adminAssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  booster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // ✅ NUEVO CAMPO: Nombre del booster (para referencia rápida y pagos)
  boosterAssigned: {
    type: String,
    default: '',
    trim: true,
    index: true  // Índice para búsquedas rápidas
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ boosterAssigned: 1 }); // ✅ NUEVO ÍNDICE

// ✅ MÉTODO ESTÁTICO MEJORADO: Generar orderNumber único
orderSchema.statics.generateUniqueOrderNumber = async function() {
  const generateNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BS${timestamp}${random}`;
  };

  let orderNumber;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    orderNumber = generateNumber();
    const existingOrder = await this.findOne({ orderNumber });
    
    if (!existingOrder) {
      return orderNumber;
    }
    
    attempts++;
    console.log(`⚠️ OrderNumber ${orderNumber} ya existe, intentando nuevo...`);
  } while (attempts < maxAttempts);

  // Si no se encuentra único después de varios intentos
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `ORD-${timestamp}-${uniqueId}`;
};

// ✅ MIDDLEWARE CORREGIDO: Usar el método estático
orderSchema.pre('validate', async function(next) {
  if (this.isNew && (!this.orderNumber || this.orderNumber === null)) {
    try {
      console.log('🔢 Generando orderNumber único...');
      
      // Usar el método estático mejorado
      this.orderNumber = await this.constructor.generateUniqueOrderNumber();
      
      console.log(`✅ OrderNumber generado: ${this.orderNumber}`);
    } catch (error) {
      console.error('❌ Error generando orderNumber:', error);
      
      // FALLBACK definitivo
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substr(2, 9).toUpperCase();
      this.orderNumber = `ORD-${timestamp}-${uniqueId}`;
      
      console.log(`⚠️ Usando fallback: ${this.orderNumber}`);
    }
  }
  next();
});

// ✅ EVITAR DUPLICADOS EN GUARDADO
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber || this.orderNumber === null) {
    console.warn('⚠️ orderNumber no generado, generando emergencia...');
    
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9).toUpperCase();
    this.orderNumber = `EMG-${timestamp}-${uniqueId}`;
    
    console.log(`🆘 OrderNumber de emergencia: ${this.orderNumber}`);
  }
  
  // Verificar que no exista otro documento con el mismo orderNumber
  if (this.isModified('orderNumber') || this.isNew) {
    try {
      const existingOrder = await this.constructor.findOne({ 
        orderNumber: this.orderNumber,
        _id: { $ne: this._id } // Excluir el documento actual
      });
      
      if (existingOrder) {
        console.error(`❌ CONFLICTO: orderNumber ${this.orderNumber} ya existe`);
        
        // Generar uno nuevo
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substr(2, 9).toUpperCase();
        this.orderNumber = `CONF-${timestamp}-${uniqueId}`;
        
        console.log(`🔄 Generando nuevo orderNumber por conflicto: ${this.orderNumber}`);
      }
    } catch (error) {
      console.error('❌ Error verificando duplicados:', error);
    }
  }
  
  next();
});

// Métodos de instancia
orderSchema.methods.addNote = async function(content, type = 'system', authorId = null) {
  this.notes.push({
    content,
    type,
    author: authorId,
    createdAt: new Date()
  });
  return this.save();
};

orderSchema.methods.addMessage = async function(senderId, message, messageType = 'text') {
  if (!this.metadata.messages) {
    this.metadata.set('messages', []);
  }
  
  const messages = this.metadata.get('messages') || [];
  messages.push({
    sender: senderId,
    message,
    type: messageType,
    timestamp: new Date(),
    readBy: [senderId]
  });
  
  this.metadata.set('messages', messages);
  return this.save();
};

// ✅ NUEVO MÉTODO: Asignar booster por nombre
orderSchema.methods.assignBoosterByName = async function(boosterName, adminId = null) {
  this.boosterAssigned = boosterName;
  
  // Agregar nota automática
  this.notes.push({
    content: `Booster asignado: ${boosterName}`,
    type: 'admin',
    author: adminId,
    createdAt: new Date()
  });
  
  return this.save();
};

// Virtuals
orderSchema.virtual('createdAtFormatted').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString('es-ES') : 'N/A';
});

orderSchema.virtual('formattedTotalPrice').get(function() {
  return `$${this.totalPrice?.toFixed(2) || '0.00'}`;
});

// ✅ NUEVO VIRTUAL: Calcular 50% para pago al booster
orderSchema.virtual('boosterPayout').get(function() {
  const total = this.totalPrice || 0;
  return total * 0.5;
});

orderSchema.virtual('statusInfo').get(function() {
  const statusMap = {
    'pending': { text: 'Pendiente de Pago', color: 'yellow', icon: '⏳' },
    'paid': { text: 'Pago Confirmado', color: 'green', icon: '✅' },
    'in_progress': { text: 'En Progreso', color: 'blue', icon: '🔄' },
    'completed': { text: 'Completada', color: 'purple', icon: '🎯' },
    'cancelled': { text: 'Cancelada', color: 'red', icon: '❌' },
    'awaiting_payment_confirmation': { text: 'Esperando Confirmación', color: 'orange', icon: '⏰' }
  };
  
  return statusMap[this.status] || { text: this.status, color: 'gray', icon: '❓' };
});

const Order = mongoose.model('Order', orderSchema);

export default Order;