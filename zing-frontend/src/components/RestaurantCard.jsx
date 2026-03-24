import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { imageUrl } from '../api/upload';

export default function RestaurantCard({ restaurant }) {
  const img = imageUrl(restaurant.imageUrl);

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="block rounded-lg border transition-colors hover:border-brand-400 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="h-32 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
        {img ? (
          <img src={img} alt={restaurant.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl">🍽️</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{restaurant.name}</h3>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${restaurant.open ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {restaurant.open ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <MapPin className="h-3 w-3" />
          {restaurant.address || restaurant.city}
        </div>
      </div>
    </Link>
  );
}
