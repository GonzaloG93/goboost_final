// src/components/admin/RealTimeStatus.jsx - VERSIÓN CORREGIDA
import React from 'react';
import { useSocket } from '../../context/SocketContext';

const RealTimeStatus = () => {
  const { isConnected, connectionError, reconnect } = useSocket();

  // No mostrar cuando está conectado sin errores
  if (isConnected && !connectionError) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
      isConnected 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isConnected ? 'Real-time Sync: ACTIVE' : 'Sync: DISCONNECTED'}
          </p>
          {connectionError && (
            <p className="text-xs opacity-75 mt-1">{connectionError}</p>
          )}
        </div>

        {!isConnected && (
          <button
            onClick={reconnect}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
};

export default RealTimeStatus;