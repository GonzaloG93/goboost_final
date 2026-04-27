// components/TawkToWidget.jsx - VERSIÓN OPTIMIZADA PARA PRODUCCIÓN
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const TawkToWidget = () => {
  const { user } = useAuth();
  const tawkInitialized = useRef(false);
  const isDev = import.meta.env.DEV;
  
  const TAWK_TO_SITE_ID = '6912f9da5a12d3195c19478b';
  const TAWK_TO_WIDGET_ID = '1j9p1vvlo';

  // Función de log condicional
  const devLog = (...args) => {
    if (isDev) {
      console.log(...args);
    }
  };

  useEffect(() => {
    if (tawkInitialized.current || window.Tawk_API) {
      return;
    }

    devLog(`🔄 Inicializando Tawk.to...`);

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = function() {
      devLog('✅ Tawk.to completamente cargado');
      tawkInitialized.current = true;
      
      if (window.Tawk_API && window.Tawk_API.$_Tawk) {
        if (!window.Tawk_API.$_Tawk.i18next) {
          window.Tawk_API.$_Tawk.i18next = {
            t: (key) => key,
            language: 'es'
          };
        }
      }
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_TO_SITE_ID}/${TAWK_TO_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    script.onload = () => {
      devLog('✅ Script de Tawk.to cargado');
      
      const checkTawkReady = setInterval(() => {
        if (window.Tawk_API && window.Tawk_API.isVisitorEngaged) {
          clearInterval(checkTawkReady);
          if (window.Tawk_API.onLoad) {
            window.Tawk_API.onLoad();
          }
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkTawkReady);
      }, 5000);
    };

    script.onerror = (error) => {
      console.error('❌ Error crítico cargando Tawk.to:', error);
      tawkInitialized.current = false;
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode === document.head) {
        document.head.removeChild(script);
      }
      tawkInitialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !window.Tawk_API) return;

    const identifyUser = () => {
      try {
        const userAttributes = {
          name: user.name || user.username || 'Usuario',
          email: user.email || 'no-email@ejemplo.com'
        };

        if (user._id) userAttributes.userId = user._id;
        if (user.preferredGame) userAttributes.preferredGame = user.preferredGame;
        if (user.currentRank) userAttributes.currentRank = user.currentRank;

        if (typeof window.Tawk_API.setAttributes === 'function') {
          window.Tawk_API.setAttributes(userAttributes, (error) => {
            if (error && isDev) {
              console.warn('⚠️ No se pudo identificar usuario:', error);
            } else if (isDev) {
              devLog('✅ Usuario identificado en Tawk.to:', userAttributes.name);
            }
          });
        } else if (isDev) {
          console.warn('⚠️ setAttributes no disponible en Tawk_API');
        }
      } catch (error) {
        console.error('❌ Error en identificación de usuario:', error);
      }
    };

    if (tawkInitialized.current) {
      identifyUser();
    } else {
      const timer = setTimeout(identifyUser, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return null;
};

export default TawkToWidget;