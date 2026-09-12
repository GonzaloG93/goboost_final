// src/hooks/useSeoTranslation.js - VERSIÓN MEJORADA
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export const useSeoTranslation = () => {
  const { t, i18n, ready } = useTranslation();

  // Función de traducción mejorada con fallbacks
  const tSeo = (key, options) => {
    if (!ready) return key;
    
    const translation = t(key, options);
    
    // Si la traducción no existe, mostrar el key en desarrollo pero no en producción
    if (translation === key) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Traducción faltante: ${key}`);
      }
      // Fallback: intentar con el último segmento del key
      const fallbackKey = key.split('.').pop();
      return t(fallbackKey, options) || fallbackKey;
    }
    
    return translation;
  };

  // Configuración SEO por idioma
  const seo = useMemo(() => {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3001';
    const currentLang = i18n.language || 'es';
    
    const seoConfig = {
      es: {
        htmlLang: 'es',
        hreflang: 'es-ES',
        alternateUrls: [
          { hreflang: 'es-ES', href: `${baseUrl}/es` },
          { hreflang: 'en-US', href: `${baseUrl}/en` },
          { hreflang: 'pt-BR', href: `${baseUrl}/pt` },
          { hreflang: 'ru-RU', href: `${baseUrl}/ru` },
          { hreflang: 'x-default', href: baseUrl }
        ]
      },
      en: {
        htmlLang: 'en',
        hreflang: 'en-US',
        alternateUrls: [
          { hreflang: 'en-US', href: `${baseUrl}/en` },
          { hreflang: 'es-ES', href: `${baseUrl}/es` },
          { hreflang: 'pt-BR', href: `${baseUrl}/pt` },
          { hreflang: 'ru-RU', href: `${baseUrl}/ru` },
          { hreflang: 'x-default', href: baseUrl }
        ]
      },
      pt: {
        htmlLang: 'pt',
        hreflang: 'pt-BR',
        alternateUrls: [
          { hreflang: 'pt-BR', href: `${baseUrl}/pt` },
          { hreflang: 'es-ES', href: `${baseUrl}/es` },
          { hreflang: 'en-US', href: `${baseUrl}/en` },
          { hreflang: 'ru-RU', href: `${baseUrl}/ru` },
          { hreflang: 'x-default', href: baseUrl }
        ]
      },
      ru: {
        htmlLang: 'ru',
        hreflang: 'ru-RU',
        alternateUrls: [
          { hreflang: 'ru-RU', href: `${baseUrl}/ru` },
          { hreflang: 'es-ES', href: `${baseUrl}/es` },
          { hreflang: 'en-US', href: `${baseUrl}/en` },
          { hreflang: 'pt-BR', href: `${baseUrl}/pt` },
          { hreflang: 'x-default', href: baseUrl }
        ]
      }
    };

    return seoConfig[currentLang] || seoConfig.es;
  }, [i18n.language]);

  return {
    t: tSeo, // Usar la función mejorada
    i18n,
    ready,
    seo,
    currentLanguage: i18n.language
  };
};