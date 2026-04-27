// backend/routes/analytics.js (TEMPORAL SIN AUTH)
import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import Review from '../models/Review.js';

const router = express.Router();

// ✅ DASHBOARD PRINCIPAL DE ANALYTICS (sin auth temporal)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Estadísticas principales
    const [
      totalUsers,
      totalBoosters,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      averageRating
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'booster' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
      Transaction.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { status: 'completed', createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Review.aggregate([{ $group: { _id: null, average: { $avg: '$rating' } } }])
    ]);

    // Órdenes por estado
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Revenue mensual (últimos 6 meses)
    const monthlyRevenueChart = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 6, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Boosters top
    const topBoosters = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$assignedBooster', completedOrders: { $sum: 1 } } },
      { $sort: { completedOrders: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'boosterInfo'
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers: totalUsers,
        totalBoosters: totalBoosters,
        totalOrders: totalOrders,
        completedOrders: completedOrders,
        pendingOrders: pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        yearlyRevenue: yearlyRevenue[0]?.total || 0,
        averageRating: averageRating[0]?.average || 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(2) : 0
      },
      ordersByStatus: ordersByStatus,
      monthlyRevenue: monthlyRevenueChart,
      topBoosters: topBoosters
    });

  } catch (error) {
    console.error('Error en analytics dashboard:', error);
    res.status(500).json({ error: 'Error obteniendo analytics' });
  }
});

// ✅ REPORTES DETALLADOS (sin auth temporal)
router.get('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    switch (type) {
      case 'financial':
        const financialData = await Transaction.aggregate([
          { $match: { ...dateFilter, status: 'completed' } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 },
              averageTransaction: { $avg: '$amount' }
            }
          }
        ]);
        res.json(financialData[0] || {});
        break;

      case 'user-growth':
        const userGrowth = await User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              newUsers: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        res.json(userGrowth);
        break;

      case 'order-metrics':
        const orderMetrics = await Order.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              averageCompletionTime: { $avg: '$completionTime' }
            }
          }
        ]);
        res.json(orderMetrics);
        break;

      default:
        res.status(400).json({ error: 'Tipo de reporte no válido' });
    }
  } catch (error) {
    console.error('Error en reportes:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
});

export default router;