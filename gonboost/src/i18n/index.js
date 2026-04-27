// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/en.json';
import es from './translations/es.json';
import de from './translations/de.json';
import fr from './translations/fr.json';
import nl from './translations/nl.json';
import pt from './translations/pt.json';
import ru from './translations/ru.json';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'ru'];
export const DEFAULT_LANGUAGE = 'en';

export const languageNames = {
  en: 'English', es: 'Español', de: 'Deutsch',
  fr: 'Français', nl: 'Nederlands', pt: 'Português', ru: 'Русский'
};

export const languageFlags = {
  en: '🇺🇸', es: '🇪🇸', de: '🇩🇪', fr: '🇫🇷',
  nl: '🇳🇱', pt: '🇧🇷', ru: '🇷🇺'
};

export const seoConfig = {
  en: { htmlLang: 'en', urlPrefix: '' },
  es: { htmlLang: 'es', urlPrefix: '/es' },
  de: { htmlLang: 'de', urlPrefix: '/de' },
  fr: { htmlLang: 'fr', urlPrefix: '/fr' },
  nl: { htmlLang: 'nl', urlPrefix: '/nl' },
  pt: { htmlLang: 'pt', urlPrefix: '/pt' },
  ru: { htmlLang: 'ru', urlPrefix: '/ru' }
};

// ✅ Detectar idioma inicial — URL tiene prioridad sobre localStorage
const pathLang = window.location.pathname.split('/')[1];
const initialLang = SUPPORTED_LANGUAGES.includes(pathLang)
  ? pathLang
  : (localStorage.getItem('preferredLanguage') || DEFAULT_LANGUAGE);

// ✅ Sincronizar localStorage con URL inmediatamente
if (SUPPORTED_LANGUAGES.includes(pathLang)) {
  localStorage.setItem('preferredLanguage', pathLang);
}

// ✅ Solo inicializar si no está ya inicializado (evita duplicados con Vite HMR)
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        de: { translation: de },
        fr: { translation: fr },
        nl: { translation: nl },
        pt: { translation: pt },
        ru: { translation: ru }
      },
      lng: initialLang,
      fallbackLng: DEFAULT_LANGUAGE,
      debug: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false }
    });
}

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = seoConfig[lng]?.htmlLang || lng;
  localStorage.setItem('preferredLanguage', lng);
});

// Requerido por App.jsx — no hace nada porque traducciones cargan síncronamente
export async function preloadLanguages() {
  return Promise.resolve();
}

export function getLocalizedUrl(path = '/', targetLang = DEFAULT_LANGUAGE) {
  const regex = new RegExp(`^/(${SUPPORTED_LANGUAGES.join('|')})(/|$)`);
  const cleanPath = path.replace(regex, '/');
  if (targetLang === DEFAULT_LANGUAGE) return cleanPath || '/';
  return `/${targetLang}${cleanPath === '/' ? '' : cleanPath}`;
}

export function getLanguageFromUrl(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(segment) ? segment : DEFAULT_LANGUAGE;
}

export default i18n;
