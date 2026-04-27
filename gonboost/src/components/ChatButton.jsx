// components/ChatButton.jsx
import { useTawkTo } from '../hooks/useTawkTo';

const ChatButton = () => {
  const { openChat } = useTawkTo();

  return (
    <button
      onClick={() => openChat()}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 transform hover:scale-110 group"
      style={{ 
        background: 'linear-gradient(135deg, #ff6b00, #ff3d00)',
        boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)'
      }}
      title="Soporte de Boosting"
    >
      <svg 
        className="w-6 h-6 group-hover:animate-bounce" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      
      {/* Badge de notificación */}
      <div className="absolute -top-1 -right-1 bg-green-500 text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
        <span>!</span>
      </div>
    </button>
  );
};

export default ChatButton;