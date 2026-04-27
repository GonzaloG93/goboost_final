// components/SocketStatusIndicator.jsx
import React from 'react';
import { useSocket } from '../context/SocketContext';

const SocketStatusIndicator = () => {
  const { isConnected, connectionError, isInitialized, getStatus } = useSocket();
  
  // Solo mostrar en desarrollo o para admin
  if (process.env.NODE_ENV === 'production' && !getStatus().authenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-white shadow-lg rounded-full px-4 py-2 border">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-xs font-medium">
          {isConnected ? 'Conectado' : connectionError ? 'Error' : 'Desconectado'}
        </span>
      </div>
    </div>
  );
};

export default SocketStatusIndicator;