// backend/controllers/transactionController.js - PRODUCTION VERSION
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// ✅ VALIDATION HELPER
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

// ✅ GET USER TRANSACTION HISTORY
export const getUserTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    
    if (type) query.type = type;
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('metadata.order', 'orderNumber service')
      .lean();

    const total = await Transaction.countDocuments(query);

    // Calculate statistics
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching transactions',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// ✅ CREATE NEW TRANSACTION
export const createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const transactionData = {
      ...req.body,
      user: req.user._id,
      status: 'pending'
    };

    // Validate required fields
    const requiredFields = ['type', 'amount'];
    const missingFields = requiredFields.filter(field => !transactionData[field]);
    
    if (missingFields.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate amount
    if (transactionData.amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Create transaction
    const transaction = new Transaction(transactionData);
    await transaction.save({ session });

    // Update user balance if transaction is deposit or withdrawal
    if (transactionData.type === 'deposit') {
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { balance: transactionData.amount } },
        { session }
      );
    } else if (transactionData.type === 'withdrawal') {
      // Check if user has sufficient balance
      const user = await User.findById(req.user._id).session(session);
      if (user.balance < transactionData.amount) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false,
          message: 'Insufficient balance for withdrawal'
        });
      }
      
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { balance: -transactionData.amount } },
        { session }
      );
    }

    // Commit transaction
    await session.commitTransaction();

    // Populate data
    await transaction.populate([
      { path: 'metadata.order', select: 'orderNumber service' },
      { path: 'user', select: 'name email username' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });

  } catch (error) {
    await session.abortTransaction();
    
    console.error('Error creating transaction:', error.message);
    
    let statusCode = 500;
    let errorMessage = 'Error creating transaction';
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Invalid transaction data';
    }
    
    res.status(statusCode).json({ 
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  } finally {
    await session.endSession();
  }
};

// ✅ GET CURRENT BALANCE
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate additional statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [monthlyStats, totalStats] = await Promise.all([
      // Monthly statistics
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            status: 'completed',
            createdAt: { $gte: currentMonth }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]),
      
      // Total statistics
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalDeposits: {
              $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
            },
            totalWithdrawals: {
              $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
            },
            totalTransactions: { $sum: 1 }
          }
        }
      ])
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('metadata.order', 'orderNumber')
      .select('type amount status createdAt')
      .lean();

    res.json({
      success: true,
      data: {
        balance: user.balance || 0,
        monthlyStats: monthlyStats.reduce((acc, stat) => {
          acc[stat._id] = stat;
          return acc;
        }, {}),
        totalStats: totalStats[0] || {},
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error fetching balance:', error.message);
    
    res.status(500).json({ 
      success: false,
      message: 'Error fetching balance information',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
};

// ✅ UPDATE TRANSACTION STATUS
export const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID'
      });
    }

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid options: ${validStatuses.join(', ')}`
      });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify ownership
    if (transaction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this transaction'
      });
    }

    // Update transaction
    transaction.status = status;
    if (notes) {
      transaction.notes = transaction.notes ? `${transaction.notes}\n${notes}` : notes;
    }

    // If status changed to completed and it's a deposit, update user balance
    if (status === 'completed' && transaction.status !== 'completed' && transaction.type === 'deposit') {
      await User.findByIdAndUpdate(
        transaction.user,
        { $inc: { balance: transaction.amount } }
      );
    }

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: {
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        updatedAt: transaction.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating transaction:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error updating transaction status'
    });
  }
};

// ✅ COMPLETE EXPORT
export default {
  getUserTransactions,
  createTransaction,
  getBalance,
  updateTransactionStatus
};