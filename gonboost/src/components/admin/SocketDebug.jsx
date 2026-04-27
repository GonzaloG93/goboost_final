// src/components/admin/SocketDebug.jsx - VERSIÓN CORREGIDA
import React from 'react';
import { useSocket } from '../../context/SocketContext';

const SocketDebug = () => {
  const { isConnected, connectionError, reconnect, getStatus } = useSocket();
  
  const status = getStatus ? getStatus() : { connected: false, authenticated: false };

  // No mostrar cuando está conectado sin errores en producción
  if (isConnected && !connectionError && process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-gray-900 text-white rounded-xl shadow-lg border border-gray-700 max-w-sm">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {isConnected ? 'Socket: CONECTADO' : 'Socket: DESCONECTADO'}
          </p>
          {connectionError && (
            <p className="text-xs text-red-300 mt-1 truncate">{connectionError}</p>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded ${status.authenticated ? 'bg-green-500' : 'bg-red-500'}`}>
              Auth: {status.authenticated ? '✅' : '❌'}
            </span>
            <span className="text-xs text-gray-400">
              ID: {status.socketId ? `${status.socketId.slice(0, 8)}...` : 'N/A'}
            </span>
          </div>
        </div>

        {!isConnected && (
          <button 
            onClick={reconnect}
            className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <span className="mr-1">🔄</span>
            Reconectar
          </button>
        )}
      </div>
    </div>
  );
};

export default SocketDebug;