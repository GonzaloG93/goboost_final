
import User from '../models/User.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Obtener estadísticas del usuario - VERSIÓN SIMPLIFICADA Y ROBUSTA
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📊 Obteniendo stats para usuario:', userId);

    // Verificar que el userId es válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }

    // Método más simple y confiable sin aggregate
    const totalOrders = await Order.countDocuments({ customer: userId });
    const completedOrders = await Order.countDocuments({ 
      customer: userId, 
      status: 'completed' 
    });
    
    // Calcular total gastado
    const orders = await Order.find({ customer: userId }).select('totalPrice');
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Calcular rating promedio
    const ratedOrders = await Order.find({ 
      customer: userId, 
      customerRating: { $exists: true, $ne: null } 
    }).select('customerRating');
    
    const averageRating = ratedOrders.length > 0 
      ? ratedOrders.reduce((sum, order) => sum + order.customerRating, 0) / ratedOrders.length
      : 0;

    console.log('📈 Stats calculados:', {
      totalOrders,
      completedOrders, 
      totalSpent,
      averageRating
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        totalSpent,
        averageRating,
        user: {
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
          balance: req.user.balance || 0,
          rating: req.user.rating || 0,
          createdAt: req.user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en getUserStats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al obtener estadísticas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mantener las otras funciones igual...
// Actualizar perfil de usuario
export const updateProfile = async (req, res) => {
  try {
    const { username, games } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        username,
        games: games || []
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'El nombre de usuario ya existe' 
      });
    }
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Obtener todos los usuarios (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching users' 
    });
  }
};

// Actualizar rol de usuario (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['customer', 'booster', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Rol inválido' 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};
