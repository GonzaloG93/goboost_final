// backend/controllers/chatController.js
export const getOrderChat = async (req, res) => {
  res.json({ messages: [] });
};

export const sendMessage = async (req, res) => {
  res.json({ message: "Mensaje enviado" });
};

export const markAsRead = async (req, res) => {
  res.json({ message: "Marcado como leído" });
};

// Exportación por defecto para compatibilidad
export default {
  getOrderChat,
  sendMessage,
  markAsRead
};