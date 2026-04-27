// backend/routes/support.js - VERSIÓN COMPLETA CORREGIDA
import express from 'express';
import {
  createSupportTicket,
  getUserTickets,
  getUserTicketsFormatted,
  getTicket,
  addMessage,
  replyToTicket,
  updateTicketStatusUser,
  getTawkToWidget,
  debugTawkTo,
  getAdminTickets,
  adminReplyToTicket,
  updateTicketStatusAdmin,
  getTicketStatsAdmin,
  getSupportTickets,
  assignTicket,
  updateTicketStatus,
  resolveTicket
} from '../controllers/supportController.js';
import { auth, adminAuth } from '../middleware/authMiddleware.js';
import { validateTicketCreate, validateTicketReply, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// 🔹 IMPORTANTE: El middleware socketMiddleware ya se aplica en server.js
// No necesitamos aplicarlo aquí nuevamente

// 🔹 RUTAS PÚBLICAS/DEBUG
router.get('/debug-tawkto', auth, debugTawkTo);

// 🔹 RUTAS PARA USUARIOS
router.post('/tickets', auth, sanitizeInput, validateTicketCreate, createSupportTicket);
router.get('/tickets/my-tickets', auth, getUserTicketsFormatted); // ✅ Formato para frontend
router.get('/tickets', auth, getUserTickets); // ✅ Formato original
router.get('/tickets/:ticketId', auth, getTicket);
router.get('/tickets/:ticketId/tawkto', auth, getTawkToWidget);
router.post('/tickets/:ticketId/reply', auth, sanitizeInput, validateTicketReply, replyToTicket); // ✅ Principal
router.post('/tickets/:ticketId/messages', auth, sanitizeInput, validateTicketReply, addMessage); // ✅ Alternativa
router.put('/tickets/:ticketId/status', auth, updateTicketStatusUser);

// 🔹 RUTAS PARA ADMIN
router.get('/admin/tickets', adminAuth, getAdminTickets);
router.get('/admin/tickets/stats', adminAuth, getTicketStatsAdmin);
router.post('/admin/tickets/:ticketId/reply', adminAuth, sanitizeInput, validateTicketReply, adminReplyToTicket);
router.put('/admin/tickets/:ticketId/status', adminAuth, updateTicketStatusAdmin);

// 🔹 RUTAS EXISTENTES (compatibilidad)
router.get('/admin/support-tickets', adminAuth, getSupportTickets);
router.patch('/admin/tickets/:ticketId/assign', adminAuth, assignTicket);
router.patch('/admin/tickets/:ticketId/status-legacy', adminAuth, updateTicketStatus);
router.patch('/admin/tickets/:ticketId/resolve', adminAuth, resolveTicket);

export default router;