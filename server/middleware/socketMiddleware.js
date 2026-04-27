// backend/middleware/socketMiddleware.js - VERSIÓN DEFINITIVA

export const socketMiddleware = (io) => {
  return (req, res, next) => {
    if (!io) {
      console.warn('⚠️ Socket.io no inicializado en el middleware');
    }
    req.io = io;
    next();
  };
};

export const injectSocketIO = (io) => {
  return (req, res, next) => {
    if (io) {
      req.io = io;
      if (req.path.includes('/support') || req.path.includes('/tickets')) {
        req.ticketNamespace = io.of('/tickets');
      }
    }
    next();
  };
};