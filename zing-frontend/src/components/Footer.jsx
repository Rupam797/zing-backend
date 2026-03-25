import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-16 border-t py-10 px-4"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-1">
            <p className="text-lg font-black gradient-text mb-1">⚡ Zing</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Fast food delivery, restaurant bookings, and more — all in one place.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Explore</p>
            <ul className="space-y-2">
              {[
                { to: '/',            label: 'Home' },
                { to: '/restaurants', label: 'Restaurants' },
                { to: '/orders',      label: 'My Orders' },
                { to: '/bookings',    label: 'Bookings' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs transition-colors hover:text-brand-500" style={{ color: 'var(--text-muted)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Partners</p>
            <ul className="space-y-2">
              {[
                { to: '/signup', label: 'List Your Restaurant' },
                { to: '/signup', label: 'Become a Rider' },
                { to: '/dashboard', label: 'Restaurant Dashboard' },
                { to: '/deliveries', label: 'Delivery Dashboard' },
              ].map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="text-xs transition-colors hover:text-brand-500" style={{ color: 'var(--text-muted)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Legal</p>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'].map((t) => (
                <li key={t}>
                  <span className="text-xs cursor-default" style={{ color: 'var(--text-muted)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            © {year} Zing Food Delivery. All rights reserved.
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Made with ❤️ for food lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
