// backend/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    efficiency: { type: Number, min: 1, max: 5 },
    results: { type: Number, min: 1, max: 5 }
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Índices para mejor performance
reviewSchema.index({ booster: 1, createdAt: -1 });
reviewSchema.index({ order: 1 }, { unique: true }); // Una review por orden
reviewSchema.index({ rating: 1 });

export default mongoose.model('Review', reviewSchema);