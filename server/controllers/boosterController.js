import Order from '../models/Order.js';
import User from '../models/User.js';

// Obtener estadísticas del booster
export const getBoosterStats = async (req, res) => {
  try {
    const boosterId = req.user._id;

    const stats = await Order.aggregate([
      { $match: { booster: boosterId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$totalPrice' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments({ booster: boosterId });
    const completedOrders = await Order.countDocuments({ 
      booster: boosterId, 
      status: 'completed' 
    });
    const activeOrders = await Order.countDocuments({ 
      booster: boosterId, 
      status: 'in_progress' 
    });

    // Calcular rating promedio
    const ratingStats = await Order.aggregate([
      { 
        $match: { 
          booster: boosterId, 
          customerRating: { $exists: true } 
        } 
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$customerRating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        activeOrders,
        averageRating: ratingStats[0]?.averageRating || 0,
        totalRatings: ratingStats[0]?.totalRatings || 0,
        statusBreakdown: stats,
        earnings: stats.find(s => s._id === 'completed')?.totalEarnings || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching booster stats' 
    });
  }
};

// Obtener historial de órdenes del booster
export const getBoosterOrderHistory = async (req, res) => {
  try {
    const boosterId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { booster: boosterId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('service')
      .populate('customer', 'username')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching order history' 
    });
  }
};

// Actualizar progreso de la orden
export const updateOrderProgress = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { progress, notes, completionProof } = req.body;

    const order = await Order.findOne({ 
      _id: orderId, 
      booster: req.user._id 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Orden no encontrada' 
      });
    }

    if (completionProof) {
      order.completionProof = completionProof;
    }

    await order.save();
    await order.populate('service');
    await order.populate('customer', 'username');

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};