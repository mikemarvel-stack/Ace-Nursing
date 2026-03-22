import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Kick off the featured-products fetch immediately — before any component mounts.
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
window.__featuredPromise = fetch(`${apiBase}/products/featured`)
  .then(r => r.json())
  .catch(() => ({ products: [] }));

// ─── Eager: layout shells (needed on every page) ──────────────────────────────
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import { useAuthStore } from './store';

// ─── Lazy: all pages ──────────────────────────────────────────────────────────
const HomePage          = lazy(() => import('./pages/HomePage'));
const ShopPage          = lazy(() => import('./pages/ShopPage'));
const ProductPage       = lazy(() => import('./pages/ProductPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage  = lazy(() => import('./pages/OrderSuccessPage'));
const LoginPage         = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage      = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.RegisterPage })));
const AccountPage       = lazy(() => import('./pages/AccountPage'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));
const FAQPage           = lazy(() => import('./pages/FAQPage'));
const PolicyPage        = lazy(() => import('./pages/PolicyPage'));
const CustomOrderPage   = lazy(() => import('./pages/CustomOrderPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

// Admin pages — never loaded for regular users
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCategories   = lazy(() => import('./pages/admin/AdminCategories'));
const AdminProducts     = lazy(() => import('./pages/admin/AdminProducts'));
const AdminUpload       = lazy(() => import('./pages/admin/AdminUpload'));
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminCustomOrders  = lazy(() => import('./pages/admin/AdminCustomOrders'));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#0C1B33', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#6B7280', marginBottom: 24 }}>Please refresh the page or contact support if the problem persists.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const paypalOptions = {
  'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb',
  currency: 'USD',
  intent: 'capture',
  components: 'buttons',
};

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PayPalScriptProvider options={paypalOptions} deferLoading={false}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0C1B33',
                color: '#fff',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 18px',
              },
              success: { iconTheme: { primary: '#C49A3C', secondary: '#fff' } },
              error: { style: { background: '#DC2626' } },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/:category" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/info/:slug" element={<PolicyPage />} />
                <Route path="/custom-order" element={<CustomOrderPage />} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Admin */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="upload" element={<AdminUpload />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="custom-orders" element={<AdminCustomOrders />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </PayPalScriptProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
