import { useEffect, useState } from 'react';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import api from '../api/axios';
import useGeolocation from '../hooks/useGeolocation';
import RestaurantCard from '../components/RestaurantCard';

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
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#e6e3d2] pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-brand-500 text-3xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              <h1 className="font-headline-lg text-3xl md:text-4xl uppercase">Restaurants</h1>
            </div>
            <p className="text-[#5b4040] font-body-lg text-sm uppercase tracking-wide">
              {geo.lat ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Showing restaurants near your coordinates
                </span>
              ) : (
                'Browse and order from premium local spots'
              )}
            </p>
          </div>

          {/* Sort toggle */}
          <div className="flex items-center gap-1.5 rounded-full border-2 border-[#e6e3d2] p-1 bg-white">
            <button
              onClick={() => setSortBy('distance')}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-label-caps uppercase tracking-wider transition-all ${
                sortBy === 'distance' ? 'bg-brand-500 text-white shadow-md' : 'text-[#5b4040] hover:text-brand-500'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" /> Nearby
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-label-caps uppercase tracking-wider transition-all ${
                sortBy === 'name' ? 'bg-brand-500 text-white shadow-md' : 'text-[#5b4040] hover:text-brand-500'
              }`}
            >
              A-Z
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl mb-8 group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-[#1c1c12]/40">
            <Search className="h-5 w-5" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or address…"
            className="w-full h-16 pl-14 pr-6 rounded-full border-4 border-[#e6e3d2] focus:border-brand-500 bg-white text-sm outline-none transition-all"
          />
        </div>

        {/* GPS status */}
        {geo.loading && (
          <div className="mb-6 flex items-center gap-2 text-xs font-label-caps tracking-wider uppercase text-[#5b4040] bg-[#f1eedd] p-3.5 rounded-2xl border-2 border-[#e6e3d2]">
            <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            Getting your location for nearby sorting…
          </div>
        )}
        {geo.error && (
          <div className="mb-6 flex items-center gap-2 text-xs font-label-caps tracking-wider uppercase text-amber-600 bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-200">
            <MapPin className="h-4 w-4 text-amber-500" />
            {geo.error.includes('denied') ? 'Enable location to see nearby restaurants' : 'Location unavailable — showing all'}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#f1eedd] h-80 rounded-[40px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2] max-w-xl mx-auto px-6">
            <span className="material-symbols-outlined text-brand-500 text-5xl mb-4">search_off</span>
            <h3 className="font-headline-md text-xl uppercase mb-2">No restaurants found</h3>
            <p className="font-body-md text-[#5b4040] text-sm uppercase">Try typing a different name or checking your connection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-8">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} distanceKm={distances[r.id] ?? null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
