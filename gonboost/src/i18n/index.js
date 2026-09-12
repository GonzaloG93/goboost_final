// src/i18n/index.js - VERSIÓN FINAL CORREGIDA
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones (carga síncrona)
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';
import ptTranslations from './translations/pt.json';
import ruTranslations from './translations/ru.json';
import deTranslations from './translations/de.json';
import frTranslations from './translations/fr.json';
import nlTranslations from './translations/nl.json';

// Configuración SEO por idioma
export const seoConfig = {
  en: { htmlLang: 'en', hreflang: 'en', country: 'US', urlPrefix: '' },
  es: { htmlLang: 'es', hreflang: 'es', country: 'ES', urlPrefix: '/es' },
  de: { htmlLang: 'de', hreflang: 'de', country: 'DE', urlPrefix: '/de' },
  fr: { htmlLang: 'fr', hreflang: 'fr', country: 'FR', urlPrefix: '/fr' },
  nl: { htmlLang: 'nl', hreflang: 'nl', country: 'NL', urlPrefix: '/nl' },
  pt: { htmlLang: 'pt', hreflang: 'pt', country: 'BR', urlPrefix: '/pt' },
  ru: { htmlLang: 'ru', hreflang: 'ru', country: 'RU', urlPrefix: '/ru' }
};

// Idiomas soportados
export const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'ru'];
export const DEFAULT_LANGUAGE = 'en';

// Nombres de idiomas para mostrar
export const languageNames = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  nl: 'Nederlands',
  pt: 'Português',
  ru: 'Русский'
};

// Banderas para cada idioma
export const languageFlags = {
  en: '🇺🇸',
  es: '🇪🇸',
  de: '🇩🇪',
  fr: '🇫🇷',
  nl: '🇳🇱',
  pt: '🇧🇷',
  ru: '🇷🇺'
};

// Inicializar i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      de: { translation: deTranslations },
      fr: { translation: frTranslations },
      nl: { translation: nlTranslations },
      pt: { translation: ptTranslations },
      ru: { translation: ruTranslations }
    },
    // 🟢 Se quitó "lng: DEFAULT_LANGUAGE" para permitir que LanguageDetector y changeLanguage funcionen
    fallbackLng: DEFAULT_LANGUAGE,
    // 🟢 Evita que i18n.language termine siendo "en-US", "es-AR", etc.
    // (el navegador puede devolver el código regional completo, pero tus
    // recursos y tu SUPPORTED_LANGUAGES solo manejan códigos cortos)
    supportedLngs: SUPPORTED_LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    debug: import.meta.env.DEV,
    defaultNS: 'translation',
    ns: ['translation'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage',
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
    }
  });

// Listener para depuración
i18n.on('languageChanged', (lng) => {
  console.log(`🌐 Idioma cambiado a: ${lng} (${languageNames[lng]})`);
  console.log(`📦 Recursos para ${lng} cargados:`, i18n.hasResourceBundle(lng, 'translation'));
  document.documentElement.lang = seoConfig[lng]?.htmlLang || lng;
  localStorage.setItem('preferredLanguage', lng);
});

// Precargar todos los idiomas
export const preloadLanguages = async () => {
  const promises = SUPPORTED_LANGUAGES.map(lang => {
    if (!i18n.hasResourceBundle(lang, 'translation')) {
      return i18n.loadNamespaces(lang);
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
  console.log('✅ Todos los idiomas precargados');
};

export const getLocalizedUrl = (path, targetLang) => {
  if (!path) return '/';

  const allLangs = SUPPORTED_LANGUAGES.join('|');
  const pathWithoutLang = path.replace(
    new RegExp(`^\\/(${allLangs})(\\/|$)`),
    '/'
  );

  if (targetLang === DEFAULT_LANGUAGE) {
    return pathWithoutLang || '/';
  }

  const cleanPath = pathWithoutLang === '/' ? '' : pathWithoutLang;
  return `/${targetLang}${cleanPath}`;
};

export const getLanguageFromUrl = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  return (firstSegment && SUPPORTED_LANGUAGES.includes(firstSegment)) ? firstSegment : 'en';
};

export const generateHreflangTags = (currentPath, baseUrl = 'https://gonboost.com') => {
  const allLangs = SUPPORTED_LANGUAGES.join('|');
  const langRegex = new RegExp(`^\\/(${allLangs})(\\/|$)`);

  const cleanPath = currentPath.replace(langRegex, '/');

  const tags = SUPPORTED_LANGUAGES.map(lang => {
    const url = lang === DEFAULT_LANGUAGE
      ? `${baseUrl}${cleanPath}`
      : `${baseUrl}/${lang}${cleanPath === '/' ? '' : cleanPath}`;

    return {
      lang,
      url: url.replace(/\/+/g, '/').replace(/\/$/, '') || `${baseUrl}/`
    };
  });

  tags.push({
    lang: 'x-default',
    url: (`${baseUrl}${cleanPath}`).replace(/\/+/g, '/').replace(/\/$/, '') || `${baseUrl}/`
  });

  return tags;
};

export default i18n;