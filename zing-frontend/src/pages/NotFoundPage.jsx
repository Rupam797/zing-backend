import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const EMOJIS = ['🍕', '🍔', '🍜', '🍱', '🥙', '🍛', '🧆', '🍩'];

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center bg-[#fdfae9] text-[#1c1c12] pt-16">
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
      <div className="relative z-10 page-enter max-w-md w-full p-12 bg-white border-4 border-[#e6e3d2] rounded-[32px] shadow-xl">
        <p className="text-8xl font-display-hero text-brand-500 uppercase tracking-tighter italic text-stroke-primary mb-4">404</p>
        <h1 className="font-headline-lg text-2xl text-[#1c1c12] uppercase mb-2">
          Page not found
        </h1>
        <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide max-w-xs mx-auto mb-8">
          Looks like this page went out for delivery and never came back.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3.5 text-xs font-label-caps uppercase tracking-wider text-white hover:brightness-110 transition-colors shadow-lg"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-full border-4 border-[#e6e3d2] px-6 py-3 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] bg-white hover:bg-[#f7f4e3] transition-colors shadow-md"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
