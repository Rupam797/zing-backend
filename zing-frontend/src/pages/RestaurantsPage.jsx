import { useEffect, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import api from '../api/axios';
import RestaurantCard from '../components/RestaurantCard';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    api.get('/restaurants')
      .then((r) => setRestaurants(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) &&
      (!city || r.city?.toLowerCase().includes(city.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-12">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Restaurants</h1>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Browse and order from local restaurants</p>

      {/* Filters */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--text-faint)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restaurants…"
            className="w-full rounded-md border py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-500"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
        <div className="relative w-36">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--text-faint)' }} />
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City"
            className="w-full rounded-md border py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-500"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="mt-12 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No restaurants found</div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
}
