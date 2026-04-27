// hooks/useTawkTo.js
import { useEffect, useCallback } from 'react';

export const useTawkTo = () => {
  // ⭐ CARGAR EL SCRIPT DE TAWK.TO UNA SOLA VEZ
  useEffect(() => {
    // Evitar cargar múltiples veces
    if (document.getElementById('tawk-script')) return;
    
    // Configurar Tawk_API antes de cargar el script
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    
    const tawkPropertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
    const tawkWidgetId = import.meta.env.VITE_TAWK_WIDGET_ID;
    
    if (!tawkPropertyId || !tawkWidgetId) {
      console.warn('⚠️ Tawk.to IDs no configurados');
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'tawk-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    document.body.appendChild(script);
    
    console.log('✅ Tawk.to script cargado');
  }, []);

  const openChat = useCallback((message = '') => {
    if (window.Tawk_API) {
      window.Tawk_API.maximize();
      
      if (message) {
        setTimeout(() => {
          window.Tawk_API.sendMessage(message);
        }, 1000);
      }
    } else {
      console.warn('⏳ Tawk_API no disponible todavía');
    }
  }, []);

  const closeChat = useCallback(() => {
    if (window.Tawk_API) {
      window.Tawk_API.minimize();
    }
  }, []);

  const toggleChat = useCallback(() => {
    if (window.Tawk_API) {
      window.Tawk_API.toggle();
    }
  }, []);

  const setUser = useCallback((userData) => {
    if (window.Tawk_API && userData) {
      try {
        window.Tawk_API.setAttributes({
          name: userData.name || userData.username,
          email: userData.email || '',
          userId: userData._id || userData.id,
          'Juego Principal': userData.preferredGame || '',
          'Rango Actual': userData.currentRank || '',
          'Total Pedidos': userData.totalOrders || 0
        });
      } catch (error) {
        console.error('Error seteando atributos Tawk:', error);
      }
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (window.Tawk_API) {
      window.Tawk_API.sendMessage(message);
    }
  }, []);

  const isLoaded = useCallback(() => {
    return typeof window.Tawk_API !== 'undefined';
  }, []);

  return {
    openChat,
    closeChat,
    toggleChat,
    setUser,
    sendMessage,
    isLoaded
  };
};

export default useTawkTo;