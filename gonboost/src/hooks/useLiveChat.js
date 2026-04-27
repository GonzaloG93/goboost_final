// hooks/useLiveChat.js - VERSIÓN OPTIMIZADA Y CORREGIDA
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const useLiveChat = () => {
  const { liveChatSocket, isLiveChatConnected } = useSocket();
  const { user } = useAuth();
  
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState('');
  
  const typingTimeoutRef = useRef(null);
  const joinTimeoutRef = useRef(null);

  // ✅ PERSISTENCIA MEJORADA: Recuperar chat activo del localStorage
  useEffect(() => {
    if (user) {
      const savedChat = localStorage.getItem(`liveChat_${user._id}`);
      const savedMessages = localStorage.getItem(`liveMessages_${user._id}`);
      
      if (savedChat) {
        try {
          const chatData = JSON.parse(savedChat);
          const messagesData = savedMessages ? JSON.parse(savedMessages) : [];
          
          console.log('💾 LiveChat: Chat recuperado del storage:', {
            roomId: chatData.roomId,
            mensajes: messagesData.length,
            estado: chatData.status
          });
          
          setCurrentChat(chatData);
          setMessages(messagesData);
          
          // ✅ AUTO-RECONEXIÓN: Si el chat estaba activo, reconectar
          if (chatData.status !== 'ended' && isLiveChatConnected) {
            console.log('🔄 LiveChat: Auto-reconectando a chat persistido...');
            joinLiveChat(chatData.roomId);
          }
        } catch (error) {
          console.error('❌ LiveChat: Error recuperando chat:', error);
          clearPersistedData();
        }
      }
    }
  }, [user, isLiveChatConnected]);

  // ✅ PERSISTENCIA MEJORADA: Guardar por separado chat y mensajes
  const persistChatState = useCallback((chat, chatMessages) => {
    if (user) {
      if (chat) {
        localStorage.setItem(`liveChat_${user._id}`, JSON.stringify(chat));
      }
      if (chatMessages) {
        localStorage.setItem(`liveMessages_${user._id}`, JSON.stringify(chatMessages));
      }
    }
  }, [user]);

  // ✅ LIMPIAR PERSISTENCIA de manera completa
  const clearPersistedData = useCallback(() => {
    if (user) {
      localStorage.removeItem(`liveChat_${user._id}`);
      localStorage.removeItem(`liveMessages_${user._id}`);
      console.log('🗑️ LiveChat: Datos persistidos limpiados');
    }
  }, [user]);

  const isAgentOrAdmin = useCallback(() => {
    return user && (user.role === 'agent' || user.role === 'admin');
  }, [user]);

  // ✅ MANEJO MEJORADO de estado de conexión
  useEffect(() => {
    const status = isLiveChatConnected ? 'connected' : 'disconnected';
    setConnectionStatus(status);
    
    if (isLiveChatConnected) {
      console.log('💬 useLiveChat: ✅ Socket Live Chat CONECTADO');
      setError('');
    } else {
      console.log('💬 useLiveChat: ❌ Socket Live Chat DESCONECTADO');
      setError('Conexión perdida. Reconectando...');
    }
  }, [isLiveChatConnected]);

  // ✅ UNIÓN MEJORADA al chat con manejo de errores
  const joinLiveChat = useCallback((roomId = null) => {
    if (!liveChatSocket || !isLiveChatConnected || !user) {
      setError('No hay conexión disponible');
      console.log('💬 ❌ useLiveChat: No se puede unir - falta conexión o usuario');
      return;
    }

    // Limpiar timeout anterior si existe
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current);
    }

    console.log('💬 useLiveChat: Uniéndose al Live Chat', {
      roomIdSolicitado: roomId,
      roomIdPersistido: currentChat?.roomId,
      usuario: user.username,
      rol: user.role
    });
    
    // Usar roomId proporcionado, o el persistido, o crear nuevo
    const targetRoomId = roomId || currentChat?.roomId;
    
    setLoading(true);
    setError('');
    
    liveChatSocket.emit('join_live_chat', { roomId: targetRoomId });

    // ✅ TIMEOUT de seguridad para evitar carga infinita
    joinTimeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log('💬 ⚠️ useLiveChat: Timeout en join_live_chat');
        setLoading(false);
        setError('Tiempo de conexión agotado. Intenta nuevamente.');
      }
    }, 10000); // 10 segundos

  }, [liveChatSocket, isLiveChatConnected, user, currentChat, loading]);

  // ✅ ENVÍO MEJORADO de mensajes con validación
  const sendMessage = useCallback((message, roomId = null) => {
    if (!liveChatSocket || !isLiveChatConnected || !user) {
      setError('No hay conexión disponible para enviar mensajes');
      return;
    }

    if (!message || !message.trim()) {
      setError('El mensaje no puede estar vacío');
      return;
    }

    const targetRoomId = roomId || currentChat?.roomId;
    
    if (!targetRoomId) {
      setError('No hay un chat activo para enviar mensajes');
      return;
    }

    console.log('💬 useLiveChat: Enviando mensaje', {
      mensaje: message.substring(0, 50) + '...',
      roomId: targetRoomId,
      usuario: user.username
    });
    
    // ✅ MENSAJE OPTIMISTA: Agregar inmediatamente a la UI
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      sender: {
        _id: user._id,
        username: user.username,
        role: user.role
      },
      message: message.trim(),
      messageType: 'text',
      timestamp: new Date(),
      isOptimistic: true
    };

    setMessages(prev => {
      const newMessages = [...prev, optimisticMessage];
      persistChatState(currentChat, newMessages);
      return newMessages;
    });

    // Enviar al socket
    liveChatSocket.emit('send_live_message', {
      roomId: targetRoomId,
      message: message.trim(),
      messageType: 'text'
    });

  }, [liveChatSocket, isLiveChatConnected, user, currentChat, persistChatState]);

  // ✅ FINALIZACIÓN MEJORADA del chat
  const endChat = useCallback((roomId = null) => {
    if (!liveChatSocket || !isLiveChatConnected || !user) {
      setError('No hay conexión para finalizar el chat');
      return;
    }

    const targetRoomId = roomId || currentChat?.roomId;
    
    if (!targetRoomId) {
      setError('No hay chat activo para finalizar');
      return;
    }

    console.log('💬 useLiveChat: Finalizando chat', { 
      roomId: targetRoomId, 
      usuario: user.username 
    });
    
    liveChatSocket.emit('end_live_chat', { roomId: targetRoomId });
    
    // Limpiar estado inmediatamente
    setCurrentChat(null);
    setMessages([]);
    setLoading(false);
    clearPersistedData();

  }, [liveChatSocket, isLiveChatConnected, user, currentChat, clearPersistedData]);

  // ✅ AGENTE UNIRSE con validación de permisos
  const joinAsAgent = useCallback((roomId) => {
    if (!liveChatSocket || !isLiveChatConnected) {
      setError('No hay conexión disponible');
      return;
    }

    if (!isAgentOrAdmin()) {
      setError('No tienes permisos de agente');
      return;
    }

    if (!roomId) {
      setError('Se requiere un roomId para unirse como agente');
      return;
    }

    console.log('💬 useLiveChat: Agente uniéndose a chat', { 
      roomId, 
      agente: user.username 
    });
    
    setLoading(true);
    setError('');
    
    liveChatSocket.emit('agent_join_chat', { roomId });

  }, [liveChatSocket, isLiveChatConnected, isAgentOrAdmin, user]);

  // ✅ INDICADORES DE TYPING mejorados
  const startTyping = useCallback(() => {
    if (liveChatSocket && isLiveChatConnected && user && currentChat?.roomId) {
      liveChatSocket.emit('typing_start', { roomId: currentChat.roomId });
    }
  }, [liveChatSocket, isLiveChatConnected, user, currentChat]);

  const stopTyping = useCallback(() => {
    if (liveChatSocket && isLiveChatConnected && user && currentChat?.roomId) {
      liveChatSocket.emit('typing_stop', { roomId: currentChat.roomId });
    }
  }, [liveChatSocket, isLiveChatConnected, user, currentChat]);

  // ✅ ESCUCHA MEJORADA de eventos del socket
  useEffect(() => {
    if (!liveChatSocket || !user) {
      console.log('💬 useLiveChat: Esperando socket Live Chat o usuario...');
      return;
    }

    console.log('💬 useLiveChat: Configurando listeners para:', user.username, 'Rol:', user.role);

    const handleChatJoined = (data) => {
      console.log('💬 useLiveChat: ✅ Chat unido exitosamente', {
        roomId: data.chat?.roomId,
        estado: data.chat?.status,
        mensajes: data.chat?.messages?.length
      });
      
      setCurrentChat(data.chat);
      setMessages(data.chat?.messages || []);
      setLoading(false);
      setError('');
      
      // Persistir el nuevo estado
      persistChatState(data.chat, data.chat?.messages || []);
      
      // Limpiar timeout de join
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
    };

    const handleNewMessage = (message) => {
      console.log('💬 useLiveChat: 📨 Nuevo mensaje recibido', {
        id: message._id,
        sender: message.sender?.username,
        mensaje: message.message?.substring(0, 30) + '...'
      });
      
      setMessages(prev => {
        // ✅ REMOVER MENSAJE OPTIMISTA si existe
        const filteredMessages = prev.filter(msg => 
          !msg.isOptimistic || msg._id !== `temp_${message.timestamp}`
        );
        
        const newMessages = [...filteredMessages, message];
        
        // Persistir mensajes actualizados
        persistChatState(currentChat, newMessages);
        
        return newMessages;
      });
    };

    const handleAgentJoined = (data) => {
      console.log('💬 useLiveChat: 🦸 Agente unido al chat', {
        agente: data.agent?.username,
        roomId: data.chat?.roomId
      });
      
      setCurrentChat(prev => {
        const updatedChat = prev ? { ...prev, ...data.chat } : data.chat;
        persistChatState(updatedChat, messages);
        return updatedChat;
      });
      setLoading(false);
    };

    const handleChatEnded = (data) => {
      console.log('💬 useLiveChat: 🔴 Chat finalizado', data);
      
      setCurrentChat(prev => prev ? { ...prev, status: 'ended' } : null);
      setLoading(false);
      
      // No limpiar inmediatamente, mantener para mostrar mensaje de finalización
      setTimeout(() => {
        setCurrentChat(null);
        setMessages([]);
        clearPersistedData();
      }, 3000);
    };

    const handleUserTyping = (data) => {
      if (data.isTyping && data.userName !== user.username) {
        setIsTyping(true);
        setTypingUser(data.userName || 'Alguien');
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUser('');
        }, 3000);
      } else {
        setIsTyping(false);
        setTypingUser('');
      }
    };

    const handleNewChatWaiting = (data) => {
      if (isAgentOrAdmin()) {
        console.log('💬 useLiveChat: 🆕 Nuevo chat en espera', {
          roomId: data.roomId,
          cliente: data.customer?.username
        });
        
        setActiveChats(prev => {
          const exists = prev.some(chat => chat.roomId === data.roomId);
          if (!exists) {
            return [...prev, data];
          }
          return prev;
        });
      }
    };

    const handleChatTaken = (data) => {
      console.log('💬 useLiveChat: Chat tomado por otro agente', data);
      setActiveChats(prev => prev.filter(chat => chat.roomId !== data.roomId));
    };

    const handleChatError = (errorData) => {
      console.error('💬 useLiveChat: ❌ Error en chat', errorData);
      setLoading(false);
      setError(errorData.error || 'Error en el chat');
      
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
    };

    const handleMessageError = (errorData) => {
      console.error('💬 useLiveChat: ❌ Error en mensaje', errorData);
      setError(errorData.error || 'Error al enviar mensaje');
      
      // Remover mensaje optimista en caso de error
      setMessages(prev => prev.filter(msg => !msg.isOptimistic));
    };

    // Configurar listeners
    liveChatSocket.on('chat_joined', handleChatJoined);
    liveChatSocket.on('new_live_message', handleNewMessage);
    liveChatSocket.on('agent_joined', handleAgentJoined);
    liveChatSocket.on('chat_ended', handleChatEnded);
    liveChatSocket.on('user_typing', handleUserTyping);
    liveChatSocket.on('new_chat_waiting', handleNewChatWaiting);
    liveChatSocket.on('chat_taken', handleChatTaken);
    liveChatSocket.on('chat_error', handleChatError);
    liveChatSocket.on('message_error', handleMessageError);

    return () => {
      console.log('💬 useLiveChat: 🔧 Limpiando listeners del socket');
      
      liveChatSocket.off('chat_joined', handleChatJoined);
      liveChatSocket.off('new_live_message', handleNewMessage);
      liveChatSocket.off('agent_joined', handleAgentJoined);
      liveChatSocket.off('chat_ended', handleChatEnded);
      liveChatSocket.off('user_typing', handleUserTyping);
      liveChatSocket.off('new_chat_waiting', handleNewChatWaiting);
      liveChatSocket.off('chat_taken', handleChatTaken);
      liveChatSocket.off('chat_error', handleChatError);
      liveChatSocket.off('message_error', handleMessageError);
      
      // Limpiar timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
    };
  }, [liveChatSocket, user, isAgentOrAdmin, currentChat, messages, persistChatState, clearPersistedData]);

  // Cleanup general
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    currentChat,
    messages,
    activeChats,
    isTyping,
    typingUser,
    isConnected: isLiveChatConnected,
    connectionStatus,
    loading,
    error,
    
    // Acciones
    joinLiveChat,
    sendMessage,
    joinAsAgent,
    endChat,
    startTyping,
    stopTyping,
    
    // Utilidades
    isAgentOrAdmin: isAgentOrAdmin(),
    clearError: () => setError(''),
    clearPersistedData
  };
};