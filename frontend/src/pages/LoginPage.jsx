import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { useAuthStore } from '../store';

function AuthCard({ children, title, sub }) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#C49A3C', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎓</div>
            <span className="serif" style={{ color: 'var(--navy)', fontSize: 22, fontWeight: 700 }}>Ace<span style={{ color: '#C49A3C' }}>Nursing</span></span>
          </Link>
          <h1 className="serif" style={{ fontSize: 34, color: 'var(--navy)', marginBottom: 6 }}>{title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>{sub}</p>
        </div>
        <div className="card" style={{ padding: 32 }}>{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome Back" sub="Log in to access your purchases">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <div>
          <label className="label">Email Address</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
        </div>
        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--teal)' }}>Forgot password?</Link>
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? <><span className="spinner" /> Logging in…</> : 'Log In'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--navy)', fontWeight: 600 }}>Sign up free</Link>
      </p>
    </AuthCard>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', country: 'Kenya' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      setAuth(res.data.user, res.data.token);
      toast.success(`Account created! Welcome, ${res.data.user.firstName}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AuthCard title="Create Account" sub="Join 25,000+ nursing students">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">First Name</label>
            <input className="input" value={form.firstName} onChange={set('firstName')} placeholder="Jane" required />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input className="input" value={form.lastName} onChange={set('lastName')} placeholder="Doe" required />
          </div>
        </div>
        <div>
          <label className="label">Email Address</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required minLength={8} />
        </div>
        <div>
          <label className="label">Country</label>
          <select className="input" value={form.country} onChange={set('country')}>
            {['Kenya', 'Uganda', 'Tanzania', 'Nigeria', 'Ghana', 'South Africa', 'United States', 'United Kingdom', 'Canada', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
          {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          By signing up, you agree to our <a href="#" style={{ color: 'var(--navy)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--navy)' }}>Privacy Policy</a>.
        </p>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--muted)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--navy)', fontWeight: 600 }}>Log in</Link>
      </p>
    </AuthCard>
  );
}

export default LoginPage;
