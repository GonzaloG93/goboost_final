// backend/routes/seo.js - VERSIÓN PRODUCCIÓN MULTILINGÜE
// Soporte para 7 idiomas: en, es, de, fr, nl, pt, ru
import express from 'express';
import BoostService from '../models/BoostService.js';

const router = express.Router();

// ================= CONFIGURACIÓN =================
const BASE_URL = process.env.BASE_URL || 'https://gonboost.com';
const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'ru'];
const DEFAULT_LANGUAGE = 'en';

// Configuración SEO por idioma
const seoConfigByLanguage = {
  en: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Professional Boosting Services for Gamers',
    defaultDescription: 'Improve your rank in Diablo 4, World of Warcraft, Path of Exile and more. Safe, fast, and professional boosting services with verified boosters 24/7.',
    defaultKeywords: 'boosting, elo boost, diablo 4 boost, wow boost, path of exile boost, rank boost, gaming services, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Professional video game boosting services',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost',
      'https://instagram.com/gonboost'
    ]
  },
  es: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Servicios Profesionales de Boosting para Gamers',
    defaultDescription: 'Mejora tu rango en Diablo 4, World of Warcraft, Path of Exile y más. Servicios de boosting seguros, rápidos y profesionales con boosters verificados 24/7.',
    defaultKeywords: 'boosting, elo boost, diablo 4 boost, wow boost, path of exile boost, mejorar rango, servicios gaming, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Servicios profesionales de boosting para videojuegos',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost',
      'https://instagram.com/gonboost'
    ]
  },
  de: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Professionelle Boosting-Dienste für Gamer',
    defaultDescription: 'Verbessere deinen Rang in Diablo 4, World of Warcraft, Path of Exile und mehr. Sichere, schnelle und professionelle Boosting-Dienste mit verifizierten Boostern 24/7.',
    defaultKeywords: 'boosting, elo boost, diablo 4 boost, wow boost, path of exile boost, rang verbessern, gaming dienste, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Professionelle Boosting-Dienste für Videospiele',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost'
    ]
  },
  fr: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Services Professionnels de Boosting pour Gamers',
    defaultDescription: 'Améliorez votre rang dans Diablo 4, World of Warcraft, Path of Exile et plus encore. Services de boosting sécurisés, rapides et professionnels avec des boosters vérifiés 24/7.',
    defaultKeywords: 'boosting, elo boost, diablo 4 boost, wow boost, path of exile boost, améliorer rang, services gaming, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Services professionnels de boosting pour jeux vidéo',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost'
    ]
  },
  nl: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Professionele Boosting Diensten voor Gamers',
    defaultDescription: 'Verbeter je rang in Diablo 4, World of Warcraft, Path of Exile en meer. Veilige, snelle en professionele boosting diensten met geverifieerde boosters 24/7.',
    defaultKeywords: 'boosting, elo boost, diablo 4 boost, wow boost, path of exile boost, rang verbeteren, gaming diensten, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Professionele boosting diensten voor videogames',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost'
    ]
  },
  pt: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Serviços Profissionais de Boosting para Gamers',
    defaultDescription: 'Melhore seu rank em Diablo 4, World of Warcraft, Path of Exile e mais. Serviços de boosting seguros, rápidos e profissionais com boosters verificados 24/7.',
    defaultKeywords: 'boosting, elo boost, diablo 4 boost, wow boost, path of exile boost, melhorar rank, serviços gaming, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Serviços profissionais de boosting para videogames',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost'
    ]
  },
  ru: {
    siteName: 'Gonboost',
    defaultTitle: 'Gonboost - Профессиональный бустинг для геймеров',
    defaultDescription: 'Повысьте свой ранг в Diablo 4, World of Warcraft, Path of Exile и других играх. Безопасный, быстрый и профессиональный бустинг с проверенными бустерами 24/7.',
    defaultKeywords: 'бустинг, буст ранга, diablo 4 буст, wow буст, path of exile буст, повышение ранга, игровые услуги, gonboost',
    organizationName: 'Gonboost',
    organizationDescription: 'Профессиональные услуги бустинга для видеоигр',
    supportEmail: 'support@gonboost.com',
    socialLinks: [
      'https://twitter.com/gonboost',
      'https://discord.gg/gonboost'
    ]
  }
};

// ================= FUNCIONES HELPER =================

// Obtener idioma de la solicitud (query param, header, o default)
const getLanguageFromRequest = (req) => {
  // Prioridad: query param > Accept-Language header > default
  const queryLang = req.query.lang;
  if (queryLang && SUPPORTED_LANGUAGES.includes(queryLang)) {
    return queryLang;
  }
  
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const browserLang = acceptLanguage.split(',')[0].split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
  }
  
  return DEFAULT_LANGUAGE;
};

// Obtener URL con prefijo de idioma
const getLocalizedUrl = (path, lang) => {
  if (!path) return BASE_URL;
  
  if (lang === DEFAULT_LANGUAGE) {
    return `${BASE_URL}${path}`;
  }
  
  return `${BASE_URL}/${lang}${path}`;
};

// Generar meta tags por página
const generateMetaTags = (pageType, lang = DEFAULT_LANGUAGE, data = {}) => {
  const config = seoConfigByLanguage[lang] || seoConfigByLanguage[DEFAULT_LANGUAGE];
  const baseUrl = BASE_URL;
  
  const defaultMeta = {
    title: config.defaultTitle,
    description: config.defaultDescription,
    keywords: config.defaultKeywords,
    canonical: lang === DEFAULT_LANGUAGE ? baseUrl : `${baseUrl}/${lang}`,
    ogImage: `${baseUrl}/images/og-gonboost-${lang}.jpg`,
    ogLocale: lang === 'en' ? 'en_US' : `${lang}_${config.country || lang.toUpperCase()}`,
    twitterCard: 'summary_large_image',
    twitterSite: '@gonboost',
    siteName: config.siteName
  };
  
  switch (pageType) {
    case 'home':
      return {
        ...defaultMeta,
        title: config.defaultTitle,
        description: config.defaultDescription,
        canonical: lang === DEFAULT_LANGUAGE ? baseUrl : `${baseUrl}/${lang}`
      };
      
    case 'services':
      return {
        ...defaultMeta,
        title: lang === 'es' ? 'Servicios de Boosting - Gonboost' :
               lang === 'de' ? 'Boosting-Dienste - Gonboost' :
               lang === 'fr' ? 'Services de Boosting - Gonboost' :
               lang === 'nl' ? 'Boosting Diensten - Gonboost' :
               lang === 'pt' ? 'Serviços de Boosting - Gonboost' :
               lang === 'ru' ? 'Услуги бустинга - Gonboost' :
               'Boosting Services - Gonboost',
        description: config.defaultDescription,
        canonical: getLocalizedUrl('/services', lang),
        ogImage: `${baseUrl}/images/og-services-${lang}.jpg`
      };
      
    case 'service':
      if (data.service) {
        const service = data.service;
        return {
          ...defaultMeta,
          title: `${service.name} - ${service.game} Boosting | Gonboost`,
          description: service.description || `${service.name} for ${service.game}. Professional boosting service.`,
          keywords: `${service.game.toLowerCase()}, ${service.serviceType?.toLowerCase() || 'boosting'}, ${service.game} boost, gonboost`,
          canonical: getLocalizedUrl(`/service/${service._id}`, lang),
          ogImage: `${baseUrl}/images/og-${service.game?.toLowerCase().replace(/\s+/g, '-') || 'default'}.jpg`
        };
      }
      return defaultMeta;
      
    case 'game':
      if (data.game) {
        const game = data.game;
        const gameNames = {
          'Diablo 4': { en: 'Diablo 4', es: 'Diablo 4', de: 'Diablo 4', fr: 'Diablo 4', nl: 'Diablo 4', pt: 'Diablo 4', ru: 'Diablo 4' },
          'World of Warcraft': { en: 'World of Warcraft', es: 'World of Warcraft', de: 'World of Warcraft', fr: 'World of Warcraft', nl: 'World of Warcraft', pt: 'World of Warcraft', ru: 'World of Warcraft' },
          'Path of Exile': { en: 'Path of Exile', es: 'Path of Exile', de: 'Path of Exile', fr: 'Path of Exile', nl: 'Path of Exile', pt: 'Path of Exile', ru: 'Path of Exile' }
        };
        const gameName = gameNames[game]?.[lang] || game;
        
        return {
          ...defaultMeta,
          title: `${gameName} Boosting Services - Gonboost`,
          description: `Professional ${gameName} boosting services. Improve your rank with verified boosters.`,
          keywords: `${game.toLowerCase()} boost, ${game.toLowerCase()} boosting, ${gameName} rank boost`,
          canonical: getLocalizedUrl(`/services?game=${encodeURIComponent(game)}`, lang),
          ogImage: `${baseUrl}/images/og-${game.toLowerCase().replace(/\s+/g, '-')}.jpg`
        };
      }
      return defaultMeta;
      
    default:
      return defaultMeta;
  }
};

// ================= ENDPOINTS =================

// ✅ ENDPOINT PARA META TAGS DINÁMICOS (SSR) - MULTILINGÜE
router.get('/meta/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    const { serviceId, game, lang: queryLang } = req.query;
    
    const lang = getLanguageFromRequest(req);
    
    console.log(`🔍 [SEO] Meta tags solicitados: ${pageType} | Idioma: ${lang} | ServiceId: ${serviceId || 'N/A'}`);

    let data = {};
    
    // Si es un servicio específico, buscar en DB
    if (pageType === 'service' && serviceId) {
      try {
        const service = await BoostService.findById(serviceId).lean();
        if (service) {
          data.service = service;
        }
      } catch (error) {
        console.error('Error buscando servicio:', error.message);
      }
    }
    
    // Si es una página de juego
    if (pageType === 'game' && game) {
      data.game = game;
    }
    
    const meta = generateMetaTags(pageType, lang, data);

    // Añadir etiquetas hreflang
    const hreflangTags = [];
    const currentPath = req.query.path || '/';
    
    SUPPORTED_LANGUAGES.forEach(langCode => {
      const url = langCode === DEFAULT_LANGUAGE 
        ? `${BASE_URL}${currentPath}`
        : `${BASE_URL}/${langCode}${currentPath}`;
      
      hreflangTags.push({
        lang: langCode,
        url: url.replace(/\/+/g, '/')
      });
    });
    
    // Añadir x-default (inglés)
    hreflangTags.push({
      lang: 'x-default',
      url: `${BASE_URL}${currentPath}`.replace(/\/+/g, '/')
    });
    
    meta.hreflang = hreflangTags;

    console.log(`✅ [SEO] Meta tags generados: ${meta.title}`);

    // Cache headers para producción
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    }

    res.json({
      success: true,
      meta,
      lang
    });

  } catch (error) {
    console.error('❌ [SEO] Error generando meta tags:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando meta tags',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ ENDPOINT PARA SCHEMA.ORG MARKUP (JSON-LD) - MULTILINGÜE
router.get('/structured-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { serviceId, game } = req.query;
    const lang = getLanguageFromRequest(req);
    const config = seoConfigByLanguage[lang] || seoConfigByLanguage[DEFAULT_LANGUAGE];
    
    console.log(`🔍 [SEO] Structured data solicitado: ${type} | Idioma: ${lang}`);

    let structuredData = {};

    switch (type) {
      case 'organization':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": config.organizationName,
          "description": config.organizationDescription,
          "url": BASE_URL,
          "logo": `${BASE_URL}/images/logo.png`,
          "sameAs": config.socialLinks,
          "contactPoint": {
            "@type": "ContactPoint",
            "email": config.supportEmail,
            "contactType": "customer service",
            "availableLanguage": SUPPORTED_LANGUAGES.map(l => 
              seoConfigByLanguage[l]?.hreflang || l
            )
          },
          "areaServed": {
            "@type": "Place",
            "name": "Worldwide"
          }
        };
        break;

      case 'service':
        let serviceName = 'Game Boosting Service';
        let serviceDescription = 'Professional video game ranking boosting services';
        
        if (serviceId) {
          try {
            const service = await BoostService.findById(serviceId).lean();
            if (service) {
              serviceName = service.name;
              serviceDescription = service.description || serviceDescription;
            }
          } catch (error) {
            console.error('Error buscando servicio para schema:', error.message);
          }
        }
        
        structuredData = {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": serviceName,
          "description": serviceDescription,
          "provider": {
            "@type": "Organization",
            "name": config.organizationName,
            "url": BASE_URL
          },
          "areaServed": "Worldwide",
          "serviceType": "Video game boosting",
          "category": "VideoGameService",
          "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "priceCurrency": "USD"
          }
        };
        break;

      case 'website':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": config.siteName,
          "url": lang === DEFAULT_LANGUAGE ? BASE_URL : `${BASE_URL}/${lang}`,
          "description": config.defaultDescription,
          "inLanguage": lang,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${BASE_URL}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        };
        break;

      case 'breadcrumb':
        if (req.query.items) {
          try {
            const items = JSON.parse(req.query.items);
            structuredData = {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
              }))
            };
          } catch (e) {
            console.error('Error parseando breadcrumb items:', e);
          }
        }
        break;

      case 'faq':
        if (req.query.questions) {
          try {
            const questions = JSON.parse(req.query.questions);
            structuredData = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": questions.map(q => ({
                "@type": "Question",
                "name": q.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": q.answer
                }
              }))
            };
          } catch (e) {
            console.error('Error parseando FAQ items:', e);
          }
        }
        break;

      case 'product':
        if (serviceId) {
          try {
            const service = await BoostService.findById(serviceId).lean();
            if (service) {
              structuredData = {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": service.name,
                "description": service.description,
                "category": `${service.game} Boosting Service`,
                "offers": {
                  "@type": "Offer",
                  "price": service.basePrice || service.price,
                  "priceCurrency": "USD",
                  "availability": service.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              };
            }
          } catch (error) {
            console.error('Error buscando servicio para product schema:', error.message);
          }
        }
        break;

      default:
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": config.siteName,
          "url": BASE_URL
        };
    }

    console.log(`✅ [SEO] Structured data generado para: ${type}`);

    // Cache headers para producción
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    }

    res.json({
      success: true,
      structuredData,
      lang
    });

  } catch (error) {
    console.error('❌ [SEO] Error generando structured data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando structured data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ ENDPOINT PARA VERIFICACIÓN DE SEO (ANALYTICS INTERNOS)
router.get('/analytics/internal', async (req, res) => {
  try {
    console.log('📊 [SEO] Solicitando analytics SEO internos');

    const totalServices = await BoostService.countDocuments({ available: true, isActive: true });
    
    const servicesByGame = await BoostService.aggregate([
      { $match: { available: true, isActive: true } },
      { $group: { _id: '$game', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const servicesByType = await BoostService.aggregate([
      { $match: { available: true, isActive: true } },
      { $group: { _id: '$serviceType', count: { $sum: 1 } } }
    ]);

    // Páginas indexadas por idioma
    const indexedPages = [
      { url: '/', languages: ['en'] },
      { url: '/services', languages: SUPPORTED_LANGUAGES },
      { url: '/es/', languages: ['es'] },
      { url: '/de/', languages: ['de'] },
      { url: '/fr/', languages: ['fr'] },
      { url: '/nl/', languages: ['nl'] },
      { url: '/pt/', languages: ['pt'] },
      { url: '/ru/', languages: ['ru'] }
    ];

    const seoStats = {
      totalServices,
      servicesByGame,
      servicesByType,
      indexedPages,
      supportedLanguages: SUPPORTED_LANGUAGES,
      defaultLanguage: DEFAULT_LANGUAGE,
      sitemapUrl: `${BASE_URL}/sitemap.xml`,
      robotsTxtUrl: `${BASE_URL}/robots.txt`,
      lastCrawled: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    console.log(`✅ [SEO] Analytics generados: ${totalServices} servicios, ${servicesByGame.length} juegos`);

    res.json({
      success: true,
      seoStats
    });

  } catch (error) {
    console.error('❌ [SEO] Error generando SEO analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando SEO analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ ENDPOINT PARA OBTENER CONFIGURACIÓN SEO POR IDIOMA
router.get('/config/:lang', (req, res) => {
  try {
    const { lang } = req.params;
    
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return res.status(400).json({
        success: false,
        message: `Idioma no soportado. Idiomas disponibles: ${SUPPORTED_LANGUAGES.join(', ')}`
      });
    }
    
    const config = seoConfigByLanguage[lang];
    
    res.json({
      success: true,
      lang,
      config: {
        ...config,
        baseUrl: lang === DEFAULT_LANGUAGE ? BASE_URL : `${BASE_URL}/${lang}`,
        supportedLanguages: SUPPORTED_LANGUAGES,
        defaultLanguage: DEFAULT_LANGUAGE
      }
    });
    
  } catch (error) {
    console.error('❌ [SEO] Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo configuración SEO'
    });
  }
});

// ✅ ENDPOINT PARA GENERAR HREFLANG TAGS
router.get('/hreflang', (req, res) => {
  try {
    const { path = '/' } = req.query;
    
    const hreflangTags = [];
    
    SUPPORTED_LANGUAGES.forEach(lang => {
      const url = lang === DEFAULT_LANGUAGE 
        ? `${BASE_URL}${path}`
        : `${BASE_URL}/${lang}${path}`;
      
      hreflangTags.push({
        lang,
        url: url.replace(/\/+/g, '/').replace(/\/$/, '') || BASE_URL
      });
    });
    
    // x-default (inglés)
    hreflangTags.push({
      lang: 'x-default',
      url: `${BASE_URL}${path}`.replace(/\/+/g, '/').replace(/\/$/, '') || BASE_URL
    });
    
    res.json({
      success: true,
      path,
      hreflangTags
    });
    
  } catch (error) {
    console.error('❌ [SEO] Error generando hreflang:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando hreflang tags'
    });
  }
});

// ✅ ENDPOINT DE PRUEBA
router.get('/test', (req, res) => {
  const lang = getLanguageFromRequest(req);
  
  res.json({
    success: true,
    message: '✅ Rutas SEO funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    detectedLanguage: lang,
    supportedLanguages: SUPPORTED_LANGUAGES,
    baseUrl: BASE_URL,
    availableEndpoints: {
      meta: 'GET /api/seo/meta/:pageType?lang=xx&serviceId=xxx&path=/',
      structuredData: 'GET /api/seo/structured-data/:type?lang=xx',
      analytics: 'GET /api/seo/analytics/internal',
      config: 'GET /api/seo/config/:lang',
      hreflang: 'GET /api/seo/hreflang?path=/services',
      test: 'GET /api/seo/test'
    }
  });
});

export default router;