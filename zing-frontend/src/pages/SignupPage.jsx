import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User, Store, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'USER', label: 'Customer', desc: 'Order food & book tables', icon: User },
  { value: 'RESTAURANT', label: 'Restaurant', desc: 'Manage your restaurant', icon: Store },
  { value: 'DELIVERY', label: 'Delivery', desc: 'Deliver orders & earn', icon: Truck },
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
      toast.success('Account created!');
      const redirect = { USER: '/', RESTAURANT: '/dashboard', DELIVERY: '/deliveries' };
      navigate(redirect[selectedRole] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16 pb-8">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Create an account</h1>
        <p className="mt-1 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Choose your role and join Zing</p>

        {/* Role selector */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.value;
            return (
              <button key={role.value} type="button" onClick={() => setSelectedRole(role.value)}
                className={`relative flex flex-col items-center rounded-md border p-3 text-center transition-colors cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''}`}
                style={!isSelected ? { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' } : {}}>
                <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-500' : ''}`} style={!isSelected ? { color: 'var(--text-muted)' } : {}} />
                <span className={`mt-1.5 text-[11px] font-semibold ${isSelected ? 'text-brand-600 dark:text-brand-400' : ''}`} style={!isSelected ? { color: 'var(--text-secondary)' } : {}}>{role.label}</span>
                <span className="text-[9px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{role.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-xs outline-none focus:border-brand-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Phone</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-xs outline-none focus:border-brand-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-xs outline-none focus:border-brand-500"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} required minLength={6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border px-3 py-2 pr-9 text-xs outline-none focus:border-brand-500"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }}>
                {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-brand-500 py-2 text-xs font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : `Sign up as ${ROLES.find((r) => r.value === selectedRole)?.label}`}
          </button>
        </form>
        <p className="mt-4 text-center text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" className="font-medium text-brand-500 hover:text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
