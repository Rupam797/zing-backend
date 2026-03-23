import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, MapPin, Clock, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-brand-500/8 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-400">
            <Zap className="h-3.5 w-3.5" /> Real-time Food Delivery & Booking
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Delicious Food,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-surface-400 leading-relaxed">
            Order from top restaurants near you or book a table — all in one place. Fresh meals, real-time tracking, and instant reservations.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/restaurants"
              className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand-500/25 transition-all hover:shadow-brand-500/40 hover:brightness-110"
            >
              Explore Restaurants
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {!user && (
              <Link
                to="/signup"
                className="rounded-2xl border border-surface-700 px-8 py-4 text-base font-semibold text-surface-200 transition hover:border-surface-600 hover:bg-surface-800/60"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Why choose <span className="text-brand-500">Zing</span>?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-surface-400">
          A seamless food experience from order to delivery.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Lightning Fast"
            desc="Real-time order tracking and rapid delivery powered by WebSocket technology."
          />
          <FeatureCard
            icon={<MapPin className="h-6 w-6" />}
            title="City-wide Coverage"
            desc="Browse restaurants across your entire city. Filter, search, and discover new favorites."
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="Instant Booking"
            desc="Reserve a table at any restaurant with just a few taps. No phone calls needed."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Secure Payments"
            desc="Your data is protected with industry-standard encryption and secure JWT auth."
          />
          <FeatureCard
            icon={<span className="text-2xl">🍽️</span>}
            title="Curated Menus"
            desc="Every restaurant manages their own live menu so you always see what's available."
          />
          <FeatureCard
            icon={<span className="text-2xl">📊</span>}
            title="Owner Dashboard"
            desc="Restaurant owners get a full dashboard to manage menus, orders, and bookings."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-surface-800/60 bg-gradient-to-br from-brand-500/10 via-surface-900 to-surface-900 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand-500/10 blur-3xl" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="relative mt-3 text-surface-400">
            Join thousands of food lovers already using Zing.
          </p>
          <Link
            to={user ? '/restaurants' : '/signup'}
            className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-8 py-4 font-semibold text-white shadow-xl shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
          >
            {user ? 'Browse Restaurants' : 'Sign Up Free'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800/60 py-8 text-center text-sm text-surface-500">
        © 2026 Zing. Built with ❤️ for food lovers everywhere.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="group rounded-2xl border border-surface-800/60 bg-surface-900/60 p-6 transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition group-hover:bg-brand-500/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-surface-400">{desc}</p>
    </div>
  );
}
