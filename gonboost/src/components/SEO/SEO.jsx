// frontend/src/components/SEO/SEO.jsx
// VERSIÓN CORREGIDA - SIN ERRORES DE SINTAXIS
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  schema,
  noIndex = false,
  children
}) => {
  const location = useLocation();
  const { i18n } = useTranslation();
  
  const baseUrl = import.meta.env.PROD ? 'https://gonboost.com' : 'http://localhost:3000';
  const currentLanguage = i18n.language || 'en';
  
  // Construir URL canónica
  const canonicalUrl = canonical 
    ? (canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`)
    : `${baseUrl}${location.pathname}`;
  
  // Idiomas soportados
  const languages = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'ru'];
  
  // Imagen OG por defecto
  const defaultOgImage = `${baseUrl}/images/og-gonboost.jpg`;
  const finalOgImage = ogImage 
    ? (ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`)
    : defaultOgImage;
  
  // Construir meta keywords
  const defaultKeywords = 'boosting, elo boost, game boosting, professional boost, gonboost';
  const finalKeywords = keywords || defaultKeywords;
  
  // Construir title completo
  const fullTitle = title?.includes('Gonboost') ? title : `${title || 'Gonboost'} - Professional Boosting Services`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* hreflang para todos los idiomas */}
      {languages.map((lang) => {
        let langUrl;
        if (canonical) {
          // Si hay canonical personalizado, reemplazar el prefijo de idioma
          const urlWithoutLang = canonical.replace(/^https?:\/\/[^/]+\/(es|en|de|fr|nl|pt|ru)/, baseUrl);
          langUrl = lang === 'en' 
            ? `${baseUrl}${urlWithoutLang}`
            : `${baseUrl}/${lang}${urlWithoutLang}`;
        } else {
          // Usar pathname actual
          const pathWithoutLang = location.pathname.replace(/^\/(es|en|de|fr|nl|pt|ru)/, '');
          langUrl = lang === 'en' 
            ? `${baseUrl}${pathWithoutLang}`
            : `${baseUrl}/${lang}${pathWithoutLang}`;
        }
        // Limpiar slashes duplicados
        langUrl = langUrl.replace(/([^:]\/)\/+/g, '$1');
        
        return (
          <link 
            key={lang} 
            rel="alternate" 
            hrefLang={lang} 
            href={langUrl} 
          />
        );
      })}
      
      {/* x-default hreflang */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${baseUrl}${location.pathname.replace(/^\/(es|de|fr|nl|pt|ru)/, '')}`.replace(/([^:]\/)\/+/g, '$1')} 
      />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={currentLanguage === 'en' ? 'en_US' : `${currentLanguage}_${currentLanguage.toUpperCase()}`} />
      <meta property="og:site_name" content="Gonboost" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalOgImage} />
      <meta name="twitter:site" content="@gonboost" />
      <meta name="twitter:creator" content="@gonboost" />
      
      {/* Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#0f172a" />
      
      {/* Schema.org */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
      
      {children}
    </Helmet>
  );
};

export default SEO;