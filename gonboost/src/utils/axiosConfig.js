// frontend/utils/axiosConfig.js
import axios from 'axios';

// ✅ Si estás en desarrollo usa localhost; si no, la API de producción
const API_URL = import.meta.env.DEV 
  ? 'http://localhost:5000/api' // Cambia 5000 si tu backend local usa otro puerto (ej. 4000)
  : (import.meta.env.VITE_API_URL || 'https://api.gonboost.com/api');

console.log('🌐 API conectada a:', API_URL);

// Instancia principal de Axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 
    'Content-Type': 'application/json' 
  },
  withCredentials: true, // Vital para que las cookies/sesiones funcionen con CORS
});

// Interceptor para añadir el Token en cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para debug de servicios
axiosInstance.interceptors.response.use(
  (response) => {
    // Si la petición es a boosts, logueamos para verificar que llegan datos
    if (response.config?.url?.includes('/boosts')) {
      console.log('✅ Datos de servicios recibidos:', response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ Error en la API:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// Helper para el Health Check
export const checkBackendHealth = async () => {
  try {
    const healthUrl = API_URL.replace('/api', '/health');
    const response = await axios.get(healthUrl, { timeout: 5000 });
    return response.data;
  } catch (error) {
    console.error('Healthcheck failed:', error);
    throw error;
  }
};

export default axiosInstance;