import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, LogOut, User, LayoutDashboard, Utensils, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-800/60 bg-surface-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25 transition group-hover:shadow-brand-500/40">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Zing<span className="text-brand-500">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/restaurants">Restaurants</NavLink>
          {user && user.role === 'USER' && <NavLink to="/bookings">Bookings</NavLink>}
          {user && user.role === 'RESTAURANT' && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && user.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
          {user && user.role === 'DELIVERY' && <NavLink to="/deliveries">Deliveries</NavLink>}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'USER' && (
                <Link
                  to="/cart"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-800/60 text-surface-200 transition hover:bg-surface-700 hover:text-brand-400"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </Link>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-surface-800/60 px-3 py-2">
                <User className="h-4 w-4 text-brand-400" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-800/60 text-surface-300 transition hover:bg-red-500/20 hover:text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-surface-200 transition hover:bg-surface-800/60 hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl md:hidden bg-surface-800/60 text-surface-200"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-surface-800/60 bg-surface-950/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-1">
          <MobileLink to="/" onClick={() => setOpen(false)}>Home</MobileLink>
          <MobileLink to="/restaurants" onClick={() => setOpen(false)}>Restaurants</MobileLink>
          {user && user.role === 'USER' && (
            <>
              <MobileLink to="/cart" onClick={() => setOpen(false)}>
                Cart {count > 0 && `(${count})`}
              </MobileLink>
              <MobileLink to="/bookings" onClick={() => setOpen(false)}>Bookings</MobileLink>
            </>
          )}
          {user && user.role === 'RESTAURANT' && (
            <MobileLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
          )}
          {user && user.role === 'ADMIN' && (
            <MobileLink to="/admin" onClick={() => setOpen(false)}>Admin</MobileLink>
          )}
          {user && user.role === 'DELIVERY' && (
            <MobileLink to="/deliveries" onClick={() => setOpen(false)}>Deliveries</MobileLink>
          )}
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              Log out
            </button>
          ) : (
            <>
              <MobileLink to="/login" onClick={() => setOpen(false)}>Log in</MobileLink>
              <MobileLink to="/signup" onClick={() => setOpen(false)}>Sign up</MobileLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-sm font-medium text-surface-300 transition hover:bg-surface-800/60 hover:text-white"
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm text-surface-200 hover:bg-surface-800/60"
    >
      {children}
    </Link>
  );
}
