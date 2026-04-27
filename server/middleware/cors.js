// backend/middleware/cors.js - VERSIÓN FINAL
export const allowedOrigins = [
  // Desarrollo
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  
  // Producción - Tus dominios
  'https://gonboost.com',
  'https://www.gonboost.com',
  
  // URLs de Render (respaldo)
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

export default corsOptions;