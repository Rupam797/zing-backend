import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingCart, LogOut, User, Utensils, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500">
            <Utensils className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Zing
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0.5">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/restaurants">Restaurants</NavLink>
          {user && user.role === 'USER' && <NavLink to="/orders">Orders</NavLink>}
          {user && user.role === 'USER' && <NavLink to="/bookings">Bookings</NavLink>}
          {user && user.role === 'RESTAURANT' && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && user.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
          {user && user.role === 'DELIVERY' && <NavLink to="/deliveries">Deliveries</NavLink>}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title={dark ? 'Switch to light' : 'Switch to dark'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              {user.role === 'USER' && (
                <Link
                  to="/cart"
                  className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </Link>
              )}
              <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                <User className="h-3 w-3" />
                {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Log in
              </Link>
              <Link to="/signup" className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-md" style={{ color: 'var(--text-muted)' }}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(!open)} className="flex h-8 w-8 items-center justify-center rounded-md" style={{ color: 'var(--text-muted)' }}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-4 pb-3 pt-1" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
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
            <button onClick={handleLogout} className="w-full text-left rounded-md px-3 py-2 text-xs text-red-500">Log out</button>
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
    <Link to={to} className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link to={to} onClick={onClick} className="block rounded-md px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </Link>
  );
}
