
// components/ErrorDisplay.jsx - COMPONENTE REUTILIZABLE
import React from 'react';
import PropTypes from 'prop-types';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = 'Error', 
  showDetails = false,
  className = '' 
}) => {
  const isNetworkError = error?.includes('conexión') || error?.includes('network') || error?.includes('internet');
  const isAuthError = error?.includes('permiso') || error?.includes('autenticación') || error?.includes('auth');
  const isNotFound = error?.includes('no encontrad') || error?.includes('not found');

  const getErrorIcon = () => {
    if (isNetworkError) return '🔌';
    if (isAuthError) return '🔐';
    if (isNotFound) return '🔍';
    return '❌';
  };

  const getErrorMessage = () => {
    if (isNetworkError) return 'Error de conexión. Verifica tu internet.';
    if (isAuthError) return 'Error de autenticación. Por favor, inicia sesión nuevamente.';
    if (isNotFound) return 'El recurso solicitado no existe.';
    return error || 'Ocurrió un error inesperado.';
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0 text-2xl mr-3">
          {getErrorIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            {title}
          </h3>
          <p className="text-red-700 mb-4">
            {getErrorMessage()}
          </p>
          
          {showDetails && error && (
            <div className="mt-3 p-3 bg-red-100 rounded text-sm">
              <p className="font-medium text-red-800 mb-1">Detalles técnicos:</p>
              <code className="text-red-700 text-xs break-all">
                {error}
              </code>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
              >
                <span className="mr-2">🔄</span>
                Reintentar
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Recargar Página
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              ← Volver Atrás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ErrorDisplay.propTypes = {
  error: PropTypes.string,
  onRetry: PropTypes.func,
  title: PropTypes.string,
  showDetails: PropTypes.bool,
  className: PropTypes.string
};

export default ErrorDisplay;
