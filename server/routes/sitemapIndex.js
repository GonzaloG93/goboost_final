// routes/sitemapIndex.js - Gonboost.com
// Sirve el /sitemap-index.xml que ya referenciás en tu robots.txt
// Actualmente apunta al sitemap único; fácil de escalar después.

import express from 'express';

const router = express.Router();
const BASE_URL = 'https://gonboost.com';

router.get('/sitemap-index.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>

  <!-- Cuando quieras escalar, agregá sitemaps por idioma o por juego:
  <sitemap>
    <loc>${BASE_URL}/sitemap-diablo.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-wow.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  -->

</sitemapindex>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

export default router;
