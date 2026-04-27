// backend/controllers/liveChatController.js
import LiveChat from '../models/LiveChat.js';

// Obtener chats activos para agentes
export const getActiveChats = async (req, res) => {
  try {
    const chats = await LiveChat.find({ 
      status: { $in: ['waiting', 'in_progress', 'active'] } 
    })
    .populate('participants.user', 'username role')
    .populate('assignedAgent', 'username role')
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active chats'
    });
  }
};

// Obtener historial de chats para un usuario
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const chats = await LiveChat.find({
      'participants.user': userId
    })
    .populate('participants.user', 'username role')
    .populate('assignedAgent', 'username role')
    .populate('messages.sender', 'username role')
    .sort({ lastActivity: -1 });

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history'
    });
  }
};

// Obtener un chat específico
export const getChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const chat = await LiveChat.findOne({ roomId })
      .populate('participants.user', 'username role')
      .populate('assignedAgent', 'username role')
      .populate('messages.sender', 'username role');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat no encontrado'
      });
    }

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat'
    });
  }
};

// Eliminar chat (admin only)
export const deleteChat = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    await LiveChat.findOneAndDelete({ roomId });

    res.json({
      success: true,
      message: 'Chat eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting chat'
    });
  }
};