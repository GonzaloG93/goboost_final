// components/admin/TicketsManagement.jsx - VERSIÓN PRODUCCIÓN
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../utils/axiosConfig';

const TicketsManagement = () => {
  // Estados principales
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para modal de detalle
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  // Estados para sistema híbrido
  const [useLocalData, setUseLocalData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Función para cargar tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/admin/tickets', {
          params: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            search: searchQuery || undefined,
            limit: 50
          }
        });
        
        const ticketsData = response.data.tickets || response.data || [];
        
        const processedTickets = ticketsData.map(ticket => ({
          ...ticket,
          _id: ticket._id || ticket.id,
          ticketNumber: ticket.ticketNumber || `TKT${ticket._id?.slice(-6) || '000000'}`,
          user: ticket.user || { username: 'Usuario', email: 'N/A' },
          messages: Array.isArray(ticket.messages) ? ticket.messages : [],
          createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
          updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : new Date()
        }));
        
        setTickets(processedTickets);
        setUseLocalData(false);
        setLastUpdated(new Date());
        
      } catch (backendError) {
        setUseLocalData(true);
        setError({
          message: 'Usando datos de demostración',
          type: 'warning'
        });
        
        const localTickets = getSampleTickets();
        setTickets(localTickets);
        setLastUpdated(new Date());
      }
      
    } catch (error) {
      setError({
        message: 'Error al cargar tickets',
        type: 'error'
      });
      setTickets(getSampleTickets());
      setUseLocalData(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Efecto principal
  useEffect(() => {
    fetchTickets();
    
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Badges de estado
  const getStatusBadge = (status) => {
    const config = {
      open: { color: 'bg-yellow-100 text-yellow-800', label: 'Abierto', icon: '📩' },
      in_progress: { color: 'bg-blue-100 text-blue-800', label: 'En Progreso', icon: '🔄' },
      waiting_support: { color: 'bg-orange-100 text-orange-800', label: 'Esperando Soporte', icon: '⏳' },
      waiting_customer: { color: 'bg-purple-100 text-purple-800', label: 'Esperando Cliente', icon: '💬' },
      resolved: { color: 'bg-green-100 text-green-800', label: 'Resuelto', icon: '✅' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Cerrado', icon: '🔒' }
    }[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: '❓' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Badges de prioridad
  const getPriorityBadge = (priority) => {
    const config = {
      low: { color: 'bg-green-100 text-green-800', label: 'Baja', icon: '⬇️' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Media', icon: '↔️' },
      high: { color: 'bg-orange-100 text-orange-800', label: 'Alta', icon: '⬆️' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgente', icon: '🚨' }
    }[priority] || { color: 'bg-gray-100 text-gray-800', label: priority, icon: '❓' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Actualizar estado
  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket._id === ticketId 
          ? { ...ticket, status: newStatus, updatedAt: new Date() }
          : ticket
      ));
      
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      
      if (!useLocalData) {
        try {
          await axios.put(`/admin/tickets/${ticketId}/status`, { status: newStatus });
          setSuccessMessage(`Estado actualizado a ${newStatus}`);
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
          setUseLocalData(true);
        }
      }
    } catch (error) {
      setError({ message: 'Error al actualizar estado', type: 'error' });
    }
  };

  // Responder a ticket
  const handleReply = async (ticketId) => {
    if (!replyText.trim()) {
      setError({ message: 'El mensaje no puede estar vacío', type: 'warning' });
      return;
    }

    try {
      setReplying(true);
      
      const newMessage = {
        _id: `msg_${Date.now()}`,
        message: replyText.trim(),
        content: replyText.trim(),
        sender: { 
          _id: 'admin_id', 
          username: 'Admin', 
          email: 'admin@boostify.com' 
        },
        senderRole: 'admin',
        isAdmin: true,
        createdAt: new Date(),
        read: true
      };
      
      // Actualizar frontend
      setTickets(prev => prev.map(ticket => {
        if (ticket._id === ticketId) {
          const currentMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
          return {
            ...ticket,
            messages: [...currentMessages, newMessage],
            status: ticket.status === 'open' ? 'in_progress' : ticket.status,
            updatedAt: new Date()
          };
        }
        return ticket;
      }));
      
      if (selectedTicket?._id === ticketId) {
        setSelectedTicket(prev => {
          const currentMessages = Array.isArray(prev.messages) ? prev.messages : [];
          return {
            ...prev,
            messages: [...currentMessages, newMessage],
            status: prev.status === 'open' ? 'in_progress' : prev.status
          };
        });
      }
      
      // Enviar a backend
      if (!useLocalData) {
        try {
          await axios.post(`/admin/tickets/${ticketId}/reply`, {
            message: replyText.trim()
          });
          setSuccessMessage('Respuesta enviada exitosamente');
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
          setUseLocalData(true);
          setError({ message: 'Respuesta guardada localmente', type: 'warning' });
        }
      } else {
        setSuccessMessage('Respuesta guardada localmente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
      
      setReplyText('');
      
    } catch (error) {
      setError({ message: 'Error al enviar respuesta', type: 'error' });
    } finally {
      setReplying(false);
    }
  };

  // Ver detalle
  const handleViewTicket = (ticket) => {
    setSelectedTicket({
      ...ticket,
      messages: Array.isArray(ticket.messages) ? ticket.messages : []
    });
    setShowTicketModal(true);
  };

  // Reintentar conexión
  const handleRetryBackend = () => {
    setUseLocalData(false);
    setError(null);
    fetchTickets();
  };

  // Datos de ejemplo
  const getSampleTickets = () => {
    const categories = ['technical', 'billing', 'general', 'order_issue', 'account', 'payment'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['open', 'in_progress', 'waiting_support', 'resolved', 'closed'];
    const users = [
      { username: 'juan_perez', email: 'juan@ejemplo.com' },
      { username: 'maria_gomez', email: 'maria@ejemplo.com' }
    ];
    
    return Array(12).fill().map((_, i) => {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      return {
        _id: `ticket_${i + 1}`,
        ticketNumber: `TKT${String(i + 1).padStart(6, '0')}`,
        subject: `Problema con ${['pago', 'orden', 'cuenta'][i % 3]}`,
        description: `Descripción detallada del problema número ${i + 1}`,
        user,
        priority,
        status,
        category: categories[Math.floor(Math.random() * categories.length)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        messages: []
      };
    }).sort((a, b) => b.createdAt - a.createdAt);
  };

  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (ticket.ticketNumber?.toLowerCase().includes(query)) ||
          (ticket.subject?.toLowerCase().includes(query)) ||
          (ticket.user?.username?.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Estadísticas
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => ['open', 'waiting_support'].includes(t.status)).length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    urgent: tickets.filter(t => t.priority === 'urgent').length
  }), [tickets]);

  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Notificaciones */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className={`mb-4 p-3 rounded-lg border ${
          error.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{error.message}</p>
              {error.details && <p className="text-sm mt-1">{error.details}</p>}
            </div>
            {useLocalData && (
              <button
                onClick={handleRetryBackend}
                className="text-sm bg-white hover:bg-gray-100 px-3 py-1 rounded border"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Tickets</h1>
            <p className="text-gray-600 mt-1">
              {useLocalData ? 'Modo local' : `${tickets.length} tickets`}
              {lastUpdated && (
                <span className="text-sm text-gray-500 ml-2">
                  ({lastUpdated.toLocaleTimeString()})
                </span>
              )}
            </p>
          </div>
          
          <button 
            onClick={fetchTickets}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="waiting_support">Esperando Soporte</option>
              <option value="waiting_customer">Esperando Cliente</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
            
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>

            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="all">Todas las categorías</option>
              <option value="technical">Técnico</option>
              <option value="billing">Facturación</option>
              <option value="general">General</option>
              <option value="order_issue">Problema con orden</option>
              <option value="account">Cuenta</option>
              <option value="payment">Pago</option>
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'blue', icon: '📊' },
            { label: 'Abiertos', value: stats.open, color: 'yellow', icon: '📩' },
            { label: 'En Progreso', value: stats.inProgress, color: 'blue', icon: '🔄' },
            { label: 'Resueltos', value: stats.resolved, color: 'green', icon: '✅' },
            { label: 'Urgentes', value: stats.urgent, color: 'red', icon: '🚨' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border p-4">
              <div className="flex items-center">
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <span className={`text-${stat.color}-600 text-lg`}>{stat.icon}</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asunto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                    #{ticket.ticketNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{ticket.subject}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {ticket.description?.substring(0, 60)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{ticket.user?.username}</div>
                    <div className="text-xs text-gray-500">{ticket.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">{getPriorityBadge(ticket.priority)}</td>
                  <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 hover:bg-blue-50 rounded"
                      >
                        Ver
                      </button>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateStatus(ticket._id, e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="open">Abierto</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="waiting_support">Esperando Soporte</option>
                        <option value="waiting_customer">Esperando Cliente</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron tickets
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{selectedTicket.subject}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    <span className="text-sm text-gray-500">
                      #{selectedTicket.ticketNumber}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTicketModal(false);
                    setSelectedTicket(null);
                    setReplyText('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usuario</label>
                  <p>{selectedTicket.user?.username} ({selectedTicket.user?.email})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <p>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensajes ({selectedTicket.messages?.length || 0})
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                  {selectedTicket.messages?.map((message, index) => (
                    <div
                      key={message._id || index}
                      className={`p-4 rounded-lg border ${
                        message.isAdmin || message.senderRole === 'admin'
                          ? 'bg-blue-50 border-blue-200 ml-4' 
                          : 'bg-gray-50 border-gray-200 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">
                          {message.isAdmin || message.senderRole === 'admin' ? '👨‍💼 Soporte' : '👤 Usuario'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {message.message || message.content}
                      </p>
                    </div>
                  ))}
                  
                  {(!selectedTicket.messages?.length) && (
                    <div className="text-center py-8 text-gray-500">
                      No hay mensajes
                    </div>
                  )}
                </div>
              </div>

              {/* Responder */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responder
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 mb-3"
                  placeholder="Escribe tu respuesta..."
                />
                <div className="flex justify-between items-center">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket._id, e.target.value)}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="open">Abierto</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="waiting_support">Esperando Soporte</option>
                    <option value="waiting_customer">Esperando Cliente</option>
                    <option value="resolved">Resuelto</option>
                    <option value="closed">Cerrado</option>
                  </select>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowTicketModal(false);
                        setSelectedTicket(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleReply(selectedTicket._id)}
                      disabled={replying || !replyText.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      {replying ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsManagement;