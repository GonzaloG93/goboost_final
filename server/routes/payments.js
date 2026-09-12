import express from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import PaymentProof from '../models/PaymentProof.js';
import { auth } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

console.log('🔄 Payment routes loaded successfully');
console.log('✅ POST /payments/proof/upload está disponible');

router.get('/test-public', (req, res) => {
  res.json({
    success: true,
    message: '✅ Ruta de payments funciona correctamente',
    timestamp: new Date().toISOString(),
    endpoint: '/api/payments/test-public'
  });
});

const verifyOrderOwnership = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'ORDER_ID_REQUIRED',
        message: 'Se requiere ID de orden'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ORDER_ID',
        message: 'Formato de ID de orden inválido'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Orden no encontrada'
      });
    }
    
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No tienes permiso para acceder a esta orden'
      });
    }
    
    req.order = order;
    next();
  } catch (error) {
    console.error('❌ Error en verifyOrderOwnership:', error);
    res.status(500).json({
      success: false,
      error: 'OWNERSHIP_VERIFICATION_ERROR',
      message: 'Error verificando permisos'
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'ADMIN_REQUIRED',
      message: 'Se requieren privilegios de administrador'
    });
  }
  next();
};

router.get('/status/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ORDER_ID',
        message: 'Formato de ID de orden inválido'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Orden no encontrada'
      });
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'No tienes permiso para ver esta orden'
      });
    }
    
    const payment = await Payment.findOne({ order: orderId }).sort({ createdAt: -1 });
    const paymentProof = await PaymentProof.findOne({ orderId: orderId }).sort({ createdAt: -1 });
    
    let currentStatus = order.paymentStatus || 'pending';
    if (payment) currentStatus = payment.status;
    
    res.json({
      success: true,
      data: {
        order: {
          id: order._id,
          number: order.orderNumber,
          total: order.totalPrice,
          currency: order.currency || 'USD'
        },
        payment: payment ? {
          status: payment.status,
          method: payment.provider,
          amount: payment.amount,
          date: payment.updatedAt
        } : null,
        paymentProof: paymentProof ? {
          id: paymentProof._id,
          imageUrl: paymentProof.imageUrl,
          description: paymentProof.description,
          transactionHash: paymentProof.transactionHash,
          status: paymentProof.status,
          createdAt: paymentProof.createdAt
        } : null,
        currentStatus: currentStatus
      },
      message: `Estado: ${currentStatus}`
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'STATUS_CHECK_ERROR',
      message: 'Error verificando estado de pago'
    });
  }
});

router.get('/methods', auth, async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'binance',
        name: 'Binance Pay',
        description: 'Pago con criptomonedas (USDT, BTC, ETH, BNB)',
        enabled: true,
        type: 'manual',
        currencies: ['USDT', 'BTC', 'ETH', 'BNB'],
        fees: { percentage: 0, fixed: 0 },
        features: ['crypto', 'low_fees', 'manual_verification'],
        icon: 'binance',
        instructions: 'Realiza la transferencia y sube el comprobante para verificación'
      },
      {
        id: 'kofi',
        name: 'Ko-fi (Tarjeta)',
        description: 'Pago con Tarjeta de Crédito/Débito vía Ko-fi',
        enabled: true,
        type: 'manual',
        currencies: ['USD'],
        fees: { percentage: 0, fixed: 0 },
        features: ['card', 'manual_verification'],
        icon: 'kofi',
        instructions: 'Realiza el pago en Ko-fi por el monto exacto y sube el comprobante para verificación'
      }
    ];

    res.json({
      success: true,
      data: paymentMethods,
      message: `${paymentMethods.length} métodos de pago disponibles`
    });

  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'METHODS_FETCH_ERROR',
      message: 'Error obteniendo métodos de pago'
    });
  }
});

router.post('/binance/create', auth, verifyOrderOwnership, async (req, res) => {
  try {
    if (req.order.paymentStatus === 'paid' || req.order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'ORDER_ALREADY_PAID',
        message: 'Esta orden ya ha sido pagada'
      });
    }

    const paymentId = `BIN_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const payment = new Payment({
      order: req.order._id,
      user: req.user._id,
      provider: 'binance',
      amount: req.order.totalPrice,
      currency: 'USD',
      providerPaymentId: paymentId,
      status: 'pending',
      metadata: {
        type: 'crypto_payment',
        paymentId,
        requiresVerification: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    await payment.save();
    
    req.order.paymentMethod = 'binance';
    req.order.paymentReference = payment._id;
    await req.order.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        binanceId: paymentId,
        amount: { usd: req.order.totalPrice },
        verificationRequired: true,
        nextSteps: ['Realiza la transferencia', 'Sube el comprobante']
      },
      message: 'Pago Binance creado. Sube el comprobante para completar.'
    });

  } catch (error) {
    console.error('❌ Error creating Binance payment:', error);
    res.status(500).json({
      success: false,
      error: 'BINANCE_CREATE_ERROR',
      message: 'Error creando pago Binance'
    });
  }
});

router.post('/proof/upload', auth, async (req, res) => {
  try {
    const { orderId, imageUrl, description, transactionHash, paymentMethod } = req.body;
    const provider = ['binance', 'kofi'].includes(paymentMethod) ? paymentMethod : 'binance';
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'ORDER_ID_REQUIRED',
        message: 'Order ID is required'
      });
    }
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'IMAGE_REQUIRED',
        message: 'Payment proof image is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ORDER_ID',
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You do not have permission to upload proof for this order'
      });
    }

    if (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'ORDER_ALREADY_PAID',
        message: 'This order has already been paid'
      });
    }

    const proof = new PaymentProof({
      orderId: order._id,
      userId: req.user._id,
      imageUrl: imageUrl,
      description: description || '',
      transactionHash: transactionHash || '',
      status: 'pending'
    });

    await proof.save();

    let payment = await Payment.findOne({ order: order._id });
    
    if (!payment) {
      payment = new Payment({
        order: order._id,
        user: req.user._id,
        provider: provider,
        amount: order.totalPrice,
        currency: 'USD',
        status: 'pending_verification',
        metadata: {
          proofId: proof._id,
          proofSubmittedAt: new Date()
        }
      });
      await payment.save();
      order.paymentReference = payment._id;
    } else {
      payment.metadata = payment.metadata || {};
      payment.metadata.proofId = proof._id;
      payment.metadata.proofSubmittedAt = new Date();
      payment.status = 'pending_verification';
      payment.provider = provider;
      await payment.save();
    }

    order.paymentStatus = 'pending_verification';
    order.paymentMethod = provider;
    await order.save();

    await order.addNote(
      `Comprobante de pago subido. Método: ${provider === 'kofi' ? 'Ko-fi' : 'Binance Pay'}. TX: ${transactionHash || 'N/A'}`,
      'system'
    );

    res.status(201).json({
      success: true,
      data: {
        proofId: proof._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: payment._id,
        status: 'pending_verification',
        paymentMethod: provider,
        imageUrl: proof.imageUrl,
        estimatedTime: '1-12 hours',
        supportContact: 'support@gonboost.com'
      },
      message: 'Payment proof received successfully. Our team will review it shortly.'
    });

  } catch (error) {
    console.error('❌ [PROOF/UPLOAD] ERROR:', error.message);
    res.status(500).json({
      success: false,
      error: 'PROOF_UPLOAD_ERROR',
      message: 'Error uploading payment proof: ' + error.message
    });
  }
});

router.get('/proof/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ORDER_ID',
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: 'Order not found'
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You do not have permission to view proofs for this order'
      });
    }

    const proofs = await PaymentProof.find({ orderId: orderId }).sort({ createdAt: -1 });
    const payment = await Payment.findOne({ order: orderId });
    
    const proofsWithPaymentId = proofs.map(proof => ({
      ...proof.toObject(),
      paymentId: payment?._id
    }));

    res.json({
      success: true,
      data: proofsWithPaymentId,
      message: `${proofs.length} proofs found`
    });

  } catch (error) {
    console.error('❌ Error fetching proofs:', error);
    res.status(500).json({
      success: false,
      error: 'PROOFS_FETCH_ERROR',
      message: 'Error fetching payment proofs'
    });
  }
});

router.post('/verify/:paymentId', auth, adminOnly, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body;
    
    const payment = await Payment.findById(paymentId).populate('order');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'PAYMENT_NOT_FOUND',
        message: 'Pago no encontrado'
      });
    }

    const allowedStatuses = ['completed', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: `Estado no válido. Use: ${allowedStatuses.join(', ')}`
      });
    }

    const oldStatus = payment.status;
    payment.status = status === 'completed' ? 'completed' : 'failed';
    payment.metadata = payment.metadata || {};
    payment.metadata.verifiedBy = req.user._id;
    payment.metadata.verifiedAt = new Date();
    payment.metadata.verificationNotes = notes;
    await payment.save();

    if (payment.metadata.proofId) {
      await PaymentProof.findByIdAndUpdate(payment.metadata.proofId, {
        status: status === 'completed' ? 'approved' : 'rejected',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: notes
      });
    }

    if (status === 'completed') {
      const order = await Order.findById(payment.order);
      order.paymentStatus = 'paid';
      order.status = 'paid';
      order.paidAt = new Date();
      order.paymentMethod = payment.provider;
      await order.save();
      
      await order.addNote(
        `Pago verificado y aprobado por admin. Método: ${payment.provider}`,
        'system'
      );
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        oldStatus,
        newStatus: payment.status,
        verifiedBy: req.user.username,
        verifiedAt: new Date()
      },
      message: `Pago ${status === 'completed' ? 'aprobado' : 'rechazado'} exitosamente`
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'VERIFICATION_ERROR',
      message: 'Error verificando pago'
    });
  }
});

router.get('/admin/list', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, provider } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (provider && provider !== 'all') query.provider = provider;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'username email')
        .populate('order', 'orderNumber totalPrice')
        .populate({ path: 'metadata.proofId', model: 'PaymentProof', select: 'imageUrl status' })
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      },
      message: `${payments.length} pagos encontrados`
    });

  } catch (error) {
    console.error('❌ Error listing payments:', error);
    res.status(500).json({
      success: false,
      error: 'PAYMENTS_LIST_ERROR',
      message: 'Error obteniendo lista de pagos'
    });
  }
});

router.get('/admin/proofs/pending', auth, adminOnly, async (req, res) => {
  try {
    const pendingProofs = await PaymentProof.find({ status: 'pending' })
      .populate('userId', 'username email')
      .populate('orderId', 'orderNumber totalPrice paymentMethod')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingProofs,
      message: `${pendingProofs.length} comprobantes pendientes`
    });

  } catch (error) {
    console.error('❌ Error fetching pending proofs:', error);
    res.status(500).json({
      success: false,
      error: 'PENDING_PROOFS_ERROR',
      message: 'Error obteniendo comprobantes pendientes'
    });
  }
});

router.get('/user/history', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const payments = await Payment.find({ user: req.user._id })
      .populate('order', 'orderNumber serviceName totalPrice paymentMethod')
      .populate({ path: 'metadata.proofId', model: 'PaymentProof', select: 'imageUrl status' })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        payments,
        pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
      },
      message: `${payments.length} pagos encontrados`
    });

  } catch (error) {
    console.error('❌ Error getting user payments:', error);
    res.status(500).json({
      success: false,
      error: 'USER_PAYMENTS_ERROR',
      message: 'Error obteniendo historial de pagos'
    });
  }
});

router.get('/health', auth, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          payments: await Payment.countDocuments({}),
          proofs: await PaymentProof.countDocuments({}),
          status: 'connected'
        }
      }
    };

    res.json({ success: true, data: health, message: 'Sistema de pagos operativo' });

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ success: false, status: 'degraded' });
  }
});

export default router;