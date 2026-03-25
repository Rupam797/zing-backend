import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const EMOJIS = ['🍕', '🍔', '🍜', '🍱', '🥙', '🍛', '🧆', '🍩'];

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Floating food emojis */}
      {EMOJIS.map((e, i) => (
        <span
          key={i}
          className="pointer-events-none absolute select-none text-3xl opacity-10"
          style={{
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 3) * 25}%`,
            animation: `fadeIn ${1 + i * 0.15}s ease both`,
            transform: `rotate(${-20 + i * 8}deg)`,
          }}
        >
          {e}
        </span>
      ))}

      {/* Content */}
      <div className="relative z-10 page-enter">
        <p className="text-8xl font-black gradient-text mb-2">404</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p className="text-sm max-w-xs mx-auto mb-8" style={{ color: 'var(--text-muted)' }}>
          Looks like this page went out for delivery and never came back.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors btn-glow"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
