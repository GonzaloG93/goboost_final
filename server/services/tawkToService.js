// backend/services/tawkToService.js - NUEVO SERVICIO PARA TAWK.TO
import axios from 'axios';

class TawkToService {
  constructor() {
    this.propertyId = process.env.TAWKTO_PROPERTY_ID;
    this.widgetId = process.env.TAWKTO_WIDGET_ID;
    this.apiKey = process.env.TAWKTO_API_KEY;
    this.baseURL = 'https://api.tawk.to/v1';
  }

  // Verificar si la configuración está disponible
  isConfigured() {
    return !!(this.propertyId && this.widgetId && this.apiKey);
  }

  // Crear contacto/ticket en Tawk.to
  async createTicket(ticketData, userData) {
    try {
      if (!this.isConfigured()) {
        console.warn('⚠️ Tawk.to no configurado - saltando integración');
        return null;
      }

      console.log('🔄 Enviando ticket a Tawk.to:', {
        ticket: ticketData.ticketNumber,
        usuario: userData.email
      });

      // 1. Primero buscar o crear el contacto
      const contact = await this.findOrCreateContact(userData, ticketData);
      
      if (!contact) {
        console.error('❌ No se pudo crear/obtener contacto en Tawk.to');
        return null;
      }

      // 2. Crear ticket/conversación
      const ticketPayload = {
        contactId: contact.id,
        subject: ticketData.subject,
        message: ticketData.description,
        properties: {
          ticketNumber: ticketData.ticketNumber,
          category: ticketData.category,
          priority: ticketData.priority,
          status: 'open',
          source: 'website_form'
        },
        tags: [`ticket-${ticketData.category}`, `priority-${ticketData.priority}`]
      };

      const response = await axios.post(
        `${this.baseURL}/tickets`,
        ticketPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Ticket creado en Tawk.to:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Error enviando ticket a Tawk.to:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return null;
    }
  }

  // Buscar o crear contacto en Tawk.to
  async findOrCreateContact(userData, ticketData) {
    try {
      // Buscar contacto por email
      const searchResponse = await axios.get(
        `${this.baseURL}/contacts/search`,
        {
          params: { email: userData.email },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.data && searchResponse.data.length > 0) {
        console.log('📞 Contacto existente encontrado en Tawk.to');
        return searchResponse.data[0];
      }

      // Crear nuevo contacto
      const contactPayload = {
        email: userData.email,
        name: userData.username || userData.name || 'Usuario',
        phone: userData.phone || '',
        properties: {
          userId: userData._id,
          lastTicket: new Date().toISOString(),
          totalTickets: 1,
          preferredGame: userData.preferredGame || 'No especificado',
          currentRank: userData.currentRank || 'No especificado'
        }
      };

      const createResponse = await axios.post(
        `${this.baseURL}/contacts`,
        contactPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Nuevo contacto creado en Tawk.to');
      return createResponse.data;

    } catch (error) {
      console.error('❌ Error con contacto Tawk.to:', error.message);
      return null;
    }
  }

  // Actualizar estado del ticket en Tawk.to
  async updateTicketStatus(tawkToTicketId, status, resolutionNotes = '') {
    try {
      if (!this.isConfigured()) return null;

      const updatePayload = {
        status: this.mapStatusToTawkTo(status),
        properties: {
          resolutionNotes: resolutionNotes,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : null
        }
      };

      await axios.patch(
        `${this.baseURL}/tickets/${tawkToTicketId}`,
        updatePayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Estado actualizado en Tawk.to:', status);
      return true;

    } catch (error) {
      console.error('❌ Error actualizando estado en Tawk.to:', error.message);
      return false;
    }
  }

  // Mapear estados internos a estados de Tawk.to
  mapStatusToTawkTo(status) {
    const statusMap = {
      'open': 'open',
      'in_progress': 'in_progress',
      'waiting_support': 'pending',
      'waiting_customer': 'pending',
      'resolved': 'closed',
      'closed': 'closed'
    };
    return statusMap[status] || 'open';
  }
}

export default new TawkToService();