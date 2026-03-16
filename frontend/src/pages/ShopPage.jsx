import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../api';

const CATS = ['All', 'Study Guides', 'Flashcards', 'Reference Cards', 'Checklists', 'Bundles'];

const CATEGORY_SLUGS = {
  'study-guides': 'Study Guides',
  'flashcards': 'Flashcards',
  'reference-cards': 'Reference Cards',
  'checklists': 'Checklists',
  'bundles': 'Bundles',
};

const slugifyCategory = (category) => category.toLowerCase().replace(/\s+/g, '-');
const categoryFromSlug = (slug) => CATEGORY_SLUGS[slug] || 'All';
const slugFromCategory = (category) => {
  if (!category || category === 'All') return '';
  return slugifyCategory(category);
};

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'reviews', label: 'Most Reviewed' },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryQuery = searchParams.get('category');
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cat, setCat] = useState(
    routeCategory ? categoryFromSlug(routeCategory) : categoryQuery || 'All'
  );
  const [sort, setSort] = useState(searchParams.get('sort') || 'featured');
  const [page, setPage] = useState(1);

  // Sync category from URL
  useEffect(() => {
    const next = routeCategory ? categoryFromSlug(routeCategory) : categoryQuery || 'All';
    setCat(next);
    setPage(1);
  }, [routeCategory, categoryQuery]);

  // Sync search/sort into URL params
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (sort !== 'featured') params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [search, sort]);

  useEffect(() => {
    document.title = cat === 'All' ? 'Shop – Ace Nursing' : `${cat} – Shop | Ace Nursing`;
  }, [cat]);

  // Single fetch effect: debounce only for search input, immediate for everything else
  useEffect(() => {
    let cancelled = false;
    const delay = search ? 400 : 0;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12, sort };
        if (cat !== 'All') params.category = cat;
        if (search.trim()) params.search = search.trim();
        const res = await productAPI.getAll(params);
        if (!cancelled) {
          setProducts(res.data.products);
          setTotal(res.data.pagination.total);
        }
      } catch (err) {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [cat, sort, search, page]);

  const handleCat = (c) => {
    const slug = slugFromCategory(c);
    const path = slug ? `/shop/${slug}` : '/shop';
    navigate(path);
    setCat(c);
    setPage(1);
  };

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>
      {/* Shop Header */}
      <div style={{ background: 'var(--navy)', padding: '40px 0 36px' }}>
        <div className="container">
          <h1 className="serif" style={{ color: '#fff', fontSize: 40, marginBottom: 6 }}>
            {cat === 'All' ? 'Study Materials Shop' : `${cat} Shop`}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
            {loading ? '…' : `${total} materials available`}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>
        {/* Filters bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials…" className="input"
              style={{ paddingLeft: 42 }} />
          </div>

          {/* Category */}
          <select value={cat} onChange={e => handleCat(e.target.value)} className="input" style={{ width: 'auto', minWidth: 160 }}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{ width: 'auto', minWidth: 180 }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => handleCat(c)}
              style={{ padding: '6px 16px', borderRadius: 50, fontSize: 13, fontWeight: cat === c ? 700 : 400, background: cat === c ? 'var(--navy)' : '#fff', color: cat === c ? '#fff' : 'var(--muted)', border: `1.5px solid ${cat === c ? 'var(--navy)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="product-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card" style={{ height: 340 }}>
                <div className="skeleton" style={{ height: 148, borderRadius: 0 }} />
                <div style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 11, width: '55%', marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 15, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 15, width: '80%', marginBottom: 20 }} />
                  <div className="skeleton" style={{ height: 34 }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
            <h3 style={{ color: 'var(--navy)', fontSize: 22, marginBottom: 8 }}>No materials found</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Try a different search term or category</p>
            <button className="btn btn-primary" onClick={() => { setSearch(''); setCat('All'); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--muted)', padding: '0 12px' }}>
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
