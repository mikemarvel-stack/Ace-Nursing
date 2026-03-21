import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productAPI } from '../api';
import useSEO from '../hooks/useSEO';
import { CATEGORY_GROUPS, slugifyCategory, categoryFromSlug } from '../categories';

const SITE_URL = 'https://acenursing.com';

const slugFromCategory = (c) => (!c || c === 'All') ? '' : slugifyCategory(c);

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
  const groupQuery = searchParams.get('group');
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cat, setCat] = useState(
    routeCategory ? (categoryFromSlug(routeCategory) || 'All') : categoryQuery || 'All'
  );
  const [activeGroup, setActiveGroup] = useState(
    groupQuery ? CATEGORY_GROUPS.find(g => g.label === groupQuery) || null : null
  );
  const [sort, setSort] = useState(searchParams.get('sort') || 'featured');
  const [page, setPage] = useState(1);

  // Sync category / group from URL
  useEffect(() => {
    if (groupQuery) {
      const group = CATEGORY_GROUPS.find(g => g.label === groupQuery) || null;
      setActiveGroup(group);
      setCat('All');
    } else {
      setActiveGroup(null);
      const next = routeCategory ? (categoryFromSlug(routeCategory) || 'All') : categoryQuery || 'All';
      setCat(next);
    }
    setPage(1);
  }, [routeCategory, categoryQuery, groupQuery]);

  // Sync search/sort into URL params (preserve group if active)
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (sort !== 'featured') params.sort = sort;
    if (groupQuery) params.group = groupQuery;
    setSearchParams(params, { replace: true });
  }, [search, sort]);

  useEffect(() => {
    const label = activeGroup ? activeGroup.label : cat === 'All' ? 'All' : cat;
    document.title = label === 'All' ? 'Shop – Ace Nursing' : `${label} – Shop | Ace Nursing`;
  }, [cat, activeGroup]);

  const catSlug = cat !== 'All' ? slugifyCategory(cat) : '';
  useSEO({
    title: cat === 'All' ? 'Nursing Study Materials Shop' : `${cat} – Nursing Study Materials`,
    description: cat === 'All'
      ? 'Browse premium nursing study guides, NCLEX prep, pharmacology references, flashcards and bundles. Instant PDF download.'
      : `Browse our ${cat} collection — premium nursing study materials for NCLEX prep and clinical excellence. Instant PDF download.`,
    canonical: `${SITE_URL}${catSlug ? `/shop/${catSlug}` : '/shop'}`,
  });

  // Single fetch effect: debounce only for search input, immediate for everything else
  useEffect(() => {
    let cancelled = false;
    const delay = search ? 400 : 0;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12, sort };
        if (activeGroup) {
          // fetch all categories in the group — send as comma-separated or multiple params
          params.category = activeGroup.items.join(',');
        } else if (cat !== 'All') {
          params.category = cat;
        }
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
  }, [cat, sort, search, page, activeGroup]);

  const handleCat = (c) => {
    const slug = slugFromCategory(c);
    const path = slug ? `/shop/${slug}` : '/shop';
    navigate(path);
    setCat(c);
    setPage(1);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = activeGroup ? activeGroup.label : cat !== 'All' ? cat : null;

  const CategorySidebar = ({ onClose }) => (
    <div>
      {onClose && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Browse Categories</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
      )}
      {!onClose && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Categories</p>}

      <button
        onClick={() => { setActiveGroup(null); handleCat('All'); onClose?.(); }}
        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: !activeGroup && cat === 'All' ? 700 : 400, background: !activeGroup && cat === 'All' ? 'var(--navy)' : 'transparent', color: !activeGroup && cat === 'All' ? '#fff' : 'var(--text)', border: 'none', cursor: 'pointer', marginBottom: 4 }}>
        All Materials
      </button>

      {CATEGORY_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 16 }}>
          <button
            onClick={() => { navigate(`/shop?group=${encodeURIComponent(group.label)}`); onClose?.(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: activeGroup?.label === group.label && cat === 'All' ? 700 : 600, background: activeGroup?.label === group.label && cat === 'All' ? 'var(--primary)' : 'transparent', color: activeGroup?.label === group.label && cat === 'All' ? '#fff' : 'var(--primary)', border: 'none', cursor: 'pointer', marginBottom: 2 }}>
            {group.label}
          </button>
          {group.items.map(c => (
            <button key={c}
              onClick={() => { handleCat(c); onClose?.(); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px 7px 22px', borderRadius: 8, fontSize: 13, fontWeight: cat === c ? 600 : 400, background: cat === c ? '#EFF6FF' : 'transparent', color: cat === c ? 'var(--primary)' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: 'var(--cream)', minHeight: '80vh' }}>

      {/* Mobile filter sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 800, display: 'flex' }}>
          <div onClick={() => setSidebarOpen(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.45)' }} />
          <div className="animate-slide-inR" style={{ width: 280, background: '#fff', height: '100%', overflowY: 'auto', padding: '20px 16px', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}>
            <CategorySidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Shop Header */}
      <div style={{ background: 'var(--navy)', padding: '36px 0 30px' }}>
        <div className="container">
          <h1 className="serif" style={{ color: '#fff', fontSize: 36, marginBottom: 4 }}>
            {activeGroup ? activeGroup.label : cat === 'All' ? 'Study Materials Shop' : cat}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
            {loading ? '…' : `${total} materials available`}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>

        {/* Top bar: search + sort + mobile filter button */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none', color: 'var(--muted)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials…" className="input" style={{ paddingLeft: 40 }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{ width: 'auto', minWidth: 160, flexShrink: 0 }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Mobile: filter button */}
          <button className="show-mobile" onClick={() => setSidebarOpen(true)}
            style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: activeLabel ? 'var(--navy)' : '#fff', color: activeLabel ? '#fff' : 'var(--text)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            ☰ {activeLabel ? 'Filtered' : 'Filter'}
          </button>
        </div>

        {/* Desktop layout: sidebar + grid */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* Desktop sidebar */}
          <div className="hide-mobile" style={{ width: 220, flexShrink: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 14px', position: 'sticky', top: 86 }}>
            <CategorySidebar />
          </div>

          {/* Product grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Active filter badge */}
            {activeLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Showing:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--navy)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                  {activeLabel}
                  <button onClick={() => { setActiveGroup(null); handleCat('All'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
                </span>
              </div>
            )}

            {loading ? (
              <div className="product-grid">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="card" style={{ height: 320 }}>
                    <div className="skeleton" style={{ height: 140, borderRadius: 0 }} />
                    <div style={{ padding: 14 }}>
                      <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 18 }} />
                      <div className="skeleton" style={{ height: 32 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🔍</div>
                <h3 style={{ color: 'var(--navy)', fontSize: 20, marginBottom: 8 }}>No materials found</h3>
                <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Try a different search term or category</p>
                <button className="btn btn-primary" onClick={() => { setSearch(''); setActiveGroup(null); handleCat('All'); }}>Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="product-grid">
                  {products.map(p => <ProductCard key={p._id} product={p} />)}
                </div>
                {total > 12 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--muted)', padding: '0 12px' }}>Page {page} of {Math.ceil(total / 12)}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
