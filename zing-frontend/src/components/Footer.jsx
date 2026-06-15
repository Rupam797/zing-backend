import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1c1c12] text-[#fdfae9] py-20 px-4 border-t border-[#48473b]/20">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <svg className="h-8 w-8 shrink-0" viewBox="0 0 100 100">
                <rect width="100" height="100" rx="26" fill="#c41e3a" />
                <path d="M 32 26 H 68 L 44 48 H 68 L 32 74 L 40 48 H 28 Z" fill="white" />
              </svg>
              <span className="font-headline-lg text-3xl text-brand-500 uppercase tracking-tighter">Zing</span>
            </div>
            <p className="text-[#c9c7b7] font-body-md text-xs leading-relaxed uppercase">
              Fast food delivery, restaurant bookings, and more — all in one place.
            </p>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">share</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">mail</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">call</span>
              </div>
            </div>
          </div>

          {/* Explore Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-caps text-xs tracking-wider text-brand-500 uppercase pb-2 border-b border-white/10">Explore</h4>
            <ul className="space-y-3">
              {[
                { to: '/',            label: 'Home' },
                { to: '/restaurants', label: 'Restaurants' },
                { to: '/orders',      label: 'My Orders' },
                { to: '/bookings',    label: 'Bookings' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[#c9c7b7] hover:text-brand-500 transition-colors font-body-md text-xs uppercase">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-caps text-xs tracking-wider text-brand-500 uppercase pb-2 border-b border-white/10">Partners</h4>
            <ul className="space-y-3">
              {[
                { to: '/signup', label: 'List Your Restaurant' },
                { to: '/signup', label: 'Become a Rider' },
                { to: '/dashboard', label: 'Restaurant Dashboard' },
                { to: '/deliveries', label: 'Delivery Dashboard' },
              ].map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="text-[#c9c7b7] hover:text-brand-500 transition-colors font-body-md text-xs uppercase">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-label-caps text-xs tracking-wider text-brand-500 uppercase pb-2 border-b border-white/10">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'].map((t) => (
                <li key={t}>
                  <span className="text-[#c9c7b7] hover:text-brand-500 transition-colors font-body-md text-xs uppercase cursor-pointer">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#c9c7b7]/60 font-label-caps text-[10px] tracking-widest uppercase">
          <p>© {year} Zing Food Delivery. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <span className="text-brand-500 material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> for food lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
