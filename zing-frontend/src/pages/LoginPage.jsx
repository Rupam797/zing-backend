import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: '🚀', text: 'Lightning-fast delivery' },
  { icon: '🍕', text: '500+ restaurants to explore' },
  { icon: '📍', text: 'Real-time order tracking' },
  { icon: '🔒', text: 'Secure payments, always' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 👋`);
      const redirect = { USER: '/', RESTAURANT: '/dashboard', ADMIN: '/admin', DELIVERY: '/deliveries' };
      navigate(redirect[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel – brand ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 40%, #fbbf24 100%)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        {/* Logo */}
        <div className="relative z-10">
          <p className="text-3xl font-black text-white flex items-center gap-2">
            <Zap className="h-7 w-7" fill="white" /> Zing
          </p>
          <p className="mt-1 text-sm text-white/80">Food that flies to your door</p>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Good food,<br />great timing.
          </h2>
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur-sm">
                  {f.icon}
                </span>
                <span className="text-sm font-medium text-white">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <p className="relative z-10 text-xs text-white/60">
          "Zing is the best food delivery app I've ever used!"
        </p>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 page-enter"
        style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <p className="text-xl font-black gradient-text mb-6 lg:hidden">⚡ Zing</p>

          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to continue your food journey
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-black/5"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-glow w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <> Sign in <ArrowRight className="h-4 w-4" /> </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-500 hover:text-brand-600 underline-offset-2 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
