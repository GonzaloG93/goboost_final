// routes/sitemap.js - Gonboost.com
// Sitemap dinámico multilingüe (en, es, de, fr, nl, pt, ru)
// Incluye rutas estáticas de React + servicios dinámicos de MongoDB

import express from 'express';
import BoostService from '../models/BoostService.js';

const router = express.Router();

const BASE_URL = 'https://gonboost.com';

// Idiomas soportados (debe coincidir con SUPPORTED_LANGUAGES en i18n.js)
const SUPPORTED_LANGUAGES = ['en', 'es', 'de', 'fr', 'nl', 'pt', 'ru'];
const DEFAULT_LANGUAGE    = 'en';

// Rutas públicas de React que deben indexarse
// (excluimos: /order, /checkout, /my-orders, /dashboard, /support,
//  /booster/dashboard, /admin — requieren auth o son privadas)
const PUBLIC_STATIC_ROUTES = [
  { path: '',           changefreq: 'weekly',  priority: '1.0' }, // Home
  { path: '/services',  changefreq: 'daily',   priority: '0.9' }, // Lista de servicios
  { path: '/terms',     changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy',   changefreq: 'monthly', priority: '0.4' },
];

// Construye el prefijo de URL según idioma
function langPrefix(lang) {
  return lang === DEFAULT_LANGUAGE ? '' : `/${lang}`;
}

// Formatea fecha para el sitemap
function xmlDate(date) {
  return new Date(date || Date.now()).toISOString().split('T')[0];
}

// Genera un bloque <url>
function urlEntry({ loc, lastmod, changefreq, priority, alternates }) {
  const altLinks = alternates
    ? alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`).join('\n')
    : '';

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${altLinks}
  </url>`;
}

// Construye los hreflang alternates para una ruta dada
function buildAlternates(pathSuffix) {
  const alts = SUPPORTED_LANGUAGES.map(lang => ({
    lang,
    href: `${BASE_URL}${langPrefix(lang)}${pathSuffix}`,
  }));
  // Agrega x-default apuntando a la versión en inglés
  alts.push({ lang: 'x-default', href: `${BASE_URL}${pathSuffix}` });
  return alts;
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    // ─── 1. Servicios dinámicos desde MongoDB ───────────────────────────────
    const services = await BoostService.find(
      { available: true, isActive: true },
      '_id updatedAt'            // Solo traemos lo necesario
    ).lean();

    // ─── 2. Construir todas las URLs ────────────────────────────────────────
    const entries = [];
    const today   = xmlDate();

    // 2a. Rutas estáticas (todas las variantes de idioma)
    for (const route of PUBLIC_STATIC_ROUTES) {
      const alternates = buildAlternates(route.path);

      for (const lang of SUPPORTED_LANGUAGES) {
        const loc = `${BASE_URL}${langPrefix(lang)}${route.path}`;
        entries.push(urlEntry({
          loc,
          lastmod:    today,
          changefreq: route.changefreq,
          priority:   lang === DEFAULT_LANGUAGE ? route.priority : String((parseFloat(route.priority) - 0.1).toFixed(1)),
          alternates,
        }));
      }
    }

    // 2b. Rutas de servicios dinámicos (todas las variantes de idioma)
    for (const service of services) {
      const pathSuffix = `/service/${service._id}`;
      const lastmod    = xmlDate(service.updatedAt);
      const alternates = buildAlternates(pathSuffix);

      for (const lang of SUPPORTED_LANGUAGES) {
        const loc = `${BASE_URL}${langPrefix(lang)}${pathSuffix}`;
        entries.push(urlEntry({
          loc,
          lastmod,
          changefreq: 'weekly',
          priority:   lang === DEFAULT_LANGUAGE ? '0.8' : '0.7',
          alternates,
        }));
      }
    }

    // ─── 3. Armar el XML final ──────────────────────────────────────────────
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

${entries.join('\n')}

</urlset>`;

    // Cache 1 hora en CDN/proxy, revalida en background (ideal para Render)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.send(xml);

  } catch (err) {
    console.error('[sitemap] Error generando sitemap:', err);
    res.status(500).send('Error generando el sitemap');
  }
});

export default router;
