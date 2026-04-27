// backend/models/LiveChat.js
import mongoose from 'mongoose';

const liveChatSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['customer', 'agent', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: true
    }
  }],
  messages: [{
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
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    attachments: [{
      filename: String,
      url: String,
      mimetype: String,
      size: Number
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'waiting', 'in_progress', 'ended', 'transferred'],
    default: 'waiting'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para búsquedas rápidas
liveChatSchema.index({ roomId: 1 });
liveChatSchema.index({ 'participants.user': 1 });
liveChatSchema.index({ status: 1 });
liveChatSchema.index({ assignedAgent: 1 });
liveChatSchema.index({ lastActivity: -1 });

export default mongoose.model('LiveChat', liveChatSchema);