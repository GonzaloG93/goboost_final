// frontend/src/api/ticketApi.js
import axiosInstance from '../utils/axiosConfig';

export const ticketApi = {
  // Obtener todos los tickets (admin)
  getTickets: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/admin/tickets', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo tickets:', error);
      throw error;
    }
  },

  // Obtener ticket por ID
  getTicketById: async (ticketId) => {
    try {
      const response = await axiosInstance.get(`/admin/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Actualizar estado del ticket
  updateTicketStatus: async (ticketId, status, notes = '') => {
    try {
      const response = await axiosInstance.put(`/admin/tickets/${ticketId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error(`Error actualizando estado del ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Responder a ticket
  replyToTicket: async (ticketId, message) => {
    try {
      const response = await axiosInstance.post(`/admin/tickets/${ticketId}/reply`, {
        message
      });
      return response.data;
    } catch (error) {
      console.error(`Error respondiendo al ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Asignar ticket
  assignTicket: async (ticketId, assignToUserId) => {
    try {
      const response = await axiosInstance.put(`/admin/tickets/${ticketId}/assign`, {
        assignToUserId
      });
      return response.data;
    } catch (error) {
      console.error(`Error asignando ticket ${ticketId}:`, error);
      throw error;
    }
  },

  // Obtener estadísticas de tickets
  getTicketStats: async () => {
    try {
      const response = await axiosInstance.get('/admin/tickets/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de tickets:', error);
      throw error;
    }
  }
};