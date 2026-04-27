// backend/routes/chat.js - DEJAR COMENTADO POR AHORA
/*
import express from 'express';
import {
  getOrderChat,
  sendMessage,
  markAsRead
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener historial de chat de una orden
router.get('/:orderId', protect, getOrderChat);

// Enviar mensaje
router.post('/:orderId/messages', protect, sendMessage);

// Marcar mensajes como leídos
router.patch('/:orderId/read', protect, markAsRead);

export default router;
*/