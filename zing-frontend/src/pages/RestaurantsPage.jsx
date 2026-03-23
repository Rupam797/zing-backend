import { useEffect, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import api from '../api/axios';
import RestaurantCard from '../components/RestaurantCard';

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/restaurants')
      .then((res) => {
        setRestaurants(res.data);
        setFiltered(res.data);
        const uniqueCities = [...new Set(res.data.map((r) => r.city).filter(Boolean))];
        setCities(uniqueCities);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = restaurants;
    if (cityFilter) {
      result = result.filter((r) => r.city === cityFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, cityFilter, restaurants]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Explore <span className="text-brand-500">Restaurants</span>
        </h1>
        <p className="mt-2 text-surface-400">Find the perfect spot for your next meal</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            placeholder="Search restaurants…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-700 bg-surface-900/60 py-3 pl-10 pr-4 text-sm text-white placeholder-surface-500 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500 pointer-events-none" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="appearance-none rounded-xl border border-surface-700 bg-surface-900/60 py-3 pl-10 pr-10 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="text-5xl mb-4">🍜</span>
          <h3 className="text-xl font-semibold text-surface-300">No restaurants found</h3>
          <p className="mt-1 text-surface-500">Try a different search or city filter</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
