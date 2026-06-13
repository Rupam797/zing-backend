import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User, Store, Truck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'USER',
    label: 'Customer',
    desc: 'Order food & book tables',
    icon: User,
  },
  {
    value: 'RESTAURANT',
    label: 'Restaurant Owner',
    desc: 'Manage your restaurant',
    icon: Store,
  },
  {
    value: 'DELIVERY',
    label: 'Delivery Agent',
    desc: 'Deliver orders & earn money',
    icon: Truck,
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
    <div className="flex min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-16">
      {/* ── Left panel – brand ── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-16 relative overflow-hidden bg-[#1c1c12]">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-block">
            <span className="font-display-hero text-4xl text-brand-500 uppercase tracking-wider italic text-stroke-primary">Zing</span>
          </Link>
          <p className="mt-2 text-xs font-label-caps text-white/50 tracking-widest uppercase">Express Food Delivery & Booking</p>
        </div>

        {/* Center content */}
        <div className="relative z-10 my-auto text-center flex flex-col items-center">
          <div className="mb-6 animate-bounce text-brand-500 bg-white/10 p-6 rounded-[28px] border-4 border-white/20">
            {activeRole && <activeRole.icon className="h-16 w-16" />}
          </div>
          <h2 className="text-3xl font-headline-lg text-white uppercase tracking-wider mb-2">{activeRole?.label}</h2>
          <p className="text-white/70 font-body-lg text-sm uppercase tracking-wide px-6">{activeRole?.desc}</p>
        </div>

        {/* Bottom text */}
        <div className="relative z-10 pt-4 border-t border-[#48473b]/30">
          <p className="text-xs text-white/40 font-label-caps uppercase tracking-wider">
            Join thousands of foodies on Zing
          </p>
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex w-full lg:w-3/5 flex-col items-center justify-center px-6 py-16 overflow-y-auto page-enter bg-[#fdfae9]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display-hero text-4xl text-brand-500 uppercase tracking-wider italic text-stroke-primary">Zing</span>
          </div>

          <h1 className="text-3xl font-headline-lg text-[#1c1c12] uppercase mb-2">Create an account</h1>
          <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide">Choose your role and get started for free</p>

          {/* Role selector */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.value;
              const Icon = role.icon;
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`flex flex-row sm:flex-col items-center gap-4 sm:gap-2.5 rounded-[24px] border-4 p-4 text-left sm:text-center transition-all ${
                    isSelected 
                      ? 'border-brand-500 bg-white scale-102 sm:scale-105 shadow-md' 
                      : 'border-[#e6e3d2] bg-[#f1eedd]/50 hover:border-[#8f6f6f]/40'
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${isSelected ? 'text-brand-500' : 'text-[#5b4040]/70'}`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </span>
                  <span className={`text-[10px] font-label-caps uppercase tracking-wider ${isSelected ? 'text-brand-500' : 'text-[#5b4040]'}`}>
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Full Name</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-sm outline-none transition-all text-[#1c1c12]"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Phone</label>
                <input
                  type="tel" required value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-sm outline-none transition-all text-[#1c1c12]"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-sm outline-none transition-all text-[#1c1c12]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required minLength={6} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 pr-14 text-sm outline-none transition-all text-[#1c1c12]"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5b4040] hover:text-brand-500 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-500 py-4 text-xs font-label-caps uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-60 shadow-lg mt-6"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <> Sign up as {activeRole?.label} <ArrowRight className="h-4 w-4" /> </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
