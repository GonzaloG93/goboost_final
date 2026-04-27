// src/hooks/useSeoTranslation.js - CORREGIDO
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

export const useSeoTranslation = () => {
  const { t, i18n, ready } = useTranslation();

  const tSeo = (key, options) => {
    if (!ready) return key;
    
    const translation = t(key, options);
    
    if (translation === key) {
      if (import.meta.env.DEV) {
        console.warn(`Traducción faltante: ${key}`);
      }
      const fallbackKey = key.split('.').pop();
      return t(fallbackKey, options) || fallbackKey;
    }
    
    return translation;
  };

  const seo = useMemo(() => {
    // ✅ URL base automática: producción usa el dominio actual, desarrollo usa localhost
    const baseUrl = import.meta.env.VITE_BASE_URL || 
                    (import.meta.env.PROD ? 'https://gonboost.com' : 'http://localhost:5173');
    
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
    t: tSeo,
    i18n,
    ready,
    seo,
    currentLanguage: i18n.language
  };
};