// backend/routes/sitemap.js - VERSIÓN PRODUCCIÓN MULTILINGÜE
// Generación dinámica de sitemap.xml con soporte para 7 idiomas
import express from 'express';
import BoostService from '../models/BoostService.js';

const router = express.Router();

// ================= CONFIGURACIÓN =================
const BASE_URL = process.env.BASE_URL || 'https://gonboost.com';
const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'ru'];
const DEFAULT_LANGUAGE = 'en';

// ================= FUNCIONES HELPER =================

// Formatear fecha para sitemap
const formatDate = (date) => {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
};

// Generar URL para sitemap con alternativas hreflang
const generateUrlEntry = (loc, lastmod, changefreq, priority, alternates = {}) => {
  let entry = `  <url>\n`;
  entry += `    <loc>${loc}</loc>\n`;
  if (lastmod) entry += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
  if (changefreq) entry += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) entry += `    <priority>${priority}</priority>\n`;
  
  // Añadir alternativas hreflang
  Object.entries(alternates).forEach(([lang, url]) => {
    entry += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>\n`;
  });
  
  entry += `  </url>`;
  return entry;
};

// Generar URLs por idioma para una ruta
const generateLanguageUrls = (path) => {
  const urls = {};
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const url = lang === DEFAULT_LANGUAGE 
      ? `${BASE_URL}${path}`
      : `${BASE_URL}/${lang}${path}`;
    urls[lang] = url.replace(/\/+/g, '/');
  });
  
  return urls;
};

// ================= ENDPOINT PRINCIPAL DEL SITEMAP =================
router.get('/sitemap.xml', async (req, res) => {
  try {
    console.log('🗺️ [Sitemap] Generando sitemap.xml multilingüe...');
    
    const today = new Date().toISOString();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
    
    // ================= PÁGINAS ESTÁTICAS =================
    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/services', changefreq: 'daily', priority: '0.9' },
      { path: '/login', changefreq: 'monthly', priority: '0.3' },
      { path: '/register', changefreq: 'monthly', priority: '0.3' },
      { path: '/support', changefreq: 'weekly', priority: '0.7' },
      { path: '/terms', changefreq: 'yearly', priority: '0.2' },
      { path: '/privacy', changefreq: 'yearly', priority: '0.2' }
    ];
    
    staticPages.forEach(page => {
      const alternates = generateLanguageUrls(page.path);
      
      // Añadir entrada para el idioma por defecto (inglés)
      xml += generateUrlEntry(
        alternates[DEFAULT_LANGUAGE],
        today,
        page.changefreq,
        page.priority,
        alternates
      ) + '\n';
    });
    
    // ================= PÁGINAS DE SERVICIO DINÁMICAS =================
    try {
      const services = await BoostService.find({ 
        available: true, 
        isActive: true 
      }).select('_id name game updatedAt').lean();
      
      console.log(`📦 [Sitemap] ${services.length} servicios encontrados`);
      
      for (const service of services) {
        const servicePath = `/service/${service._id}`;
        const alternates = generateLanguageUrls(servicePath);
        
        xml += generateUrlEntry(
          alternates[DEFAULT_LANGUAGE],
          service.updatedAt || today,
          'weekly',
          '0.8',
          alternates
        ) + '\n';
      }
    } catch (error) {
      console.error('❌ [Sitemap] Error obteniendo servicios:', error.message);
    }
    
    // ================= PÁGINAS DE JUEGOS =================
    try {
      const games = await BoostService.distinct('game', { 
        available: true, 
        isActive: true 
      });
      
      console.log(`🎮 [Sitemap] ${games.length} juegos encontrados`);
      
      for (const game of games) {
        const gamePath = `/services?game=${encodeURIComponent(game)}`;
        const alternates = generateLanguageUrls(gamePath);
        
        xml += generateUrlEntry(
          alternates[DEFAULT_LANGUAGE],
          today,
          'weekly',
          '0.7',
          alternates
        ) + '\n';
      }
    } catch (error) {
      console.error('❌ [Sitemap] Error obteniendo juegos:', error.message);
    }
    
    // ================= PÁGINAS DE IDIOMA (ÍNDICES) =================
    SUPPORTED_LANGUAGES.forEach(lang => {
      if (lang !== DEFAULT_LANGUAGE) {
        const langPath = `/${lang}`;
        const alternates = generateLanguageUrls('/');
        
        xml += generateUrlEntry(
          `${BASE_URL}${langPath}`,
          today,
          'daily',
          '0.9',
          alternates
        ) + '\n';
      }
    });
    
    xml += '</urlset>';
    
    console.log(`✅ [Sitemap] Sitemap generado correctamente`);
    
    // Headers para producción
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    
    res.send(xml);
    
  } catch (error) {
    console.error('❌ [Sitemap] Error generando sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ================= SITEMAP INDEX PARA MÚLTIPLES ARCHIVOS =================
router.get('/sitemap-index.xml', async (req, res) => {
  try {
    console.log('🗺️ [Sitemap] Generando sitemap index...');
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    const today = new Date().toISOString();
    
    // Sitemap principal
    xml += `  <sitemap>\n`;
    xml += `    <loc>${BASE_URL}/sitemap.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `  </sitemap>\n`;
    
    // Sitemaps por idioma (opcional, para sitios muy grandes)
    SUPPORTED_LANGUAGES.forEach(lang => {
      const langBase = lang === DEFAULT_LANGUAGE ? BASE_URL : `${BASE_URL}/${lang}`;
      xml += `  <sitemap>\n`;
      xml += `    <loc>${langBase}/sitemap-${lang}.xml</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    });
    
    xml += '</sitemapindex>';
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.send(xml);
    
  } catch (error) {
    console.error('❌ [Sitemap] Error generando sitemap index:', error);
    res.status(500).send('Error generating sitemap index');
  }
});

// ================= ENDPOINT DE INFORMACIÓN DEL SITEMAP =================
router.get('/sitemap-info', async (req, res) => {
  try {
    const totalServices = await BoostService.countDocuments({ available: true, isActive: true });
    const games = await BoostService.distinct('game', { available: true, isActive: true });
    
    const staticPages = ['/', '/services', '/login', '/register', '/support', '/terms', '/privacy'];
    
    const totalUrls = 
      staticPages.length + 
      totalServices + 
      games.length + 
      (SUPPORTED_LANGUAGES.length - 1); // Páginas de índice por idioma
    
    res.json({
      success: true,
      sitemapUrl: `${BASE_URL}/sitemap.xml`,
      sitemapIndexUrl: `${BASE_URL}/sitemap-index.xml`,
      totalUrls,
      breakdown: {
        staticPages: staticPages.length,
        services: totalServices,
        games: games.length,
        languageIndices: SUPPORTED_LANGUAGES.length - 1
      },
      languages: SUPPORTED_LANGUAGES,
      lastGenerated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Sitemap] Error obteniendo info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting sitemap info'
    });
  }
});

export default router;