import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'payment', 'refund', 'payout'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: String,
  metadata: {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    paymentMethod: String,
    transactionId: String,
    provider: String
  },
  balanceBefore: Number,
  balanceAfter: Number
}, {
  timestamps: true
});

// Middleware para actualizar balance del usuario
transactionSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'completed') {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    
    this.balanceBefore = user.balance;
    
    if (this.type === 'deposit' || this.type === 'refund') {
      user.balance += this.amount;
    } else if (this.type === 'payment' || this.type === 'withdrawal') {
      user.balance -= this.amount;
    }
    
    this.balanceAfter = user.balance;
    await user.save();
  }
  next();
});

export default mongoose.model('Transaction', transactionSchema);