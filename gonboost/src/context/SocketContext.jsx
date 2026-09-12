// frontend/src/context/SocketContext.jsx - VERSIÓN ESTABLE Y RESISTENTE A NAVEGACIÓN
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
  const activeTokenRef = useRef(null);

  // Limpia y extrae el token
  const rawToken = token || localStorage.getItem('token') || '';
  const cleanToken = rawToken.replace(/^Bearer\s+/, '').trim();

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      devLog('🧹 Desconectando socket actual...');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      activeTokenRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const initializeSocket = useCallback(() => {
    // Si no hay usuario o token, limpiar
    if (!user || !cleanToken) {
      if (socketRef.current) disconnectSocket();
      setIsInitialized(true);
      return;
    }

    // Si ya está conectado con el MISMO token, no volver a conectar
    if (socketRef.current?.connected && activeTokenRef.current === cleanToken) {
      return;
    }

    // Si había un socket previo con token distinto, limpiarlo
    if (socketRef.current) {
      disconnectSocket();
    }

    devLog('🔌 Inicializando conexión socket...');
    activeTokenRef.current = cleanToken;

    const rawUrl = import.meta.env.VITE_API_URL || 'https://api.gonboost.com';
    const socketUrl = rawUrl.replace(/\/api\/?$/, ''); 

    const socket = io(socketUrl, {
      auth: { token: cleanToken },
      extraHeaders: { Authorization: `Bearer ${cleanToken}` },
      transports: ['websocket', 'polling'], // Fallback automático para evitar 'WebSocket is closed' abruptos
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      devLog('✅ Socket conectado:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      setIsInitialized(true);

      socket.emit('authenticate', {
        userId: user._id,
        username: user.username,
        role: user.role
      });

      socket.emit('join_user_tickets');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión socket:', error.message);
      setConnectionError(`Error: ${error.message}`);
      setIsConnected(false);
      setIsInitialized(true);
    });

    socket.on('disconnect', (reason) => {
      devLog('🔌 Socket desconectado:', reason);
      setIsConnected(false);
    });

  }, [user, cleanToken, disconnectSocket]);

  // UN SOLO useEffect para manejar el ciclo de vida del Socket
  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        disconnectSocket();
      }
    };
  }, [initializeSocket, disconnectSocket]);

  // FUNCIONES PARA TICKETS
  const joinUserTickets = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_user_tickets');
    }
  }, []);

  const joinAdminTickets = useCallback(() => {
    if (socketRef.current?.connected && user?.role === 'admin') {
      socketRef.current.emit('join_admin_tickets');
    }
  }, [user]);

  const joinTicketRoom = useCallback((ticketId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_ticket', ticketId);
    }
  }, []);

  const leaveTicketRoom = useCallback((ticketId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_ticket', ticketId);
    }
  }, []);

  const sendTicketReply = useCallback((ticketId, message) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('customer_ticket_reply', {
        ticketId,
        message: message.trim(),
        customerId: user._id
      });
    }
  }, [user]);

  const sendTicketCreated = useCallback((ticketData) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('customer_ticket_created', {
        ticket: ticketData,
        userId: user._id,
        customerName: user.username,
        timestamp: new Date()
      });
    }
  }, [user]);

  const startTypingInTicket = useCallback((ticketId) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('customer_typing', { ticketId, isTyping: true });
    }
  }, [user]);

  const stopTypingInTicket = useCallback((ticketId) => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('customer_typing', { ticketId, isTyping: false });
    }
  }, [user]);

  // LISTENERS
  const onTicketCreated = useCallback((callback) => {
    socketRef.current?.on('ticket_created', callback);
    return () => socketRef.current?.off('ticket_created', callback);
  }, []);

  const onAdminReplied = useCallback((callback) => {
    socketRef.current?.on('admin_replied', callback);
    return () => socketRef.current?.off('admin_replied', callback);
  }, []);

  const onTicketUpdated = useCallback((callback) => {
    socketRef.current?.on('ticket_updated', callback);
    return () => socketRef.current?.off('ticket_updated', callback);
  }, []);

  const onTicketMessageAdded = useCallback((callback) => {
    socketRef.current?.on('ticket_message_added', callback);
    return () => socketRef.current?.off('ticket_message_added', callback);
  }, []);

  const onTicketStatusUpdated = useCallback((callback) => {
    socketRef.current?.on('ticket_status_updated', callback);
    return () => socketRef.current?.off('ticket_status_updated', callback);
  }, []);

  // ÓRDENES
  const subscribeOrders = useCallback(() => {
    if (socketRef.current?.connected && user) {
      socketRef.current.emit('join_user_orders', user._id);
    }
  }, [user]);

  const onOrderCreated = useCallback((callback) => {
    socketRef.current?.on('order_created', callback);
    return () => socketRef.current?.off('order_created', callback);
  }, []);

  const onOrderUpdated = useCallback((callback) => {
    socketRef.current?.on('order_updated', callback);
    return () => socketRef.current?.off('order_updated', callback);
  }, []);

  const onOrderCreatedConfirmation = useCallback((callback) => {
    socketRef.current?.on('order_created_confirmation', callback);
    return () => socketRef.current?.off('order_created_confirmation', callback);
  }, []);

  const value = {
    isConnected,
    connectionError,
    isInitialized,
    socket: socketRef.current,
    
    reconnect: () => {
      activeTokenRef.current = null;
      initializeSocket();
    },
    
    joinUserTickets,
    joinAdminTickets,
    joinTicketRoom,
    leaveTicketRoom,
    sendTicketReply,
    sendTicketCreated,
    startTypingInTicket,
    stopTypingInTicket,
    
    onTicketCreated,
    onAdminReplied,
    onTicketUpdated,
    onTicketMessageAdded,
    onTicketStatusUpdated,
    
    subscribeOrders,
    onOrderCreated,
    onOrderUpdated,
    onOrderCreatedConfirmation,
    
    joinOrder: useCallback((orderId) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('join_order', orderId);
      }
    }, []),
    
    sendMessage: useCallback((orderId, message, sender) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('send_message', { orderId, message, sender });
      }
    }, []),
    
    updateOrderStatus: useCallback((orderId, newStatus) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('order_status_update', { orderId, newStatus });
      }
    }, [])
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;