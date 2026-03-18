import { useEffect } from 'react';

const SITE_URL = 'https://acenursing.com';
const SITE_NAME = 'AceNursing';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

export default function useSEO({ title, description, canonical, image, type = 'website', jsonLd } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Premium Nursing Study Materials`;
    document.title = fullTitle;

    const setMeta = (sel, val) => {
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('meta');
        const attr = sel.includes('property=') ? 'property' : 'name';
        el.setAttribute(attr, sel.match(/["']([^"']+)["']/)[1]);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement('link'); el.rel = rel; document.head.appendChild(el); }
      el.href = href;
    };

    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description);
      setMeta('meta[name="twitter:description"]', description);
    }

    const img = image || DEFAULT_IMAGE;
    setMeta('meta[property="og:title"]', fullTitle);
    setMeta('meta[property="og:type"]', type);
    setMeta('meta[property="og:image"]', img);
    setMeta('meta[name="twitter:title"]', fullTitle);
    setMeta('meta[name="twitter:image"]', img);
    setMeta('meta[name="twitter:card"]', 'summary_large_image');

    if (canonical) {
      setMeta('meta[property="og:url"]', canonical);
      setMeta('meta[name="twitter:url"]', canonical);
      setLink('canonical', canonical);
    }

    const SCRIPT_ID = 'jsonld-dynamic';
    let script = document.getElementById(SCRIPT_ID);
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonical, image, type, jsonLd]);
}
