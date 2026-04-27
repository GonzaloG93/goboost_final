import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const initialState = {
  isChatOpen: false,
  messages: [],
  isConnected: false,
  typingUsers: [],
  unreadCount: 0,
  currentRoom: 'general'
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return {
        ...state,
        isChatOpen: !state.isChatOpen,
        unreadCount: !state.isChatOpen ? 0 : state.unreadCount
      };
    
    case 'OPEN_CHAT':
      return {
        ...state,
        isChatOpen: true,
        unreadCount: 0
      };
    
    case 'CLOSE_CHAT':
      return {
        ...state,
        isChatOpen: false
      };
    
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload
      };
    
    case 'ADD_MESSAGE':
      const newMessage = action.payload;
      const messageExists = state.messages.some(msg => 
        msg._id === newMessage._id || 
        (msg.timestamp === newMessage.timestamp && msg.userId === newMessage.userId)
      );
      
      if (messageExists) return state;
      
      return {
        ...state,
        messages: [...state.messages, newMessage].slice(-100), // Keep last 100 messages
        unreadCount: !state.isChatOpen ? state.unreadCount + 1 : 0
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        unreadCount: 0
      };
    
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: [...new Set([...state.typingUsers, action.payload])]
      };
    
    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(user => user.userId !== action.payload)
      };
    
    case 'CLEAR_TYPING_USERS':
      return {
        ...state,
        typingUsers: []
      };
    
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected: socketConnected } = useSocket();
  const { user } = useAuth();

  // Sync connection status
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: socketConnected });
  }, [socketConnected]);

  // Socket event handlers
  const handleReceiveMessage = useCallback((message) => {
    console.log('📨 Mensaje recibido en chat:', message);
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  const handleUserTyping = useCallback((userData) => {
    if (userData.userId !== user?._id) {
      dispatch({ type: 'ADD_TYPING_USER', payload: userData });
    }
  }, [user?._id]);

  const handleUserStopTyping = useCallback((userId) => {
    dispatch({ type: 'REMOVE_TYPING_USER', payload: userId });
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const events = {
      support_message: handleReceiveMessage,
      user_reply_sent: handleReceiveMessage,
      chat_message: handleReceiveMessage,
      user_typing: handleUserTyping,
      user_stop_typing: handleUserStopTyping
    };

    // Register event listeners
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Join chat room
    socket.emit('join_room', 'live_chat');

    return () => {
      // Cleanup event listeners
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, handleReceiveMessage, handleUserTyping, handleUserStopTyping]);

  // Chat actions
  const actions = {
    toggleChat: useCallback(() => dispatch({ type: 'TOGGLE_CHAT' }), []),
    openChat: useCallback(() => dispatch({ type: 'OPEN_CHAT' }), []),
    closeChat: useCallback(() => dispatch({ type: 'CLOSE_CHAT' }), []),
    clearMessages: useCallback(() => dispatch({ type: 'CLEAR_MESSAGES' }), []),
    clearTypingUsers: useCallback(() => dispatch({ type: 'CLEAR_TYPING_USERS' }), []),

    sendMessage: useCallback((message) => {
      if (socket?.connected && user && message.trim()) {
        const messageData = {
          content: message.trim(),
          userId: user._id,
          username: user.username || user.email,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
          room: 'live_chat'
        };
        
        console.log('📤 Enviando mensaje de chat:', messageData);
        socket.emit('chat_message', messageData);
      }
    }, [socket, user]),

    startTyping: useCallback(() => {
      if (socket?.connected && user) {
        socket.emit('typing', {
          userId: user._id,
          username: user.username || user.email
        });
      }
    }, [socket, user]),

    stopTyping: useCallback(() => {
      if (socket?.connected && user) {
        socket.emit('stop_typing', user._id);
      }
    }, [socket, user])
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat debe ser usado dentro de ChatProvider');
  }
  return context;
};

export default ChatContext;