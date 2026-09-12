// backend/middleware/cors.js - VERSIÓN FINAL UNIFICADA

// Exportamos la lista para que socket.js también pueda usarla
export const allowedOrigins = [
  // Desarrollo
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  
  // Producción (Dominios oficiales)
  'https://gonboost.com',
  'https://www.gonboost.com',
  'https://admin.gonboost.com',
  'https://staging.gonboost.com',
  
  // Producción (URLs de Render - CLAVE PARA EVITAR EL ERROR 400)
  'https://gonboost-frontend.onrender.com',
  'https://gonboost.onrender.com',
  'https://gonboost-api.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development';
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para origen: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-ID',
    'X-Socket-ID',
    'X-Debug',
    'X-Order-Id', 
    'X-User-Id'
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Pagination'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

export default corsOptions;