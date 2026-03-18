const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

const SITE_URL = 'https://acenursing.com';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/shop', priority: '0.9', changefreq: 'daily' },
  { url: '/shop/study-guides', priority: '0.8', changefreq: 'weekly' },
  { url: '/shop/flashcards', priority: '0.8', changefreq: 'weekly' },
  { url: '/shop/reference-cards', priority: '0.8', changefreq: 'weekly' },
  { url: '/shop/checklists', priority: '0.8', changefreq: 'weekly' },
  { url: '/shop/bundles', priority: '0.8', changefreq: 'weekly' },
  { url: '/faq', priority: '0.6', changefreq: 'monthly' },
  { url: '/contact', priority: '0.5', changefreq: 'monthly' },
];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('slug updatedAt')
      .lean();

    const urls = [
      ...STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
      ...products.map(p => `
  <url>
    <loc>${SITE_URL}/product/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Failed to generate sitemap');
  }
});

module.exports = router;
