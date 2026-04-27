// controllers/orderController.js - VERSIÓN COMPLETA FINAL CORREGIDA
import Order from '../models/Order.js';
import BoostService from '../models/BoostService.js';
import pricingCalculator from '../utils/pricingCalculator.js';
import mongoose from 'mongoose';

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

const serviceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCachedService = async (serviceId) => {
  const now = Date.now();
  const cached = serviceCache.get(serviceId);
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  const service = await BoostService.findById(serviceId);
  if (service) {
    serviceCache.set(serviceId, {
      data: service,
      timestamp: now
    });
  }
  
  return service;
};

// ============================================
// CALCULADORA DE PRECIO CORREGIDA
// ============================================
const calculateServicePrice = (service, gameDetails) => {
  // 1. PRIORIDAD MÁXIMA: Si el servicio tiene basePrice en la DB, lo usamos
  if (service.basePrice && service.basePrice > 0) {
    console.log(`💰 Usando basePrice de DB (${service.serviceType}): $${service.basePrice}`);
    return service.basePrice;
  }
  
  // 2. Si es un pack y por alguna razón no tiene basePrice, usamos el mapeo actualizado
  if (service.serviceType?.includes('_pack')) {
    const packPrices = {
      // Diablo 4 - CORREGIDO
      'd4_starter_pack': 60,
      'd4_endgame_pack': 300,
      
      // Path of Exile - CORREGIDO
      'poe_starter_pack': 60,
      'poe_endgame_pack': 300,
      'poe2_starter_pack': 60,
      'poe2_endgame_pack': 300,
      
      // Diablo 3
      'd3_starter_pack': 45,
      'd3_endgame_pack': 95,
      
      // Diablo 2
      'd2_starter_pack': 40,
      'd2_endgame_pack': 90,
      
      // Diablo Immortal
      'immortal_starter_pack': 35,
      'immortal_endgame_pack': 85,
      
      // WoW
      'wow_starter_pack': 50,
      'wow_endgame_pack': 110,
      'classic_starter_pack': 45,
      'classic_endgame_pack': 100,
      
      // Dune
      'dune_starter_pack': 50,
      'dune_endgame_pack': 120,
      
      // Last Epoch
      'last_epoch_starter_pack': 45,
      'last_epoch_endgame_pack': 100
    };
    const price = packPrices[service.serviceType] || 60;
    console.log(`📦 Pack ${service.serviceType} - Precio por defecto: $${price}`);
    return price;
  }
  
  // 3. Variable leveling
  if (service.serviceType === 'variable_leveling') {
    const price = pricingCalculator.calculatePrice(
      service.serviceType,
      {
        currentLevel: gameDetails?.currentLevel || 1,
        desiredLevel: gameDetails?.desiredLevel || 100
      },
      service.game,
      {}
    );
    console.log(`📊 Variable leveling calculado: $${price}`);
    return price;
  }
  
  // 4. Otros servicios
  const price = pricingCalculator.calculatePrice(
    service.serviceType,
    { basePrice: service.basePrice },
    service.game,
    {}
  );
  
  console.log(`💰 Precio calculado para ${service.serviceType}: $${price}`);
  return price;
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id)
      .populate('service', 'name game serviceType basePrice estimatedTime')
      .populate('user', 'name email username')
      .populate('booster', 'name email username')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const userId = req.user._id.toString();
    const isOwner = order.user?._id?.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    const isBooster = req.user.role === 'booster' && 
                     order.booster?._id?.toString() === userId;

    if (!isOwner && !isAdmin && !isBooster) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error getting order:', error.message);
    
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { service: serviceId, gameDetails, totalPrice, priceBreakdown } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(serviceId)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID'
      });
    }

    const service = await getCachedService(serviceId);
    if (!service) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.available || !service.isActive) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'This service is currently unavailable'
      });
    }

    const calculatedPrice = calculateServicePrice(service, gameDetails);
    const quantity = gameDetails?.quantity || 1;
    const finalCalculatedPrice = calculatedPrice * quantity;
    
    console.log('🔍 Validación de precio:', {
      serviceType: service.serviceType,
      serviceBasePrice: service.basePrice,
      calculatedPrice,
      quantity,
      finalCalculatedPrice,
      clientSentPrice: totalPrice
    });

    let finalPrice = finalCalculatedPrice;
    
    if (totalPrice !== undefined && totalPrice !== null) {
      const priceDifference = Math.abs(totalPrice - finalCalculatedPrice);
      const tolerance = finalCalculatedPrice * 0.01; // 1% de tolerancia
      
      if (priceDifference > tolerance && priceDifference > 1) {
        console.warn(`⚠️ Precio manipulado detectado! Cliente: $${totalPrice}, Calculado: $${finalCalculatedPrice}`);
        
        if (process.env.NODE_ENV === 'production') {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Invalid price detected. Please refresh and try again.'
          });
        }
        
        console.log('🔧 Desarrollo: Usando precio calculado del servidor');
        finalPrice = finalCalculatedPrice;
      } else {
        finalPrice = totalPrice;
      }
    }

    if (finalPrice <= 0 || finalPrice > 10000) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid price. Must be between $1 and $10,000'
      });
    }

    const requiredFields = ['accountName', 'password', 'gameUsername', 'server'];
    const missingFields = requiredFields.filter(field => !gameDetails?.[field]);
    
    if (missingFields.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${(orderCount + 1).toString().padStart(4, '0')}`;

    const orderData = {
      user: userId,
      service: serviceId,
      orderNumber,
      gameDetails: {
        game: service.game,
        serviceType: service.serviceType,
        accountName: gameDetails.accountName,
        password: gameDetails.password,
        gameUsername: gameDetails.gameUsername,
        server: gameDetails.server,
        region: gameDetails.server,
        notes: gameDetails.notes || '',
        quantity: quantity,
        currentLevel: gameDetails.currentLevel || 1,
        desiredLevel: gameDetails.desiredLevel || 50,
        focusAreas: gameDetails.focusAreas || []
      },
      totalPrice: parseFloat(finalPrice.toFixed(2)),
      priceBreakdown: priceBreakdown || [{
        item: service.name || service.serviceType,
        amount: finalPrice,
        isTotal: true
      }],
      status: 'pending',
      paymentStatus: 'pending'
    };

    const order = new Order(orderData);
    await order.save({ session });

    await order.populate([
      { path: 'service', select: 'name game serviceType basePrice estimatedTime' },
      { path: 'user', select: 'name email username' }
    ]);

    await session.commitTransaction();

    const safeOrder = order.toObject();
    if (safeOrder.gameDetails?.password) {
      safeOrder.gameDetails.password = '••••••••';
    }

    console.log(`✅ Orden creada exitosamente: ${orderNumber} - $${finalPrice}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: safeOrder
    });

  } catch (error) {
    await session.abortTransaction();
    
    console.error('❌ Error creating order:', error.message);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error while creating order';
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Invalid order data';
    } else if (error.name === 'MongoError' && error.code === 11000) {
      statusCode = 409;
      errorMessage = 'Order already exists';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { 
        error: error.message,
        stack: error.stack 
      })
    });
    
  } finally {
    await session.endSession();
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: userId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('service', 'name game serviceType basePrice')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);
    
    const safeOrders = orders.map(order => {
      if (order.gameDetails?.password) {
        order.gameDetails.password = '••••••••';
      }
      return order;
    });
    
    res.json({
      success: true,
      data: {
        orders: safeOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting user orders:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const validStatuses = ['pending', 'paid', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Options: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isBooster = req.user.role === 'booster' && order.booster?.toString() === req.user._id.toString();
    
    if (!isOwner && !isAdmin && !isBooster) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this order'
      });
    }

    order.status = status;
    if (notes) {
      order.notes = order.notes ? `${order.notes}\n${notes}` : notes;
    }
    
    if (status === 'completed') {
      order.completedAt = new Date();
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
    }
    
    await order.save();

    res.json({
      success: true,
      message: `Order ${status} successfully`,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this order'
      });
    }

    if (order.status !== 'pending' && order.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an ${order.status} order`
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by customer';
    order.paymentStatus = 'cancelled';
    
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Error cancelling order:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('service', 'name game serviceType basePrice')
        .populate('user', 'name email username')
        .populate('booster', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);
    
    const safeOrders = orders.map(order => {
      if (order.gameDetails?.password) {
        order.gameDetails.password = '••••••••';
      }
      return order;
    });
    
    res.json({
      success: true,
      data: {
        orders: safeOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting all orders:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  getOrderById,
  createOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
};