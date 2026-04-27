// src/services/api.js - CORREGIDO PARA PRODUCCIÓN
import axiosInstance from '../utils/axiosConfig';

class ApiService {
  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`🔄 API Call: ${options.method || 'GET'} ${endpoint}`);

    try {
      const response = await axiosInstance({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : undefined,
        ...config,
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  async getHealth() {
    return this.request('/health');
  }

  async getServices(category = null, game = null) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (game) params.append('game', game);
    return this.request(`/services?${params.toString()}`);
  }

  async getServiceById(id) {
    return this.request(`/services/${id}`);
  }

  async getServiceBySlug(slug) {
    return this.request(`/services/slug/${slug}`);
  }

  async getCategories() {
    return this.request('/categories');
  }

  async getGames() {
    return this.request('/games');
  }

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getUserOrders() {
    return this.request('/orders/my-orders');
  }

  async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async testConnection() {
    return this.request('/test-frontend');
  }
}

export default new ApiService();