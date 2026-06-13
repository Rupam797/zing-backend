import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingCart, LogOut, User, Menu, X, Sun, Moon, MapPin } from 'lucide-react';
import { useState } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import useReverseGeocode from '../hooks/useReverseGeocode';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Auto-detect location
  const geo = useGeolocation({ enabled: true });
  const reverseGeo = useReverseGeocode(geo.lat, geo.lng);
  const locationLabel = reverseGeo.address
    ? `${reverseGeo.address}${reverseGeo.city ? `, ${reverseGeo.city}` : ''}`
    : reverseGeo.loading ? 'Detecting…' : null;

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-bg-primary/90 backdrop-blur-md transition-all duration-300" style={{ borderColor: 'var(--border-color)' }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
         <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <svg className="h-6 w-6 shrink-0" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="26" fill="#c41e3a" />
            <path d="M 32 26 H 68 L 44 48 H 68 L 32 74 L 40 48 H 28 Z" fill="white" />
          </svg>
          <span className="font-headline-md text-xl text-brand-500 uppercase tracking-tighter font-bold">
            Zing
          </span>
        </Link>

        {/* Location indicator */}
        {locationLabel && (
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-[10px] font-label-caps tracking-wider uppercase max-w-[200px] cursor-default text-text-primary"
            title={reverseGeo.fullAddress || locationLabel}
          >
            <MapPin className="h-3 w-3 shrink-0 text-brand-500" />
            <span className="truncate">{locationLabel}</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          </div>
        )}

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/restaurants">Restaurants</NavLink>
          {user && user.role === 'USER' && <NavLink to="/orders">Orders</NavLink>}
          {user && user.role === 'USER' && <NavLink to="/bookings">Bookings</NavLink>}
          {user && user.role === 'RESTAURANT' && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && user.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
          {user && user.role === 'DELIVERY' && <NavLink to="/deliveries">Deliveries</NavLink>}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            title={dark ? 'Switch to light' : 'Switch to dark'}
          >
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {user ? (
            <>
              {user.role === 'USER' && (
                <Link
                  to="/cart"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                  {count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </Link>
              )}
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                <User className="h-3 w-3" />
                {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-label-caps text-xs tracking-wider uppercase text-on-surface-variant hover:text-brand-500 px-3 py-2 transition-colors">
                Log in
              </Link>
              <Link to="/signup" className="bg-brand-500 text-white hover:brightness-115 px-6 py-2 rounded-full font-label-caps text-xs tracking-wider uppercase transition-all shadow-md">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color: 'var(--text-muted)' }}>
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <button onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ color: 'var(--text-muted)' }}>
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 pb-4 pt-2 shadow-inner max-h-[calc(100vh-4rem)] overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
          <MobileLink to="/" onClick={() => setOpen(false)}>Home</MobileLink>
          <MobileLink to="/restaurants" onClick={() => setOpen(false)}>Restaurants</MobileLink>
          {user && user.role === 'USER' && (
            <>
              <MobileLink to="/cart" onClick={() => setOpen(false)}>Cart {count > 0 && `(${count})`}</MobileLink>
              <MobileLink to="/orders" onClick={() => setOpen(false)}>My Orders</MobileLink>
              <MobileLink to="/bookings" onClick={() => setOpen(false)}>Bookings</MobileLink>
            </>
          )}
          {user && user.role === 'RESTAURANT' && <MobileLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>}
          {user && user.role === 'ADMIN' && <MobileLink to="/admin" onClick={() => setOpen(false)}>Admin</MobileLink>}
          {user && user.role === 'DELIVERY' && <MobileLink to="/deliveries" onClick={() => setOpen(false)}>Deliveries</MobileLink>}
          {user ? (
            <button onClick={handleLogout} className="w-full text-left rounded-md px-3 py-2 text-xs font-label-caps uppercase tracking-wider text-red-500">Log out</button>
          ) : (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed" style={{ borderColor: 'var(--border-color)' }}>
              <Link to="/login" onClick={() => setOpen(false)} className="block text-center rounded-full border border-brand-500/30 py-2 text-xs font-label-caps uppercase tracking-wider text-on-surface-variant">
                Log in
              </Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block text-center rounded-full bg-brand-500 py-2 text-xs font-label-caps uppercase tracking-wider text-white">
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider transition-colors ${
        isActive
          ? 'text-brand-500 border-b-2 border-brand-500 pb-1'
          : 'text-on-surface-variant hover:text-brand-500'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block rounded-md px-3 py-2 text-xs font-label-caps uppercase tracking-wider ${
        isActive ? 'text-brand-500 bg-brand-50/50 dark:bg-brand-500/10' : 'text-text-secondary hover:text-brand-500'
      }`}
    >
      {children}
    </Link>
  );
}
