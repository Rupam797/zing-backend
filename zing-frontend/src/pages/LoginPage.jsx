import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

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
      toast.success(`Welcome back, ${user.name}!`);
      // Role-based redirect
      const redirectMap = {
        USER: '/',
        RESTAURANT: '/dashboard',
        ADMIN: '/admin',
        DELIVERY: '/deliveries',
      };
      navigate(redirectMap[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-500/25">
            <Utensils className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-surface-400">Sign in to your Zing account</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-6 backdrop-blur-sm space-y-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-300">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 pr-12 text-sm text-white placeholder-surface-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-brand-400 hover:text-brand-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
