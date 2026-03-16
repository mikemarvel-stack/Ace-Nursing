import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import { LoginPage, RegisterPage } from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminUpload from './pages/admin/AdminUpload';
import AdminOrders from './pages/admin/AdminOrders';
import AdminNotifications from './pages/admin/AdminNotifications';
import { useAuthStore } from './store';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PolicyPage from './pages/PolicyPage';

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
            <Route path="products" element={<AdminProducts />} />
            <Route path="upload" element={<AdminUpload />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PayPalScriptProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
