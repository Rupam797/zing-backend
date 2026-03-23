import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Utensils, User, Store, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'USER',
    label: 'Customer',
    desc: 'Order food & book tables',
    icon: User,
    color: 'brand',
  },
  {
    value: 'RESTAURANT',
    label: 'Restaurant Owner',
    desc: 'Manage your restaurant',
    icon: Store,
    color: 'emerald',
  },
  {
    value: 'DELIVERY',
    label: 'Delivery Partner',
    desc: 'Deliver orders & earn',
    icon: Truck,
    color: 'purple',
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
      const redirectMap = { USER: '/', RESTAURANT: '/dashboard', DELIVERY: '/deliveries' };
      navigate(redirectMap[selectedRole] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const colorMap = {
    brand: {
      selected: 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30',
      icon: 'bg-brand-500/20 text-brand-400',
    },
    emerald: {
      selected: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30',
      icon: 'bg-emerald-500/20 text-emerald-400',
    },
    purple: {
      selected: 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30',
      icon: 'bg-purple-500/20 text-purple-400',
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-500/25">
            <Utensils className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="mt-2 text-surface-400">Choose your role and join Zing</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            const colors = colorMap[role.color];
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? colors.selected
                    : 'border-surface-700 bg-surface-900/60 hover:border-surface-600 hover:bg-surface-800/60'
                }`}
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    isSelected ? colors.icon : 'bg-surface-800 text-surface-400 group-hover:text-surface-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-surface-300'}`}>
                  {role.label}
                </span>
                <span className="mt-0.5 text-[11px] text-surface-500 leading-tight">{role.desc}</span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-6 backdrop-blur-sm space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-300">Phone</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

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
                minLength={6}
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
            {loading ? 'Creating account…' : `Sign up as ${ROLES.find((r) => r.value === selectedRole)?.label}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
