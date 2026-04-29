import { useEffect, useState } from 'react';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import api from '../api/axios';
import useGeolocation from '../hooks/useGeolocation';
import RestaurantCard from '../components/RestaurantCard';

/* Haversine distance (km) — client-side fallback */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [distances, setDistances] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'name'
  const geo = useGeolocation({ enabled: true });

  useEffect(() => {
    api.get('/restaurants')
      .then((r) => setRestaurants(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calculate distances when GPS or restaurants change
  useEffect(() => {
    if (!geo.lat || !geo.lng || restaurants.length === 0) return;

    const dist = {};
    restaurants.forEach((r) => {
      if (r.latitude && r.longitude) {
        dist[r.id] = Math.round(haversineKm(geo.lat, geo.lng, r.latitude, r.longitude) * 10) / 10;
      }
    });
    setDistances(dist);
  }, [geo.lat, geo.lng, restaurants]);

  // Filter and sort
  let filtered = restaurants.filter(
    (r) => r.name?.toLowerCase().includes(search.toLowerCase()) ||
           r.city?.toLowerCase().includes(search.toLowerCase()) ||
           r.address?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortBy === 'distance' && Object.keys(distances).length > 0) {
    filtered.sort((a, b) => {
      const da = distances[a.id] ?? 9999;
      const db = distances[b.id] ?? 9999;
      return da - db;
    });
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Restaurants</h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {geo.lat ? (
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Showing restaurants near you
              </span>
            ) : (
              'Browse and order from local restaurants'
            )}
          </p>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'var(--bg-input)' }}>
          <button
            onClick={() => setSortBy('distance')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              sortBy === 'distance' ? 'bg-brand-500 text-white shadow-sm' : ''
            }`}
            style={sortBy !== 'distance' ? { color: 'var(--text-muted)' } : {}}
          >
            <Navigation className="h-3 w-3" /> Nearby
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              sortBy === 'name' ? 'bg-brand-500 text-white shadow-sm' : ''
            }`}
            style={sortBy !== 'name' ? { color: 'var(--text-muted)' } : {}}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city, or address…"
          className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs outline-none focus:border-brand-500 transition-colors"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* GPS status */}
      {geo.loading && (
        <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Getting your location for nearby sorting…
        </div>
      )}
      {geo.error && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-500">
          <MapPin className="h-3 w-3" />
          {geo.error.includes('denied') ? 'Enable location to see nearby restaurants' : 'Location unavailable — showing all'}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="mt-12 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No restaurants found</div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} distanceKm={distances[r.id] ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
