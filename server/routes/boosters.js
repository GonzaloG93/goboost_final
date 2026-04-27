import express from 'express';
import { 
  getBoosterStats, 
  getBoosterOrderHistory, 
  updateOrderProgress 
} from '../controllers/boosterController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener estadísticas del booster
router.get('/stats', auth, getBoosterStats);

// Obtener historial de órdenes
router.get('/orders', auth, getBoosterOrderHistory);

// Actualizar progreso de orden
router.patch('/orders/:orderId/progress', auth, updateOrderProgress);

export default router;