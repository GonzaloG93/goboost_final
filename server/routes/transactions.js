// routes/transactions.js - UPDATED WITH ADDITIONAL ENDPOINTS
import express from 'express';
import {
  getUserTransactions,
  createTransaction,
  getBalance,
  updateTransactionStatus
} from '../controllers/transactionController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user transactions with filters
router.get('/', auth, getUserTransactions);

// Get current balance with statistics
router.get('/balance', auth, getBalance);

// Create new transaction (used internally by payment system)
router.post('/', auth, createTransaction);

// Update transaction status
router.put('/:id/status', auth, updateTransactionStatus);

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findById(id)
      .populate('metadata.order')
      .populate('user', 'name email username');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    // Verify ownership or admin
    if (transaction.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta transacción'
      });
    }

    res.json({
      success: true,
      data: transaction,
      message: 'Transacción obtenida exitosamente'
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacción',
      error: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const stats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          status: 'completed'
        }
      },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalDeposits: {
                  $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] }
                },
                totalWithdrawals: {
                  $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
                },
                totalPayments: {
                  $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] }
                },
                totalTransactions: { $sum: 1 }
              }
            }
          ],
          monthlyStats: [
            {
              $match: {
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
          ],
          weeklyStats: [
            {
              $match: {
                createdAt: { 
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0]?.totalStats[0] || {},
        monthly: stats[0]?.monthlyStats || [],
        weekly: stats[0]?.weeklyStats || [],
        user: {
          balance: req.user.balance || 0
        }
      },
      message: 'Estadísticas obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// Export CSV of transactions
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query = { user: req.user._id };
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('metadata.order', 'orderNumber')
      .lean();

    // Create CSV headers
    const headers = [
      'Fecha',
      'Tipo',
      'Descripción',
      'Monto',
      'Estado',
      'Orden',
      'Método de Pago'
    ];

    // Create CSV rows
    const rows = transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString(),
      t.type,
      t.description || '',
      `$${t.amount.toFixed(2)}`,
      t.status,
      t.metadata?.order?.orderNumber || '',
      t.metadata?.paymentMethod || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando transacciones',
      error: error.message
    });
  }
});

// Get transactions for specific order
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const transactions = await Transaction.find({
      user: req.user._id,
      'metadata.order': orderId
    })
    .sort({ createdAt: -1 })
    .populate('metadata.order', 'orderNumber totalPrice');
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
      message: `${transactions.length} transacciones encontradas para esta orden`
    });
  } catch (error) {
    console.error('Error getting order transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo transacciones de la orden',
      error: error.message
    });
  }
});

export default router;