// backend/socket/liveChat.js - CON AUTENTICACIÓN (ES MODULES)
import LiveChat from '../models/LiveChat.js';

export const setupLiveChatSocket = (io, socketAuthMiddleware) => {
  const liveChatNamespace = io.of('/live-chat');
  
  // ✅ APLICAR MIDDLEWARE DE AUTENTICACIÓN AL NAMESPACE LIVE-CHAT
  liveChatNamespace.use(socketAuthMiddleware);
  
  liveChatNamespace.on('connection', (socket) => {
    console.log('🔵 Usuario AUTENTICADO conectado a Live Chat:', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
      role: socket.userRole
    });
    
    // Unirse a una sala de chat
    socket.on('join_live_chat', async (data) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;
        const userRole = socket.userRole;
        const username = socket.username;
        
        console.log('🟡 join_live_chat - USUARIO AUTENTICADO:', { 
          userId, 
          username, 
          userRole, 
          roomId 
        });

        // Si es un nuevo chat (customer sin roomId)
        if (!roomId && userRole === 'customer') {
          const newChat = new LiveChat({
            roomId: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            participants: [{
              user: userId,
              role: userRole,
              isOnline: true
            }],
            status: 'waiting',
            customer: userId
          });
          
          await newChat.save();
          socket.roomId = newChat.roomId;
          socket.join(newChat.roomId);
          
          console.log('🟢 Nuevo chat creado:', newChat.roomId, 'por cliente:', username);
          
          socket.emit('chat_joined', { 
            success: true, 
            roomId: newChat.roomId,
            chat: newChat 
          });
          
          // Notificar a agentes que hay un nuevo chat en espera
          liveChatNamespace.emit('new_chat_waiting', {
            roomId: newChat.roomId,
            customer: { 
              userId, 
              username,
              role: userRole
            },
            createdAt: new Date()
          });
          
          console.log('📢 Notificación new_chat_waiting enviada a agentes');
          
        } else if (roomId) {
          // Unirse a chat existente
          socket.roomId = roomId;
          socket.join(roomId);
          
          const chat = await LiveChat.findOne({ roomId })
            .populate('participants.user', 'username role')
            .populate('assignedAgent', 'username role')
            .populate('messages.sender', 'username role');
            
          if (chat) {
            // Agregar participante si no existe
            const existingParticipant = chat.participants.find(
              p => p.user._id.toString() === userId
            );
            
            if (!existingParticipant) {
              chat.participants.push({
                user: userId,
                role: userRole,
                isOnline: true
              });
              await chat.save();
            }

            // Actualizar estado si un agente se une a un chat en espera
            if ((userRole === 'agent' || userRole === 'admin') && chat.status === 'waiting') {
              chat.status = 'in_progress';
              chat.assignedAgent = userId;
              await chat.save();
              
              console.log('🦸 Agente asignado al chat:', username, '->', roomId);
              
              // Notificar a todos que un agente se unió
              liveChatNamespace.to(roomId).emit('agent_joined', {
                agent: { 
                  _id: userId, 
                  username,
                  role: userRole 
                },
                chat: chat
              });
            }
            
            const updatedChat = await LiveChat.findOne({ roomId })
              .populate('participants.user', 'username role')
              .populate('assignedAgent', 'username role')
              .populate('messages.sender', 'username role');
            
            socket.emit('chat_joined', { 
              success: true, 
              roomId, 
              chat: updatedChat
            });

            console.log('✅ Usuario unido a chat existente:', username, '->', roomId);
          } else {
            socket.emit('chat_error', { error: 'Chat no encontrado' });
          }
        }
      } catch (error) {
        console.error('❌ Error en join_live_chat:', error);
        socket.emit('chat_error', { error: 'Error al unirse al chat: ' + error.message });
      }
    });

    // Enviar mensaje
    socket.on('send_live_message', async (data) => {
      try {
        const { roomId, message, messageType = 'text' } = data;
        const senderId = socket.userId;
        const senderName = socket.username;
        const senderRole = socket.userRole;
        
        console.log('📤 send_live_message - USUARIO AUTENTICADO:', { 
          roomId, 
          senderId, 
          senderName, 
          senderRole,
          message 
        });

        const chat = await LiveChat.findOne({ roomId });
        if (!chat) {
          socket.emit('message_error', { error: 'Chat no encontrado' });
          return;
        }

        const newMessage = {
          sender: senderId,
          message,
          messageType,
          timestamp: new Date()
        };

        chat.messages.push(newMessage);
        chat.lastActivity = new Date();
        await chat.save();

        // Populate el mensaje para enviarlo
        const populatedChat = await LiveChat.findOne({ roomId })
          .populate('messages.sender', 'username role');

        const lastMessage = populatedChat.messages[populatedChat.messages.length - 1];

        // Emitir mensaje a todos en la sala
        liveChatNamespace.to(roomId).emit('new_live_message', {
          _id: lastMessage._id,
          sender: {
            _id: lastMessage.sender._id,
            username: lastMessage.sender.username,
            role: lastMessage.sender.role
          },
          message: lastMessage.message,
          messageType: lastMessage.messageType,
          timestamp: lastMessage.timestamp
        });

        console.log('✅ Mensaje enviado a room:', roomId, 'por:', senderName);

      } catch (error) {
        console.error('❌ Error en send_live_message:', error);
        socket.emit('message_error', { error: 'Error al enviar mensaje: ' + error.message });
      }
    });

    // Agente se une al chat
    socket.on('agent_join_chat', async (data) => {
      try {
        const { roomId } = data;
        const agentId = socket.userId;
        const agentName = socket.username;
        const agentRole = socket.userRole;
        
        console.log('🦸 agent_join_chat - AGENTE AUTENTICADO:', { 
          roomId, 
          agentId, 
          agentName,
          agentRole 
        });

        // Verificar que el usuario tiene permisos de agente
        if (agentRole !== 'agent' && agentRole !== 'admin') {
          socket.emit('chat_error', { error: 'No tienes permisos de agente' });
          return;
        }

        const chat = await LiveChat.findOne({ roomId });
        if (!chat) {
          socket.emit('chat_error', { error: 'Chat no encontrado' });
          return;
        }

        chat.assignedAgent = agentId;
        chat.status = 'in_progress';
        
        // Agregar agente como participante si no existe
        const existingAgent = chat.participants.find(
          p => p.user.toString() === agentId
        );
        if (!existingAgent) {
          chat.participants.push({
            user: agentId,
            role: 'agent',
            isOnline: true
          });
        }

        await chat.save();

        // Notificar a todos en la sala que un agente se unió
        liveChatNamespace.to(roomId).emit('agent_joined', {
          agent: { 
            _id: agentId, 
            username: agentName,
            role: agentRole 
          },
          chat: await LiveChat.findOne({ roomId })
            .populate('participants.user', 'username role')
            .populate('assignedAgent', 'username role')
        });

        // Notificar que el chat ya no está en espera
        liveChatNamespace.emit('chat_taken', { roomId });

        console.log('✅ Agente unido al chat:', agentName, '->', roomId);

      } catch (error) {
        console.error('❌ Error en agent_join_chat:', error);
        socket.emit('chat_error', { error: 'Error al unirse como agente: ' + error.message });
      }
    });

    // Finalizar chat
    socket.on('end_live_chat', async (data) => {
      try {
        const { roomId } = data;
        const endedBy = socket.userId;
        const endedByName = socket.username;
        
        console.log('🔴 end_live_chat - USUARIO AUTENTICADO:', { 
          roomId, 
          endedBy,
          endedByName 
        });

        const chat = await LiveChat.findOne({ roomId });
        if (chat) {
          chat.status = 'ended';
          chat.endedAt = new Date();
          chat.endedBy = endedBy;
          await chat.save();

          liveChatNamespace.to(roomId).emit('chat_ended', {
            endedBy: {
              _id: endedBy,
              username: endedByName
            },
            endedAt: chat.endedAt
          });

          console.log('🔴 Chat finalizado:', roomId, 'por:', endedByName);
        }
      } catch (error) {
        console.error('❌ Error en end_live_chat:', error);
      }
    });

    // Transferir chat
    socket.on('transfer_chat', async (data) => {
      try {
        const { roomId, toAgentId } = data;
        const fromAgentId = socket.userId;
        const fromAgentName = socket.username;
        
        console.log('🔄 transfer_chat - AGENTE AUTENTICADO:', { 
          roomId, 
          fromAgentId, 
          fromAgentName, 
          toAgentId 
        });

        const chat = await LiveChat.findOne({ roomId });
        if (chat) {
          chat.assignedAgent = toAgentId;
          chat.status = 'transferred';
          await chat.save();

          liveChatNamespace.to(roomId).emit('chat_transferred', {
            fromAgentId,
            toAgentId
          });

          console.log('🔄 Chat transferido:', roomId, 'de', fromAgentName, 'a', toAgentId);
        }
      } catch (error) {
        console.error('❌ Error en transfer_chat:', error);
      }
    });

    // Indicador de typing
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      const userName = socket.username;
      const userRole = socket.userRole;
      
      console.log('✍️  typing_start:', { roomId, userName, userRole });
      
      socket.to(roomId).emit('user_typing', { 
        userName, 
        userRole,
        isTyping: true 
      });
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      console.log('✍️  typing_stop:', roomId);
      
      socket.to(roomId).emit('user_typing', { isTyping: false });
    });

    // Manejar desconexión
    socket.on('disconnect', async () => {
      console.log('🔴 Usuario AUTENTICADO desconectado de Live Chat:', {
        username: socket.username,
        userId: socket.userId,
        role: socket.userRole
      });
      
      if (socket.roomId) {
        // Marcar como offline en el chat
        try {
          const chat = await LiveChat.findOne({ roomId: socket.roomId });
          if (chat) {
            const participant = chat.participants.find(
              p => p.user.toString() === socket.userId
            );
            if (participant) {
              participant.isOnline = false;
              await chat.save();
              console.log('📱 Usuario marcado como offline en chat:', socket.roomId);
            }
          }
        } catch (error) {
          console.error('Error actualizando estado offline:', error);
        }
      }
    });
  });
};

// Exportación ES6 por defecto
export default setupLiveChatSocket;