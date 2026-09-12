// src/services/api.js - VERSIÓN EXPANDIDA
const API_BASE = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // Services - Nuevos endpoints
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

  // Categories & Games
  async getCategories() {
    return this.request('/categories');
  }

  async getGames() {
    return this.request('/games');
  }

  // Orders
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

  // Auth
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

  // Test connection
  async testConnection() {
    return this.request('/test-frontend');
  }
}

export default new ApiService();