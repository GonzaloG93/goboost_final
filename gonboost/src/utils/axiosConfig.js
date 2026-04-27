// frontend/utils/axiosConfig.js - OPTIMIZADO PRODUCCIÓN
import axios from 'axios';

// ✅ URL desde variable de entorno o fallback a Render
const API_URL = import.meta.env.VITE_API_URL || 'https://gonboost-api.onrender.com/api';

// ✅ Determinar si estamos en desarrollo
const hostname = window.location.hostname;
const isDev = hostname === 'localhost' || 
              hostname === '127.0.0.1' || 
              /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);

console.log('🌐 API URL configurada:', API_URL);
console.log('🔧 Modo desarrollo:', isDev);

// Crear una instancia de axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000, // ✅ 20 segundos - Balance cold start + UX
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para cookies/sesiones
});

// INTERCEPTOR DE REQUEST
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener token de múltiples fuentes
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Logging en desarrollo
    if (isDev) {
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
      console.log(`⏱️ Timeout: ${config.timeout}ms`);
      console.log(`🔑 Token presente: ${!!token}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// INTERCEPTOR DE RESPONSE CON RETRY PARA COLD START
axiosInstance.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log(`✅ [${response.status}] ${response.config.url} (${response.config.timeout}ms timeout)`);
    }
    return response;
  },
  async (error) => {
    const { response, config } = error;
    
    // ✅ RETRY AUTOMÁTICO para timeouts (cold start de Render)
    if (error.code === 'ECONNABORTED' && !config._retry) {
      config._retry = true;
      if (isDev) {
        console.warn('🔄 Reintentando petición (posible cold start)...');
      }
      // Aumentar timeout para el reintento
      config.timeout = 30000;
      return axiosInstance(config);
    }
    
    // Siempre mostrar errores en desarrollo
    if (isDev) {
      console.group(`❌ Error en ${config?.url || 'URL desconocida'}`);
      
      if (error.code === 'ECONNABORTED') {
        console.error(`⏱️ TIMEOUT EXCEDIDO: ${config?.timeout}ms`);
        console.error('💡 La operación tomó demasiado tiempo (posible cold start)');
        console.error('💡 Se realizó un reintento automático');
      }
      else if (response?.status === 404) {
        console.error(`🔍 404 - Ruta no encontrada: ${config?.baseURL}${config?.url}`);
        console.error('💡 Verifica que la ruta exista en el backend');
        
        if (config?.url?.includes('/paypal')) {
          console.error('💡 Para PayPal, asegúrate que:');
          console.error('   1. El backend tenga routes/payments.js');
          console.error('   2. La ruta esté registrada como: router.post("/paypal/create", ...)');
          console.error('   3. El backend se haya reiniciado');
        }
      } 
      else if (response?.status === 401) {
        console.warn('🔒 401 - No autorizado');
        console.warn('💡 Token puede estar expirado o inválido');
        
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login?session=expired';
          }, 1500);
        }
      }
      else if (response?.status === 500) {
        console.error('💥 500 - Error interno del servidor');
        console.error('💡 Revisa los logs del backend');
      }
      else if (!response) {
        console.error('🌐 Error de red:', error.message);
        console.error('💡 Verifica:');
        console.error(`   1. Backend corriendo en: ${config?.baseURL}`);
        console.error('   2. CORS configurado en el backend');
      }
      
      console.groupEnd();
    }

    return Promise.reject(error);
  }
);

// ✅ PayPal con timeout extendido
export const createPayPalOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post('/payments/paypal/create', orderData, {
      timeout: 45000 // 45 segundos para PayPal (cold start + API externa)
    });
    return response.data;
  } catch (error) {
    console.error('Error en PayPal:', error);
    throw error;
  }
};

// ✅ Health check con timeout corto (si no responde en 5s, está dormido)
export const checkBackendHealth = async () => {
  try {
    const response = await axiosInstance.get('/health', { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Backend no responde:', error.message);
    return { status: 'error', message: 'Backend no disponible' };
  }
};

export default axiosInstance;