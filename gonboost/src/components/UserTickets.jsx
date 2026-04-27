// frontend/src/components/UserTickets.jsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../utils/axiosConfig';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const UserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [realTimeNotification, setRealTimeNotification] = useState(null);
  const [filters, setFilters] = useState({ status: 'all' });
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef(null);

  // ✅ Fetch user tickets
  const fetchUserTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await axios.get(`/support/tickets/my-tickets?${params}`);
      
      if (response.data.success) {
        const formattedTickets = response.data.data.map(ticket => ({
          ...ticket,
          replies: ticket.replies || [],
          message: ticket.message || ticket.description || ''
        }));
        setTickets(formattedTickets);
      } else {
        setError('No se pudieron cargar los tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error.response?.data?.message || 'Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  // ✅ Initial fetch
  useEffect(() => {
    fetchUserTickets();
  }, [fetchUserTickets]);

  // ✅ Socket.IO setup
  useEffect(() => {
    if (!socket || !isConnected || !user) {
      console.log('⚠️ Socket no disponible, omitiendo suscripción');
      return;
    }

    console.log('📡 Configurando listeners de Socket.IO');

    // Unirse a sala de tickets del usuario
    socket.emit('join_user_tickets');

    const handleTicketCreated = (data) => {
      console.log('🎫 Ticket creado via socket:', data);
      
      // Solo agregar si es del usuario actual
      if (data.customerId === user._id) {
        setRealTimeNotification({
          message: '✅ ¡Ticket creado exitosamente!',
          timestamp: new Date()
        });
        
        // Actualizar lista después de un delay
        setTimeout(() => {
          fetchUserTickets();
        }, 1000);
      }
    };

    const handleAdminReplied = (data) => {
      console.log('📩 Admin respondió via socket:', data);
      
      setTickets(prev => 
        prev.map(ticket => {
          if (ticket._id === data.ticketId) {
            const newMessage = data.message || {
              _id: Date.now().toString(),
              message: data.content || data.message,
              content: data.content || data.message,
              sender: { _id: 'admin', username: data.adminName || 'Administrador' },
              senderRole: 'admin',
              createdAt: new Date(),
              read: false
            };
            
            const newReplies = [...(ticket.replies || []), newMessage];
            
            // Mostrar notificación
            setRealTimeNotification({
              message: `📩 Nueva respuesta del administrador en Ticket #${ticket.ticketNumber}`,
              ticketId: ticket._id,
              timestamp: new Date()
            });
            
            // Auto-expandir el ticket
            if (expandedTicket !== ticket._id) {
              setTimeout(() => setExpandedTicket(ticket._id), 500);
            }
            
            return {
              ...ticket,
              replies: newReplies,
              updatedAt: new Date(),
              unreadCount: (ticket.unreadCount || 0) + 1
            };
          }
          return ticket;
        })
      );
    };

    const handleTicketUpdated = (data) => {
      console.log('🔄 Ticket actualizado:', data);
      
      setTickets(prev => 
        prev.map(ticket => {
          if (ticket._id === data.ticketId || ticket._id === data.ticket?._id) {
            return {
              ...ticket,
              ...data.ticket,
              status: data.status || ticket.status,
              updatedAt: new Date()
            };
          }
          return ticket;
        })
      );
    };

    const handleTicketMessageAdded = (data) => {
      console.log('💬 Nuevo mensaje agregado:', data);
      
      if (data.message?.senderRole === 'admin') {
        setTickets(prev => 
          prev.map(ticket => {
            if (ticket._id === data.ticketId) {
              const newReplies = [...(ticket.replies || []), data.message];
              
              return {
                ...ticket,
                replies: newReplies,
                updatedAt: new Date(),
                unreadCount: (ticket.unreadCount || 0) + 1
              };
            }
            return ticket;
          })
        );
      }
    };

    const handleStatusUpdated = (data) => {
      console.log('🔄 Estado actualizado:', data);
      
      setTickets(prev => 
        prev.map(ticket => {
          if (ticket._id === data.ticketId) {
            return {
              ...ticket,
              status: data.status,
              updatedAt: new Date()
            };
          }
          return ticket;
        })
      );
    };

    // Registrar listeners
    socket.on('ticket_created', handleTicketCreated);
    socket.on('admin_replied', handleAdminReplied);
    socket.on('ticket_updated', handleTicketUpdated);
    socket.on('ticket_message_added', handleTicketMessageAdded);
    socket.on('ticket_status_updated', handleStatusUpdated);
    socket.on('new_ticket_created', handleTicketCreated);

    // Limpiar notificación después de 5 segundos
    if (realTimeNotification) {
      const timer = setTimeout(() => setRealTimeNotification(null), 5000);
      return () => clearTimeout(timer);
    }

    // Cleanup
    return () => {
      socket.off('ticket_created', handleTicketCreated);
      socket.off('admin_replied', handleAdminReplied);
      socket.off('ticket_updated', handleTicketUpdated);
      socket.off('ticket_message_added', handleTicketMessageAdded);
      socket.off('ticket_status_updated', handleStatusUpdated);
      socket.off('new_ticket_created', handleTicketCreated);
    };
  }, [socket, isConnected, user, fetchUserTickets, expandedTicket, realTimeNotification]);

  // ✅ Unirse/salir de sala cuando se expande/contrae un ticket
  useEffect(() => {
    if (!socket || !isConnected || !expandedTicket) return;

    console.log(`🎫 Uniendo a sala de ticket: ${expandedTicket}`);
    socket.emit('join_ticket', expandedTicket);

    return () => {
      console.log(`🎫 Saliendo de sala de ticket: ${expandedTicket}`);
      socket.emit('leave_ticket', expandedTicket);
    };
  }, [socket, isConnected, expandedTicket]);

  // ✅ Manejar typing
  const handleTyping = useCallback((isTyping) => {
    if (socket && isConnected && expandedTicket) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      socket.emit('customer_typing', {
        ticketId: expandedTicket,
        isTyping
      });
      
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('customer_typing', {
            ticketId: expandedTicket,
            isTyping: false
          });
        }, 3000);
      }
    }
  }, [socket, isConnected, expandedTicket]);

  // ✅ Función para enviar respuesta
  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;

    try {
      setReplying(true);
      
      // Detener typing
      handleTyping(false);
      
      const response = await axios.post(`/support/tickets/${ticketId}/reply`, {
        message: replyText.trim()
      });

      if (response.data.success) {
        setReplyText('');
        
        // Crear mensaje local inmediatamente
        const newReply = {
          _id: Date.now().toString(),
          message: replyText.trim(),
          content: replyText.trim(),
          sender: { 
            _id: user?._id, 
            username: user?.username,
            role: 'customer'
          },
          senderRole: 'customer',
          createdAt: new Date(),
          read: true
        };
        
        // Actualizar estado local
        setTickets(prev => 
          prev.map(ticket => {
            if (ticket._id === ticketId) {
              const updatedReplies = [...(ticket.replies || []), newReply];
              return {
                ...ticket,
                replies: updatedReplies,
                updatedAt: new Date(),
                status: 'waiting_support',
                messageCount: updatedReplies.length
              };
            }
            return ticket;
          })
        );
        
        // Mostrar notificación
        setRealTimeNotification({
          message: '✅ ¡Respuesta enviada!',
          timestamp: new Date()
        });
        
        setTimeout(() => setRealTimeNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setError(error.response?.data?.message || 'Error al enviar la respuesta');
    } finally {
      setReplying(false);
    }
  };

  // ✅ Toggle expand ticket
  const toggleExpand = (ticketId) => {
    const newExpanded = expandedTicket === ticketId ? null : ticketId;
    setExpandedTicket(newExpanded);
    setReplyText('');
  };

  // ✅ Helper functions
  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { label: 'Abierto', color: 'bg-green-100 text-green-800', icon: '🟢' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: '🔵' },
      waiting_support: { label: 'Esperando Soporte', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
      waiting_customer: { label: 'Esperando Cliente', color: 'bg-purple-100 text-purple-800', icon: '🟣' },
      resolved: { label: 'Resuelto', color: 'bg-gray-100 text-gray-800', icon: '✅' },
      closed: { label: 'Cerrado', color: 'bg-gray-200 text-gray-700', icon: '🔒' }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-green-100 text-green-800', icon: '📊' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800', icon: '🚨' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800', icon: '🔥' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "PPpp", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      technical: '🔧 Técnico',
      order_issue: '📦 Problema de Orden',
      billing: '💰 Facturación',
      account: '👤 Cuenta',
      payment: '💳 Pago',
      general: '📝 General',
      other: '🎮 Otros'
    };
    return categories[category] || category;
  };

  const markAsResolved = async (ticketId) => {
    try {
      const response = await axios.put(`/support/tickets/${ticketId}/status`, {
        status: 'resolved'
      });

      if (response.data.success) {
        fetchUserTickets();
        setRealTimeNotification({
          message: '✅ Ticket marcado como resuelto',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error marking as resolved:', error);
      setError(error.response?.data?.message || 'Error al actualizar el estado');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // ✅ Connection status component
  const ConnectionStatus = () => (
    <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <span className="text-sm font-medium">
        {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
      </span>
    </div>
  );

  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mis Tickets de Soporte</h2>
                <p className="text-gray-600 mt-1">Revisa respuestas y continúa la conversación</p>
              </div>
              <ConnectionStatus />
            </div>
            
            {/* Filters */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Estado:</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="open">Abiertos</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="waiting_support">Esperando Soporte</option>
                  <option value="resolved">Resueltos</option>
                  <option value="closed">Cerrados</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="/support"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Ticket
            </a>
          </div>
        </div>
      </div>

      {/* Real-time notification */}
      {realTimeNotification && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <p className="text-sm font-medium text-blue-800">
                {realTimeNotification.message}
              </p>
            </div>
            <button
              onClick={() => setRealTimeNotification(null)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tickets list */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {tickets.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📨</div>
            <p className="text-gray-500 text-lg mb-2">No tienes tickets de soporte</p>
            <p className="text-gray-400 text-sm mb-6">
              {filters.status !== 'all' 
                ? `No hay tickets con estado "${filters.status}"` 
                : 'Los tickets que crees aparecerán aquí'}
            </p>
            <a
              href="/support"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Crear Primer Ticket
            </a>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket._id} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${expandedTicket === ticket._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
              {/* Ticket header */}
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(ticket._id)}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {ticket.subject}
                      {ticket.unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {ticket.unreadCount} nuevo{ticket.unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </h3>
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {getCategoryLabel(ticket.category)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                    <span className="font-medium">#{ticket.ticketNumber}</span>
                    <span>•</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                    <span>•</span>
                    <span>{ticket.replies?.length || 0} mensaje{(ticket.replies?.length || 0) !== 1 ? 's' : ''}</span>
                    {ticket.updatedAt !== ticket.createdAt && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">Actualizado</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {ticket.message || 'Sin descripción'}
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center space-x-3">
                  {(ticket.status === 'open' || ticket.status === 'in_progress' || ticket.status === 'waiting_support') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsResolved(ticket._id);
                      }}
                      className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1.5 rounded-full transition-colors font-medium flex items-center"
                    >
                      <span className="mr-1">✅</span>
                      Marcar Resuelto
                    </button>
                  )}
                  <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                    {expandedTicket === ticket._id ? 'Ocultar ▲' : 'Ver Conversación ▼'}
                  </button>
                </div>
              </div>

              {/* ✅ Expanded conversation - CORREGIDO PARA EVITAR DUPLICADOS */}
              {expandedTicket === ticket._id && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900">Conversación</h4>
                    <div className="text-xs text-gray-500">
                      {ticket.replies?.length || 0} mensajes • Última actualización: {formatDate(ticket.updatedAt)}
                    </div>
                  </div>
                  
                  {/* Conversation thread */}
                  <div className="space-y-4 max-h-80 overflow-y-auto p-3 border rounded-lg bg-gray-50 mb-4">
                    {/* Initial message - SOLO UNA VEZ */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                            {ticket.user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">
                              {ticket.user?.username || 'Usuario'}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Ticket Inicial
                        </span>
                      </div>
                      <p className="mt-3 text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    {/* ✅ Replies - FILTRAR PARA EVITAR DUPLICADOS */}
                    {ticket.replies && ticket.replies
                      .filter((reply, index) => {
                        // ❌ EXCLUIR: El primer mensaje que ya se muestra como "Ticket Inicial"
                        // Verificamos si es el primer mensaje del usuario (índice 0)
                        // y si tiene el mismo contenido que el mensaje inicial del ticket
                        if (index === 0 && 
                            reply.senderRole === 'customer' && 
                            reply.message === ticket.message) {
                          console.log('🔍 Excluyendo mensaje duplicado:', reply.message);
                          return false;
                        }
                        return true;
                      })
                      .map((reply, index) => {
                        // Verificar si es una respuesta del admin
                        const isAdminReply = reply.senderRole === 'admin' || reply.senderRole === 'support';
                        
                        return (
                          <div 
                            key={reply._id || `reply-${index}`}
                            className={`rounded-lg p-4 border ${isAdminReply
                              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
                              : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2 ${
                                  isAdminReply
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                                    : 'bg-gradient-to-r from-green-600 to-blue-600'
                                }`}>
                                  {isAdminReply ? 'A' : 'T'}
                                </div>
                                <div>
                                  <span className="font-semibold">
                                    {isAdminReply ? '👑 Administrador' : '👤 Tú'}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                              </div>
                              {isAdminReply && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  Respuesta Oficial
                                </span>
                              )}
                            </div>
                            <p className={`mt-3 whitespace-pre-wrap ${isAdminReply ? 'text-purple-900' : 'text-gray-800'}`}>
                              {reply.message || reply.content}
                            </p>
                          </div>
                        );
                      })}
                  </div>

                  {/* Reply form */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        Tu respuesta
                      </label>
                      <span className="text-xs text-gray-500">
                        {replyText.length}/1000 caracteres
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => {
                          setReplyText(e.target.value);
                          handleTyping(e.target.value.length > 0);
                        }}
                        onFocus={() => handleTyping(true)}
                        onBlur={() => handleTyping(false)}
                        placeholder="Escribe tu respuesta aquí... El administrador será notificado."
                        className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={1000}
                        disabled={ticket.status === 'resolved' || ticket.status === 'closed' || replying}
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleReply(ticket._id)}
                          disabled={replying || !replyText.trim() || ticket.status === 'resolved' || ticket.status === 'closed'}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center"
                        >
                          {replying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">📤</span>
                              Enviar Respuesta
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setReplyText('')}
                          disabled={!replyText.trim() || replying}
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded text-sm transition-colors"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Tu respuesta será visible para el administrador y notificará en tiempo real
                      {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                        <span className="text-red-500 ml-1">(Ticket cerrado, no se pueden enviar más respuestas)</span>
                      ) : null}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-t border-red-100">
          <div className="text-red-700 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <button 
              onClick={() => setError('')} 
              className="text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <div>
            Mostrando <span className="font-semibold">{tickets.length}</span> ticket{tickets.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchUserTickets}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTickets;