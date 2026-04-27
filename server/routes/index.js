// backend/routes/index.js - VERSIÓN COMPLETA ACTUALIZADA CORREGIDA
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.js';
import boostRoutes from './boosts.js';
import ordersRoutes from './orders.js';
import paymentsRoutes from './payments.js';
import usersRoutes from './users.js';
import boostersRoutes from './boosters.js';
import notificationsRoutes from './notifications.js';
import transactionsRoutes from './transactions.js';
import supportRoutes from './support.js';
import liveChatRoutes from './livechat.js';
import adminRoutes from './admin.js';
import reviewsRoutes from './reviews.js';
import analyticsRoutes from './analytics.js';
import seoRoutes from './seo.js';
import termsRoutes from './termsRoutes.js';
// NOTA: privacyRoutes NO se importa aquí - se monta directamente en server.js

const router = express.Router();

// ✅ FUNCIÓN AUXILIAR PARA ESTADO DE BASE DE DATOS
const getDatabaseStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

// ✅ RUTA PRINCIPAL DE API - CORREGIDA
router.get('/', (req, res) => {
  res.json({
    message: '🎮 Boostify API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      main: '/api',
      health: '/health',
      terms: '/api/terms/terms-of-service',
      privacy: '/api/privacy-policy', // ✅ RUTA DIRECTA (se monta en server.js)
      support: {
        user: '/api/support/tickets',
        admin: '/api/support/admin/tickets'
      },
      admin: '/api/admin/*',
      payments: '/api/payments/*'
    },
    services: {
      database: getDatabaseStatus(),
      support: 'active',
      payments: 'active',
      terms: 'active',
      privacy: 'active' // ✅ AGREGADO
    }
  });
});

// ✅ HEALTH CHECK CORREGIDO
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    memory: {
      used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
    },
    environment: process.env.NODE_ENV || 'development',
    database: getDatabaseStatus()
  };
  
  res.json(health);
});

// ✅ DEBUG DATABASE - CORREGIDO
router.get('/debug/database', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected',
        state: mongoose.connection.readyState
      });
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const mainCollections = collections.filter(c => 
      ['users', 'orders', 'tickets', 'services'].includes(c.name)
    );
    
    const counts = {};
    for (const collection of mainCollections) {
      try {
        counts[collection.name] = await db.collection(collection.name).countDocuments();
      } catch (error) {
        counts[collection.name] = 'error';
      }
    }
    
    res.json({
      database: db.databaseName,
      connectionState: mongoose.connection.readyState,
      collections: mainCollections.map(c => c.name),
      documentCounts: counts
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ USAR RUTAS CON PREFIJOS CORRECTOS
router.use('/auth', authRoutes);
router.use('/boosts', boostRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/users', usersRoutes);
router.use('/boosters', boostersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/support', supportRoutes);
router.use('/terms', termsRoutes);
// ❌ NO usamos router.use('/privacy', privacyRoutes) porque lo montamos directamente en server.js
router.use('/live-chat', liveChatRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/seo', seoRoutes);

// ✅ RUTA ESPECÍFICA PARA VERIFICAR SOPORTE
router.get('/debug/support', (req, res) => {
  res.json({
    support_routes: {
      user_tickets: 'GET /api/support/tickets',
      admin_tickets: 'GET /api/support/admin/tickets',
      create_ticket: 'POST /api/support/tickets',
      reply_ticket: 'POST /api/support/admin/tickets/:id/reply'
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// ✅ RUTA ESPECÍFICA PARA VERIFICAR TÉRMINOS Y PRIVACIDAD
router.get('/debug/policies', (req, res) => {
  res.json({
    policy_routes: {
      terms_of_service: 'GET /api/terms/terms-of-service',
      privacy_policy: 'GET /api/privacy-policy', // ✅ RUTA CORRECTA
      privacy_test: 'GET /api/privacy-policy/test' // ✅ RUTA DE PRUEBA
    },
    status: 'active',
    timestamp: new Date().toISOString(),
    note: 'Privacy policy route is mounted directly in server.js'
  });
});

export default router;