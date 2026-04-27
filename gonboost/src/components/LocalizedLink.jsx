// src/components/LocalizedLink.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LocalizedLink = ({ to, children, ...props }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  
  const langPrefixes = ['/en', '/es', '/de', '/fr', '/nl', '/pt', '/ru'];
  const hasLangPrefix = langPrefixes.some(prefix => 
    to === prefix || to.startsWith(prefix + '/')
  );
  
  let finalPath = to;
  if (!hasLangPrefix) {
    const prefix = currentLang === 'en' ? '' : `/${currentLang}`;
    const path = to.startsWith('/') ? to : `/${to}`;
    finalPath = `${prefix}${path}`;
  }
  
  return <Link to={finalPath} {...props}>{children}</Link>;
};

export default LocalizedLink;