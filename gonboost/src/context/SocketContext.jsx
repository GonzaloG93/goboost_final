// frontend/src/context/SocketContext.jsx - URL HARCODEADA PARA RENDER
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
const isDev = import.meta.env.DEV;

const devLog = (...args) => {
  if (isDev) console.log(...args);
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const connectionAttemptsRef = useRef(0);
  const maxRetries = 3;

  const initializeSocket = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (!user || !token) {
      devLog('⏸️ Socket: No hay usuario o token, omitiendo conexión');
      setIsInitialized(true);
      return;
    }

    if (socketRef.current?.connected) {
      devLog('✅ Socket ya conectado, omitiendo inicialización');
      return;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const connectionDelay = connectionAttemptsRef.current > 0 ? 1000 : 0;
    
    const connectTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      
      // ✅ URL HARCODEADA DIRECTAMENTE AL BACKEND DE RENDER
      const socketUrl = 'https://gonboost-api.onrender.com';
      
      devLog('🔌 Inicializando conexión socket a:', socketUrl);

      const socket = io(socketUrl, {
        auth: { 
          token: token
        },
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: connectionAttemptsRef.current >= maxRetries
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        if (!mountedRef.current) return;
        devLog('✅ Socket conectado:', socket.id);
        setIsConnected(true);
        setConnectionError(null);
        setIsInitialized(true);
        connectionAttemptsRef.current = 0;

        socket.emit('authenticate', {
          userId: user._id,
          username: user.username,
          role: user.role
        });

        setTimeout(() => {
          if (socket.connected) {
            socket.emit('join_user_tickets');
          }
        }, 100);
      });

      socket.on('connected', (data) => {
        if (!mountedRef.current) return;
        devLog('🔐 Confirmación de conexión:', data);
      });

      socket.on('authenticated', (data) => {
        if (!mountedRef.current) return;
        devLog('🔐 Socket autenticado:', data);
      });

      socket.on('tickets_subscribed', (data) => {
        if (!mountedRef.current) return;
        devLog('🎫 Suscrito a tickets del usuario:', data);
      });

      socket.on('disconnect', (reason) => {
        if (!mountedRef.current) return;
        devLog('🔌 Socket desconectado:', reason);
        setIsConnected(false);
        
        if (reason === 'io client disconnect') {
          return;
        }
      });

      socket.on('connect_error', (error) => {
        if (!mountedRef.current) return;
        console.error('❌ Error de conexión socket:', {
          message: error.message,
          description: error.description,
          type: error.type
        });
        
        setConnectionError(`Error: ${error.message}`);
        setIsConnected(false);
        setIsInitialized(true);
        connectionAttemptsRef.current++;
        
        if (connectionAttemptsRef.current >= maxRetries) {
          devLog('❌ Máximo de intentos alcanzado');
          setTimeout(() => {
            connectionAttemptsRef.current = 0;
          }, 30000);
        }
      });

      socket.on('error', (error) => {
        if (!mountedRef.current) return;
        console.error('❌ Socket error:', error);
      });

    }, connectionDelay);

    return () => {
      clearTimeout(connectTimer);
    };
  }, [user, token]);

  useEffect(() => {
    mountedRef.current = true;
    
    const initTimer = setTimeout(() => {
      if (mountedRef.current) {
        initializeSocket();
      }
    }, 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      
      if (socketRef.current) {
        devLog('🧹 Limpiando conexión socket en unmount');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [initializeSocket]);

  useEffect(() => {
    if (user && token) {
      const reconnectTimer = setTimeout(() => {
        if (mountedRef.current && !socketRef.current?.connected) {
          initializeSocket();
        }
      }, 500);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [user?._id, token]);

  // FUNCIONES PARA TICKETS
  const joinUserTickets = useCallback(() => {
    if (socketRef.current?.connected && mountedRef.current) {
      socketRef.current.emit('join_user_tickets');
      devLog('✅ Unido a tickets del usuario');
    }
  }, []);

  const joinAdminTickets = useCallback(() => {
    if (socketRef.current?.connected && user?.role === 'admin' && mountedRef.current) {
      socketRef.current.emit('join_admin_tickets');
      devLog('✅ Admin unido a sala de tickets');
    }
  }, [user]);

  const joinTicketRoom = useCallback((ticketId) => {
    if (socketRef.current?.connected && mountedRef.current) {
      socketRef.current.emit('join_ticket', ticketId);
      devLog(`🎫 Unido a sala de ticket: ${ticketId}`);
    }
  }, []);

  const leaveTicketRoom = useCallback((ticketId) => {
    if (socketRef.current?.connected && mountedRef.current) {
      socketRef.current.emit('leave_ticket', ticketId);
      devLog(`🎫 Salió de sala de ticket: ${ticketId}`);
    }
  }, []);

  const sendTicketReply = useCallback((ticketId, message) => {
    if (socketRef.current?.connected && user && mountedRef.current) {
      socketRef.current.emit('customer_ticket_reply', {
        ticketId,
        message: message.trim(),
        customerId: user._id
      });
      devLog(`📤 Enviando respuesta a ticket ${ticketId}`);
    }
  }, [user]);

  const sendTicketCreated = useCallback((ticketData) => {
    if (socketRef.current?.connected && user && mountedRef.current) {
      socketRef.current.emit('customer_ticket_created', {
        ticket: ticketData,
        userId: user._id,
        customerName: user.username,
        timestamp: new Date()
      });
      devLog('🎫 Notificando creación de ticket via socket');
    }
  }, [user]);

  const startTypingInTicket = useCallback((ticketId) => {
    if (socketRef.current?.connected && user && mountedRef.current) {
      socketRef.current.emit('customer_typing', {
        ticketId,
        isTyping: true
      });
      devLog(`✍️ Typing en ticket ${ticketId}`);
    }
  }, [user]);

  const stopTypingInTicket = useCallback((ticketId) => {
    if (socketRef.current?.connected && user && mountedRef.current) {
      socketRef.current.emit('customer_typing', {
        ticketId,
        isTyping: false
      });
      devLog(`⏹️ Stopped typing en ticket ${ticketId}`);
    }
  }, [user]);

  // EVENT LISTENERS
  const onTicketCreated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('ticket_created', callback);
      return () => socketRef.current?.off('ticket_created', callback);
    }
    return () => {};
  }, []);

  const onAdminReplied = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('admin_replied', callback);
      return () => socketRef.current?.off('admin_replied', callback);
    }
    return () => {};
  }, []);

  const onTicketUpdated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('ticket_updated', callback);
      return () => socketRef.current?.off('ticket_updated', callback);
    }
    return () => {};
  }, []);

  const onTicketMessageAdded = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('ticket_message_added', callback);
      return () => socketRef.current?.off('ticket_message_added', callback);
    }
    return () => {};
  }, []);

  const onTicketStatusUpdated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('ticket_status_updated', callback);
      return () => socketRef.current?.off('ticket_status_updated', callback);
    }
    return () => {};
  }, []);

  // FUNCIONES PARA ÓRDENES
  const subscribeOrders = useCallback(() => {
    if (socketRef.current?.connected && user && mountedRef.current) {
      socketRef.current.emit('join_user_orders', user._id);
      devLog('📦 Suscrito a órdenes del usuario');
    }
  }, [user]);

  const onOrderCreated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('order_created', callback);
      return () => socketRef.current?.off('order_created', callback);
    }
    return () => {};
  }, []);

  const onOrderUpdated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('order_updated', callback);
      return () => socketRef.current?.off('order_updated', callback);
    }
    return () => {};
  }, []);

  const onOrderCreatedConfirmation = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('order_created_confirmation', callback);
      return () => socketRef.current?.off('order_created_confirmation', callback);
    }
    return () => {};
  }, []);

  const value = {
    isConnected,
    connectionError,
    isInitialized,
    socket: socketRef.current,
    
    reconnect: () => {
      if (mountedRef.current) {
        connectionAttemptsRef.current = 0;
        initializeSocket();
      }
    },
    
    // Tickets
    joinUserTickets,
    joinAdminTickets,
    joinTicketRoom,
    leaveTicketRoom,
    sendTicketReply,
    sendTicketCreated,
    startTypingInTicket,
    stopTypingInTicket,
    
    // Event Listeners
    onTicketCreated,
    onAdminReplied,
    onTicketUpdated,
    onTicketMessageAdded,
    onTicketStatusUpdated,
    
    // Órdenes
    subscribeOrders,
    onOrderCreated,
    onOrderUpdated,
    onOrderCreatedConfirmation,
    
    // Compatibilidad
    joinOrder: useCallback((orderId) => {
      if (socketRef.current?.connected && mountedRef.current) {
        socketRef.current.emit('join_order', orderId);
      }
    }, []),
    
    sendMessage: useCallback((orderId, message, sender) => {
      if (socketRef.current?.connected && mountedRef.current) {
        socketRef.current.emit('send_message', {
          orderId,
          message,
          sender
        });
      }
    }, []),
    
    updateOrderStatus: useCallback((orderId, newStatus) => {
      if (socketRef.current?.connected && mountedRef.current) {
        socketRef.current.emit('order_status_update', {
          orderId,
          newStatus
        });
      }
    }, [])
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};