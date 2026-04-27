// backend/models/CustomService.js - NUEVO
const customServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  game: { type: String, required: true },
  description: { type: String },
  features: [{ type: String }],
  basePrice: { type: Number, required: true, min: 0 },
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number },
  priceType: { 
    type: String, 
    enum: ['fixed', 'variable', 'range', 'negotiable'],
    default: 'fixed'
  },
  priceOptions: [{
    name: String,
    price: Number,
    description: String
  }],
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});