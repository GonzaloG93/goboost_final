// backend/models/PaymentProof.js - VERSIÓN CORREGIDA
import mongoose from 'mongoose';

const paymentProofSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  transactionHash: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'pending_verification', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
paymentProofSchema.index({ orderId: 1 });
paymentProofSchema.index({ userId: 1 });
paymentProofSchema.index({ status: 1 });
paymentProofSchema.index({ createdAt: -1 });

const PaymentProof = mongoose.model('PaymentProof', paymentProofSchema);

export default PaymentProof;