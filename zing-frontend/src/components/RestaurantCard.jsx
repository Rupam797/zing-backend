import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';

export default function RestaurantCard({ restaurant }) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/60 backdrop-blur-sm transition-all duration-300 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1"
    >
      {/* Image placeholder with gradient */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand-500/20 via-surface-800 to-surface-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">🍽️</span>
        </div>
        {/* Open/closed badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              restaurant.open
                ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
            }`}
          >
            {restaurant.open ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-white transition group-hover:text-brand-400">
          {restaurant.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-surface-400">
          <MapPin className="h-3.5 w-3.5" />
          <span>{restaurant.address || restaurant.city}</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-lg bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-400">
            <Star className="h-3 w-3 fill-current" />
            4.5
          </div>
          <span className="text-xs text-surface-500">•</span>
          <span className="text-xs text-surface-400">{restaurant.city}</span>
        </div>
      </div>
    </Link>
  );
}
