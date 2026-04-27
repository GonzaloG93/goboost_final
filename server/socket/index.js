// backend/socket/liveChat.js
import LiveChat from '../models/LiveChat.js';

export const setupLiveChatSocket = (io) => {
  const liveChatNamespace = io.of('/live-chat');
  
  liveChatNamespace.on('connection', (socket) => {
    console.log('🔵 Usuario conectado a Live Chat:', socket.id, socket.username);
    
    // Unirse a una sala de chat (tu código existente se mantiene igual)
    socket.on('join_live_chat', async (data) => {
      // ... (tu código existente)
    });

    // Enviar mensaje (tu código existente se mantiene igual)
    socket.on('send_live_message', async (data) => {
      // ... (tu código existente)
    });

    // Agente se une al chat (tu código existente se mantiene igual)
    socket.on('agent_join_chat', async (data) => {
      // ... (tu código existente)
    });

    // Finalizar chat (tu código existente se mantiene igual)
    socket.on('end_live_chat', async (data) => {
      // ... (tu código existente)
    });

    // Transferir chat (tu código existente se mantiene igual)
    socket.on('transfer_chat', async (data) => {
      // ... (tu código existente)
    });

    // ✅ CORREGIDO: Indicador de typing
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      const userName = socket.username;
      console.log('⌨️ Typing start:', userName, 'en room:', roomId);
      socket.to(roomId).emit('user_typing', { 
        userName, 
        isTyping: true 
      });
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      console.log('⏹️ Typing stop en room:', roomId);
      socket.to(roomId).emit('user_typing', { 
        isTyping: false 
      });
    });

    // Manejar desconexión (tu código existente se mantiene igual)
    socket.on('disconnect', async () => {
      // ... (tu código existente)
    });
  });
};