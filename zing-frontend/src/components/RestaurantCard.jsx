import { Link } from 'react-router-dom';
import { MapPin, Navigation } from 'lucide-react';
import { imageUrl } from '../api/upload';

/**
 * @param {Object} props
 * @param {Object} props.restaurant
 * @param {number|null} props.distanceKm - Distance from user in km (null = unknown)
 */
export default function RestaurantCard({ restaurant, distanceKm = null }) {
  const img = imageUrl(restaurant.imageUrl);

  const formatDist = (d) => {
    if (d === null || d === undefined) return null;
    if (d < 1) return `${Math.round(d * 1000)}m`;
    return `${d.toFixed(1)}km`;
  };

  const distLabel = formatDist(distanceKm);

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="block rounded-xl border transition-all duration-200 hover:border-brand-400 hover:-translate-y-0.5 hover:shadow-lg overflow-hidden group"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="h-32 flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: 'var(--bg-input)' }}>
        {img ? (
          <img src={img} alt={restaurant.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-3xl">🍽️</span>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Open/Closed badge */}
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ${
          restaurant.open
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500/90 text-white'
        }`}>
          {restaurant.open ? 'Open' : 'Closed'}
        </span>

        {/* Distance badge */}
        {distLabel && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(139,92,246,0.35)',
            }}
          >
            <Navigation className="h-2.5 w-2.5" />
            {distLabel}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold truncate group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {restaurant.name}
          </h3>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{restaurant.address || restaurant.city || 'Local Area'}</span>
          {distLabel && (
            <span className="ml-auto shrink-0 text-[10px] font-medium" style={{ color: '#8b5cf6' }}>
              {distLabel} away
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
