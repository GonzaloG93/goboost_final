// backend/routes/reviews.js (TEMPORAL SIN AUTH)
import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

const router = express.Router();

// ✅ OBTENER REVIEWS DE UN BOOSTER
router.get('/booster/:boosterId', async (req, res) => {
  try {
    const { boosterId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ booster: boosterId, status: 'active' })
      .populate('user', 'username avatar')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ booster: boosterId, status: 'active' });

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error obteniendo reviews:', error);
    res.status(500).json({ error: 'Error obteniendo reviews' });
  }
});

// ✅ CREAR NUEVA REVIEW (sin auth temporal)
router.post('/', async (req, res) => {
  try {
    const { orderId, rating, comment, categories, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Verificar que la orden existe
    const order = await Order.findOne({
      _id: orderId,
      status: 'completed'
    });

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada o no completada' });
    }

    // Verificar que no existe ya una review para esta orden
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(400).json({ error: 'Ya existe una review para esta orden' });
    }

    // Crear la review
    const review = new Review({
      order: orderId,
      user: userId,
      booster: order.assignedBooster,
      rating,
      comment,
      categories
    });

    await review.save();

    // Popular la review para la respuesta
    await review.populate('user', 'username avatar');
    await review.populate('booster', 'username');

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creando review:', error);
    res.status(500).json({ error: 'Error creando review' });
  }
});

// ✅ OBTENER STATS DE REVIEWS DE UN BOOSTER
router.get('/booster/:boosterId/stats', async (req, res) => {
  try {
    const { boosterId } = req.params;

    const stats = await Review.aggregate([
      { $match: { booster: boosterId, status: 'active' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Calcular distribución de ratings
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }

    const result = {
      averageRating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
      distribution
    };

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo stats de reviews:', error);
    res.status(500).json({ error: 'Error obteniendo stats' });
  }
});

// ✅ ELIMINAR REVIEW (sin auth temporal)
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, isAdmin } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review no encontrada' });
    }

    // Verificar permisos temporal
    if (!isAdmin && review.user.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta review' });
    }

    // En lugar de eliminar, marcamos como removida
    review.status = 'removed';
    await review.save();

    res.json({ message: 'Review eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando review:', error);
    res.status(500).json({ error: 'Error eliminando review' });
  }
});

// ✅ REPORTAR REVIEW (sin auth temporal)
router.post('/:reviewId/report', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review no encontrada' });
    }

    // Marcar review como reportada
    review.status = 'flagged';
    await review.save();

    res.json({ message: 'Review reportada correctamente' });
  } catch (error) {
    console.error('Error reportando review:', error);
    res.status(500).json({ error: 'Error reportando review' });
  }
});

export default router;