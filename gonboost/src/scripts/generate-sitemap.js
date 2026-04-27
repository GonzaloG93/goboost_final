// file name: scripts/generate-sitemap.js
[file content begin]
const fs = require('fs');
const path = require('path');

// Configuración
const SITE_URL = 'https://gonboost.com';
const BUILD_DIR = './dist';
const PAGES = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/services', priority: 0.9, changefreq: 'weekly' },
  { url: '/login', priority: 0.3, changefreq: 'monthly' },
  { url: '/register', priority: 0.3, changefreq: 'monthly' },
  { url: '/support', priority: 0.7, changefreq: 'weekly' },
  { url: '/about', priority: 0.5, changefreq: 'monthly' },
  { url: '/contact', priority: 0.5, changefreq: 'monthly' }
];

// Generar sitemap principal
function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${PAGES.map(page => `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
</urlset>`;

  // Asegurar que el directorio dist existe
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  // Escribir sitemap
  fs.writeFileSync(path.join(BUILD_DIR, 'sitemap.xml'), sitemap);
  console.log('✅ Sitemap generado correctamente');
}

generateSitemap();
[file content end]