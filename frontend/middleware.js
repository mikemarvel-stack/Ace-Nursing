import { NextResponse } from 'next/server';

const API_URL = process.env.VITE_API_URL || 'https://ace-nursing.onrender.com/api';
const SITE_URL = 'https://acenursing.com';
const DEFAULT_DESC = 'Premium nursing study guides, NCLEX-RN prep, pharmacology references and clinical flashcards. Instant PDF download. Trusted by 25,000+ nursing students.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const CAT_DESCS = {
  'study-guides':    'Browse premium nursing study guides for NCLEX-RN, med-surg, pharmacology and more. Instant PDF download.',
  'flashcards':      'High-yield nursing flashcard decks for NCLEX prep and clinical review. Instant PDF download.',
  'reference-cards': 'Quick-reference clinical cards for nurses — pharmacology, lab values, procedures. Instant PDF download.',
  'checklists':      'Nursing procedure checklists and competency tools. Instant PDF download.',
  'bundles':         'Best-value nursing study material bundles. Save more, study smarter. Instant PDF download.',
};

function buildMeta({ title, description, image, canonical, type = 'website', jsonLd }) {
  const esc = (s = '') => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const t = esc(title);
  const d = esc(description);
  const img = esc(image || DEFAULT_IMAGE);
  const url = esc(canonical);
  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="AceNursing" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
    ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
  `.trim();
}

async function getProductMeta(slug) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const { product: p } = await res.json();
    const title = p.seo?.metaTitle || `${p.title} – Nursing Study Material`;
    const description = p.seo?.metaDescription || p.description?.slice(0, 155) || DEFAULT_DESC;
    const canonical = `${SITE_URL}/product/${p.slug}`;
    const image = p.coverImage?.url || DEFAULT_IMAGE;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      description: p.description,
      image,
      sku: p._id,
      brand: { '@type': 'Brand', name: 'AceNursing' },
      offers: {
        '@type': 'Offer',
        price: p.price.toFixed(2),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: canonical,
        seller: { '@type': 'Organization', name: 'AceNursing' },
      },
      ...(p.rating?.count > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: p.rating.average,
          reviewCount: p.rating.count,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      ...(p.reviews?.length > 0 && {
        review: p.reviews.slice(0, 5).map(r => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.name },
          reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
          reviewBody: r.comment,
        })),
      }),
    };
    return buildMeta({ title, description, image, canonical, type: 'product', jsonLd });
  } catch {
    return null;
  }
}

function getShopMeta(catSlug) {
  const catName = catSlug
    ? catSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
    : null;
  const title = catName
    ? `${catName} – Nursing Study Materials | AceNursing`
    : 'Nursing Study Materials Shop | AceNursing';
  const description = (catSlug && CAT_DESCS[catSlug]) || DEFAULT_DESC;
  const canonical = `${SITE_URL}${catSlug ? `/shop/${catSlug}` : '/shop'}`;
  return buildMeta({ title, description, canonical });
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only intercept product and shop pages
  const productMatch = pathname.match(/^\/product\/([^/]+)$/);
  const shopMatch = pathname.match(/^\/shop\/?([^/]*)$/);
  if (!productMatch && !shopMatch) return NextResponse.next();

  // Fetch the original HTML shell
  const res = await fetch(req.url, { headers: { 'x-middleware-skip': '1' } });
  if (!res.ok) return NextResponse.next();

  let html = await res.text();

  // Build the meta tags
  let metaTags = null;
  if (productMatch) {
    metaTags = await getProductMeta(productMatch[1]);
  } else if (shopMatch) {
    metaTags = getShopMeta(shopMatch[1] || '');
  }

  if (metaTags) {
    // Replace the static placeholder title and inject all meta tags
    html = html
      .replace(/<title>[^<]*<\/title>/, '')
      .replace(/(<head[^>]*>)/, `$1\n  ${metaTags}`);
  }

  return new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      'x-robots-tag': 'index, follow',
    },
  });
}

export const config = {
  matcher: ['/product/:slug*', '/shop/:category*'],
};
