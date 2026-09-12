// backend/routes/reviews.js
import express from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { auth, adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// ENDPOINTS PÚBLICOS (para mostrar reviews en el sitio)
// ============================================

// ✅ Reviews de un SERVICIO (para la página de venta del servicio)
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ service: serviceId, status: 'active' })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ service: serviceId, status: 'active' });

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('❌ Error obteniendo reviews del servicio:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo reviews' });
  }
});

// ✅ Stats (promedio + cantidad) de un SERVICIO — para el widget de estrellas
router.get('/service/:serviceId/stats', async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, error: 'serviceId inválido' });
    }

    const stats = await Review.aggregate([
      { $match: { service: new mongoose.Types.ObjectId(serviceId), status: 'active' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      averageRating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0
    });
  } catch (error) {
    console.error('❌ Error obteniendo stats del servicio:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo stats' });
  }
});

// ✅ Reviews de un BOOSTER (para su perfil/dashboard)
router.get('/booster/:boosterId', async (req, res) => {
  try {
    const { boosterId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ booster: boosterId, status: 'active' })
      .populate('user', 'username')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ booster: boosterId, status: 'active' });

    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('❌ Error obteniendo reviews del booster:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo reviews' });
  }
});

router.get('/booster/:boosterId/stats', async (req, res) => {
  try {
    const { boosterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boosterId)) {
      return res.status(400).json({ success: false, error: 'boosterId inválido' });
    }

    const stats = await Review.aggregate([
      { $match: { booster: new mongoose.Types.ObjectId(boosterId), status: 'active' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: { $push: '$rating' }
        }
      }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach((rating) => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }

    res.json({
      success: true,
      averageRating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      distribution
    });
  } catch (error) {
    console.error('❌ Error obteniendo stats de reviews:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo stats' });
  }
});

// ============================================
// ENDPOINTS AUTENTICADOS
// ============================================

// ✅ ¿Ya dejé una review para esta orden? (para no mostrarle el form de nuevo)
router.get('/mine/order/:orderId', auth, async (req, res) => {
  try {
    const review = await Review.findOne({ order: req.params.orderId, user: req.user._id });
    res.json({ success: true, review: review || null });
  } catch (error) {
    console.error('❌ Error buscando review propia:', error);
    res.status(500).json({ success: false, error: 'Error buscando review' });
  }
});

// ✅ CREAR NUEVA REVIEW — el usuario sale del token, no del body
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, rating, comment, categories } = req.body;
    const userId = req.user._id;

    if (!orderId || !rating) {
      return res.status(400).json({ success: false, error: 'orderId y rating son requeridos' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'El rating debe ser entre 1 y 5' });
    }

    const order = await Order.findOne({ _id: orderId, status: 'completed' });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada o no completada' });
    }

    // Solo el dueño de la orden puede dejar la review (o un admin, por si acaso)
    const isOwner = order.user.toString() === userId.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'No podés dejar una review de una orden que no es tuya' });
    }

    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ success: false, error: 'Ya existe una review para esta orden' });
    }

    const review = new Review({
      order: orderId,
      service: order.service,
      user: userId,
      booster: order.booster || undefined,
      rating,
      comment,
      categories
    });

    await review.save();
    await review.populate('user', 'username');

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('❌ Error creando review:', error);
    res.status(500).json({ success: false, error: 'Error creando review' });
  }
});

// ✅ ELIMINAR REVIEW — solo el autor o un admin, verificado por token
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review no encontrada' });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'No tenés permisos para eliminar esta review' });
    }

    review.status = 'removed';
    await review.save();

    res.json({ success: true, message: 'Review eliminada correctamente' });
  } catch (error) {
    console.error('❌ Error eliminando review:', error);
    res.status(500).json({ success: false, error: 'Error eliminando review' });
  }
});

// ✅ REPORTAR REVIEW — requiere estar logueado (evita spam de reportes anónimos)
router.post('/:reviewId/report', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review no encontrada' });
    }

    review.status = 'flagged';
    await review.save();

    res.json({ success: true, message: 'Review reportada correctamente' });
  } catch (error) {
    console.error('❌ Error reportando review:', error);
    res.status(500).json({ success: false, error: 'Error reportando review' });
  }
});

// ✅ Admin: revisar reviews reportadas / reactivar una eliminada
router.put('/:reviewId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'flagged', 'removed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }

    const review = await Review.findByIdAndUpdate(req.params.reviewId, { status }, { new: true });
    if (!review) {
      return res.status(404).json({ success: false, error: 'Review no encontrada' });
    }

    res.json({ success: true, review });
  } catch (error) {
    console.error('❌ Error actualizando status de review:', error);
    res.status(500).json({ success: false, error: 'Error actualizando review' });
  }
});

export default router;
