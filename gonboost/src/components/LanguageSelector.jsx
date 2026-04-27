// src/components/LanguageSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { FaGlobe, FaCheck } from 'react-icons/fa';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  languageNames,
  languageFlags,
  getLocalizedUrl
} from '../i18n';

const languages = [
  { code: 'en', name: languageNames.en, flag: languageFlags.en, short: 'EN' },
  { code: 'es', name: languageNames.es, flag: languageFlags.es, short: 'ES' },
  { code: 'de', name: languageNames.de, flag: languageFlags.de, short: 'DE' },
  { code: 'fr', name: languageNames.fr, flag: languageFlags.fr, short: 'FR' },
  { code: 'nl', name: languageNames.nl, flag: languageFlags.nl, short: 'NL' },
  { code: 'pt', name: languageNames.pt, flag: languageFlags.pt, short: 'PT' },
  { code: 'ru', name: languageNames.ru, flag: languageFlags.ru, short: 'RU' }
];

const LanguageSelector = ({ theme = 'light' }) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = i18n.language || DEFAULT_LANGUAGE;
  const currentLanguage = languages.find((lang) => lang.code === currentLang) || languages[0];
  const isDarkTheme = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    if (langCode === currentLang) {
      setIsOpen(false);
      return;
    }
    const currentPath = location.pathname;
    const newPath = getLocalizedUrl(currentPath, langCode);
    const fullUrl = newPath + location.search + location.hash;
    localStorage.setItem('preferredLanguage', langCode);
    // Recarga total para reemplazar recursos y ruta
    window.location.href = fullUrl;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
          isDarkTheme
            ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            : 'text-white/90 hover:text-white hover:bg-white/10'
        }`}
        aria-label="Select language"
      >
        <FaGlobe className="text-lg" />
        <span className="font-medium hidden sm:inline">{currentLanguage.short}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 py-1 max-h-80 overflow-y-auto ${
            isDarkTheme ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'
          }`}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                currentLang === lang.code
                  ? isDarkTheme
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-blue-900/30 text-blue-300'
                  : isDarkTheme
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
              {currentLang === lang.code && <FaCheck className="text-xs" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;