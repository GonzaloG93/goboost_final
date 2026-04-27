// backend/routes/liveChat.js
import express from 'express';
import {
  getActiveChats,
  getChatHistory,
  getChat,
  deleteChat
} from '../controllers/liveChatController.js';
import { protect, authorize } from '../middleware/authMiddleware.js'; // ✅ authMiddleware

const router = express.Router();

// Todas las rutas protegidas
router.use(protect);

// Usuarios pueden ver su historial de chats
router.get('/my-chats', getChatHistory);

// Agentes y admin pueden ver chats activos
router.get('/active', authorize('agent', 'admin'), getActiveChats);

// Obtener chat específico
router.get('/:roomId', getChat);

// Solo admin puede eliminar chats
router.delete('/:roomId', authorize('admin'), deleteChat);

export default router;