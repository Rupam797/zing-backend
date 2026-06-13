import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, Zap, Utensils, MapPin, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: Zap, text: 'Lightning-fast delivery in 30 mins' },
  { icon: Utensils, text: '500+ premium local restaurants' },
  { icon: MapPin, text: 'Real-time live order tracking' },
  { icon: Lock, text: 'Secure transactions, always' },
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
    <div className="flex min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-16">
      {/* ── Left panel – brand ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden bg-[#1c1c12]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <svg className="h-10 w-10 text-brand-500 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 76h76c3.3 0 6 2.7 6 6s-2.7 6-6 6H12c-3.3 0-6-2.7-6-6s2.7-6 6-6z" fill="currentColor" />
              <path d="M18 70C18 40.2 32.3 16 50 16s32 24.2 32 54H18z" fill="currentColor" />
              <circle cx="50" cy="10" r="6" fill="currentColor" />
              <path d="M53 23L37 45h11l-3 18 17-23H49z" fill="#fbbf24" />
            </svg>
            <span className="font-display-hero text-4xl text-brand-500 uppercase tracking-wider italic text-stroke-primary">Zing</span>
          </Link>
          <p className="mt-2 text-xs font-label-caps text-white/50 tracking-widest uppercase">Express Food Delivery & Booking</p>
        </div>

        {/* Center content */}
        <div className="relative z-10 my-auto">
          <h2 className="text-5xl font-display-hero text-white uppercase tracking-tight leading-none mb-10">
            GOOD FOOD,<br />
            <span className="text-brand-500 italic text-stroke-primary">GREAT TIMING.</span>
          </h2>
          <ul className="space-y-4 max-w-md">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.text} className="flex items-center gap-4 bg-[#28281d] border-2 border-[#48473b]/40 p-4 rounded-2xl shadow-lg">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c1c12] text-brand-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-label-caps uppercase tracking-wider text-white/95">{f.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 pt-4 border-t border-[#48473b]/30">
          <p className="text-xs italic text-white/40 font-medium">
            "ZING ALWAYS HITS THE SPOT EVERY TIME—BOLD FLAVORS, FRESH INGREDIENTS, AND FRIENDLY SERVICE."
          </p>
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-16 page-enter bg-[#fdfae9]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display-hero text-4xl text-brand-500 uppercase tracking-wider italic text-stroke-primary">Zing</span>
          </div>

          <h1 className="text-3xl font-headline-lg text-[#1c1c12] uppercase mb-2">Welcome back</h1>
          <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide">
            Sign in to continue your food journey
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">
                Email address
              </label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-5 py-3.5 text-sm outline-none transition-all text-[#1c1c12]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-5 py-3.5 pr-14 text-sm outline-none transition-all text-[#1c1c12]"
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#5b4040] hover:text-brand-500 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-500 py-4 text-xs font-label-caps uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <> Sign in <ArrowRight className="h-4 w-4" /> </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-500 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
