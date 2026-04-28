// backend/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

console.log('🔄 Loading environment variables...');
dotenv.config();

import corsOptions from './middleware/cors.js';  // ✅ Ahora SÍ se usa
import { setupSocketIO } from './socket/socket.js';
import { socketMiddleware } from './middleware/socketMiddleware.js';

import apiRoutes from './routes/index.js';
import adminRoutes from './routes/admin.js';
import privacyRoutes from './routes/privacyRoutes.js';
import supportRoutes from './routes/support.js';
import sitemapRouter      from './routes/sitemap.js';
import sitemapIndexRouter from './routes/sitemapIndex.js';
import seoRoutes from './routes/seo.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ================= CORS — FUENTE ÚNICA =================
// ✅ FIX: usar corsOptions de cors.js, no una config inline duplicada
app.use(cors(corsOptions));

// Manejar preflight OPTIONS explícitamente (crucial para Socket.IO)
app.options('*', cors(corsOptions));

// ================= LOGGING =================
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('origin')}`);
    next();
  });
}

// ================= BODY PARSING =================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================= PRODUCCIÓN =================
if (isProduction) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  }));
  app.use(compression());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Demasiadas solicitudes, intente de nuevo más tarde' },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);
}

// ================= SOCKET.IO =================
const io = setupSocketIO(server);
app.use(socketMiddleware(io));

app.use('/api/support', (req, res, next) => {
  if (io) req.ticketNamespace = io.of('/tickets');
  next();
});

// ================= RUTAS =================
// ✅ FIX: separar rutas /api para evitar colisiones
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GonBoost API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: { health: '/health', api: '/api' }
  });
});

app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    status: 'healthy',
    service: 'GonBoost API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socketIO: !!req.io,
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
    }
  };
  if (mongoose.connection.readyState !== 1) {
    healthData.status = 'degraded';
    return res.status(503).json(healthData);
  }
  res.status(200).json(healthData);
});

// ✅ FIX: support ANTES de apiRoutes para evitar que /api catch-all lo tape
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/privacy-policy', privacyRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api', apiRoutes);  // general va último
app.use('/', sitemapRouter);
app.use('/', sitemapIndexRouter);

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json({ success: false, message: 'Error de base de datos', error: isProduction ? 'Database error' : err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Error de validación', errors: Object.values(err.errors).map(e => e.message) });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Error interno del servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ================= MONGODB =================
const connectDB = async () => {
  try {
    const options = {
      dbName: process.env.DB_NAME || 'boost-services',
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    };
    mongoose.connection.on('connected', () => console.log('✅ Mongoose connected to MongoDB'));
    mongoose.connection.on('error', (err) => console.error('❌ Mongoose connection error:', err));
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected');
      if (isProduction) setTimeout(connectDB, 5000);
    });
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    if (isProduction) { setTimeout(connectDB, 10000); } else { process.exit(1); }
    return false;
  }
};

// ================= START =================
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
      console.log(`📡 Socket.IO ready`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;
      if (error.code === 'EACCES') { console.error(`❌ Port ${PORT} requires elevated privileges`); process.exit(1); }
      if (error.code === 'EADDRINUSE') { console.error(`❌ Port ${PORT} is already in use`); process.exit(1); }
      throw error;
    });
  } catch (error) {
    console.error('❌ Critical error starting server:', error);
    process.exit(1);
  }
};

// ================= GRACEFUL SHUTDOWN =================
const gracefulShutdown = async (signal) => {
  console.log(`\n📴 ${signal} received. Shutting down...`);
  try {
    if (io) { console.log('🔌 Closing Socket.IO...'); io.close(); }
    await new Promise((resolve) => server.close(() => { console.log('🚫 HTTP server closed'); resolve(); }));
    await mongoose.connection.close(false);
    console.log('📦 MongoDB connection closed');
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => console.error('❌ Unhandled Rejection:', promise, reason));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (isProduction) { gracefulShutdown('uncaughtException'); } else { process.exit(1); }
});

startServer();

export { app, server, io };