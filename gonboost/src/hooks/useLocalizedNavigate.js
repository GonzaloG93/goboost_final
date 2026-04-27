// src/hooks/useLocalizedNavigate.js
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const localizedNavigate = (to, options) => {
    const currentLang = i18n.language;
    const langPrefixes = ['/en', '/es', '/de', '/fr', '/nl', '/pt', '/ru'];
    const hasLangPrefix = langPrefixes.some(prefix =>
      to === prefix || to.startsWith(prefix + '/')
    );
    if (hasLangPrefix) {
      navigate(to, options);
      return;
    }
    const prefix = currentLang === 'en' ? '' : `/${currentLang}`;
    const path = to.startsWith('/') ? to : `/${to}`;
    navigate(`${prefix}${path}`, options);
  };

  return localizedNavigate;
};