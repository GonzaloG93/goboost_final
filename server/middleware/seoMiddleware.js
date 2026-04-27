// server/middleware/seoMiddleware.js - MIDDLEWARE PARA OPTIMIZACIONES SEO
import compression from 'compression';
import helmet from 'helmet';

// ✅ CONFIGURACIÓN DE COMPRESIÓN PARA MEJORAR VELOCIDAD
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Comprimir respuestas mayores a 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// ✅ CONFIGURACIÓN HELMET MEJORADA PARA SEO Y SEGURIDAD
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.nowpayments.io"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// ✅ MIDDLEWARE PARA CACHE HEADERS (MEJORA VELOCIDAD)
export const cacheMiddleware = (req, res, next) => {
  // Cache para archivos estáticos
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 año
  }
  // Cache para API responses (más corto)
  else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
};

// ✅ MIDDLEWARE PARA SERVIR ROBOTS.TX
export const serveRobotsTxt = (req, res, next) => {
  if (req.url === '/robots.txt') {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: ${process.env.BASE_URL || 'https://tudominio.com'}/sitemap.xml`);
  } else {
    next();
  }
};

// ✅ MIDDLEWARE PARA SERVIR SITEMAP.XML DINÁMICAMENTE
export const serveSitemap = async (req, res, next) => {
  if (req.url === '/sitemap.xml') {
    try {
      const sitemap = await generateSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generando sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  } else {
    next();
  }
};

// ✅ FUNCIÓN PARA GENERAR SITEMAP DINÁMICO
async function generateSitemap() {
  const baseUrl = process.env.BASE_URL || 'https://tudominio.com';
  const currentDate = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/boosting-valorant</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/boosting-lol</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/precios</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/contacto</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
}

export default {
  compressionMiddleware,
  helmetMiddleware,
  cacheMiddleware,
  serveRobotsTxt,
  serveSitemap
};