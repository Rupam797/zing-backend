import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User, Store, Truck, Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'USER',
    label: 'Customer',
    desc: 'Order food & book tables',
    icon: User,
    emoji: '🍽️',
    gradient: 'from-orange-400 to-amber-400',
  },
  {
    value: 'RESTAURANT',
    label: 'Restaurant',
    desc: 'Manage your restaurant',
    icon: Store,
    emoji: '🏪',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    value: 'DELIVERY',
    label: 'Delivery',
    desc: 'Deliver orders & earn',
    icon: Truck,
    emoji: '🛵',
    gradient: 'from-emerald-400 to-teal-500',
  },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [selectedRole, setSelectedRole] = useState('USER');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.phone, selectedRole);
      toast.success('Account created! Welcome to Zing 🎉');
      const redirect = { USER: '/', RESTAURANT: '/dashboard', DELIVERY: '/deliveries' };
      navigate(redirect[selectedRole] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = ROLES.find((r) => r.value === selectedRole);

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel – brand ── */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 text-center">
          <p className="text-4xl font-black text-white flex items-center justify-center gap-2 mb-2">
            <Zap className="h-8 w-8" fill="white" /> Zing
          </p>
          <p className="text-white/80 text-sm mb-12">Join thousands of happy customers</p>
          <div className="text-6xl mb-6">{activeRole?.emoji}</div>
          <h2 className="text-2xl font-black text-white">{activeRole?.label}</h2>
          <p className="text-white/70 text-sm mt-1">{activeRole?.desc}</p>
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div
        className="flex w-full lg:w-3/5 flex-col items-center justify-center px-6 py-10 overflow-y-auto page-enter"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="w-full max-w-md">
          <p className="text-xl font-black gradient-text mb-1 lg:hidden">⚡ Zing</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create an account</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Choose your role and get started for free</p>

          {/* Role selector */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all ${
                    isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-105 shadow-md' : 'hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={!isSelected ? { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' } : {}}
                >
                  <span className="text-2xl mb-1.5">{role.emoji}</span>
                  <span className={`text-xs font-bold ${isSelected ? 'text-brand-600 dark:text-brand-400' : ''}`}
                    style={!isSelected ? { color: 'var(--text-secondary)' } : {}}>
                    {role.label}
                  </span>
                  <span className="text-[9px] mt-0.5 leading-tight" style={{ color: 'var(--text-faint)' }}>
                    {role.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required minLength={6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 pr-11 text-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-glow w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <> Sign up as {activeRole?.label} <ArrowRight className="h-4 w-4" /> </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
