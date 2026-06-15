import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import api from '../api/axios';
import useGeolocation from '../hooks/useGeolocation';
import toast from 'react-hot-toast';
import useReverseGeocode from '../hooks/useReverseGeocode';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(d) {
  if (d === null || d === undefined) return null;
  if (d < 1) return `${Math.round(d * 1000)}m`;
  return `${d.toFixed(1)}km`;
}

const CATEGORIES = [
  { key: 'biryani', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASriXkZVV7SbRUiRpd6wIJw-gs3O1FF_m1O8N11y76-DRKLFd0Kld0ILPOhaWJjimmAQyPSzEqMqPocIQAzuDLT53KrPd_PAL0bVYNO6PSpINwp4Z2j0AecsmDrPtFE4puezFZZqg0yvInpxyf-tdWjQ9uYRaud6T8x_O0CDgl-M6S7-IYd1msFOWR0hK1-0Tnz6hds6J9APYS3r6ACOina-G6EAd9LsleOor26k0twJlgmlfRH-Q-B_675wW0e1_Z3P8NWcQkWA', label: 'Biryani' },
  { key: 'pizza', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbO_l0ElXoJRkTYl-MTO0rn-qs6Y88HIarjem61Owl0yRJkpvuj5K5uUxHqpN8CEF5-vpSpIiMhE2URXQWih67SETehU_LBNWIe4-2d0zKcUvnWpXSmKn3jQZj6G0qUIQVCwa05EhQcP3M_SX8QkUadO2gqHi9lGCUhHEnWx4gm4d91eC80cpDDtkHmvbLZESsGbU31331y6_hqeqN3jmceQTkjnydr0h6H-b3DTXCFL0KeEPf0fouqliqoHdggQTglmEi5wepIg', label: 'Pizza' },
  { key: 'burger', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl3JSxVE0vGMV0-PUllED7jRZLuWT9zWqZ6FYCq27lK5Rtf4T-o9bF2Dk19cJf4NFCYK4kOQfoH23p7pnNglv31jSNEMnQj7oqk7bQKwb7TL1i2VMDVHDYMbTxcSwV3Ol43sTysEy-ahqsaIaaNnuL6yZERSV7KkxUqNVfC-T8CCAJYdhN2lw3ez9jHSoLRrt5yGpis8AYCcWvTykRLUNFtjOUCOKVDXhko1pnaKY9lf-9u1tYQfOJgD3Td4iw2-6jbQvXhU908A', label: 'Burgers' },
  { key: 'noodles', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhw4P9EXlVJSiqYzkwDTp3nChxvnNNEkbbsdJdnITknNoSgw4eaEz5qmMMZc3R6AayHxqJnFDdGljaE6l6FEy8efTmwx4D8vglwbUAKj--m54wU2oVhdcKbtJtnfMXuA76yzCZlhd9dHGtR_7YSqOjZq3E70qTAAkhanjUZ86ZICNiZeLh-RRKErdE_oRqM1o1qARDS8uF9rGfldpmkLJ5ZA27DDTL6p145U1MEdcIakLY_Vnmu3OowUpL42ruMA0eVgw8btDqZQ', label: 'Noodles' },
  { key: 'chicken', image: '/chicken_category.png', label: 'Chicken' },
  { key: 'thali', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtHXuZ2dLwv9weOYXcofUY3z9ohNAm88MGgQjnNrlh3MtRNNrQ5YYS3Km0Bd-zWRzGSpp8MPCZPwjZGyth66gB7LlcbTzQQE2kSp0IjxvfKTP5z1I55ngsapHjX3UAEmaJnA0lYDnOJrtZPKyDivHumj9esJBNV21mgDNhXSNGNZUFFKG0pWgihzV6vW7fn1Lnx99KsoQfWO1RW1Fgdlfu-MC7Ckfm4Ax8Amn_OMQkROkyEs2_Y15iP5RP0IcYaf0UnCU0FfK27A', label: 'Thali' },
  { key: 'dosa', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDldJp0cDeCnVkm7SD1HYGtTBmHmzAFITmuwYbJJ80-OcpO1gCrvnvSICN87Yr6NWth0POectp4xGuNKjyEmdhy6-d2jnN8nQZwNrOeME3bLh7_jeueNP7Bj5Osuqet-QbKrz-hBlm1EJiKBRzRqCdhI-AMNXMmg59kvlS1aqr4J1Gag8Xtn4-32XNKtW2brFu1Uvrtmn47LuHuK18HWUZ0dRFj0wHbj6GvD_OzhoaL6Z8qf0b3eWswhK-M94-tR6dvhE7IY8dGQ', label: 'Dosa' },
  { key: 'rolls', image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&q=80', label: 'Rolls' },
  { key: 'cake', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACKy89I4GoeXj_Pm06feK4ZJHu7umMJ5ce1pPzyEcA9NvZT45MapXVZlhsXUH9eV5uHk5fXvYrn1emuY2XQobeNUn6wJdP3YmgCVbfIShqzA8dl9_GfHOpHo_QOQu2Dmwjkot_8k_n1HKCGTWqaoyjQawbfugShAwjfB6PII4sML7IslQrwg8m3mLtZq6yE4CdceFmks3BA1G35ZHCX2NqXPhTH05m09Pg9Nzr0ePyxLLZySD9EKeG-ZHZnRv7Iwp99201o3zHrQ', label: 'Cakes' },
  { key: 'ice', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80', label: 'Ice Cream' },
  { key: 'sandwich', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&q=80', label: 'Sandwich' },
  { key: 'momos', image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=200&q=80', label: 'Momos' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'nearby', label: 'Nearest First' },
  { key: 'priceLow', label: 'Price: Low to High' },
  { key: 'priceHigh', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A-Z' },
];

const HERO_BG = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80";
const PLACEHOLDER_FOOD = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
const PLACEHOLDER_RESTAURANT = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80";

export default function HomePage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const geo = useGeolocation({ enabled: true });
  const reverseGeo = useReverseGeocode(geo.lat, geo.lng);
  const userLocation = reverseGeo.address
    ? `${reverseGeo.address}${reverseGeo.city ? `, ${reverseGeo.city}` : ''}`
    : null;

  const [allItems, setAllItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSort, setShowSort] = useState(false);
  const [distances, setDistances] = useState(new Map());
  const categoryScrollRef = useRef(null);

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 400;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Calculate distances when GPS available
  useEffect(() => {
    if (!geo.lat || !geo.lng || restaurants.length === 0) return;
    const dist = new Map();
    restaurants.forEach((r) => {
      if (r.latitude && r.longitude) {
        dist.set(r.id, Math.round(haversineKm(geo.lat, geo.lng, r.latitude, r.longitude) * 10) / 10);
      }
    });
    setDistances(dist);
  }, [geo.lat, geo.lng, restaurants]);

  useEffect(() => {
    Promise.all([api.get('/menus/all'), api.get('/restaurants')])
      .then(([mRes, rRes]) => {
        setAllItems(mRes.data || []);
        setRestaurants(rRes.data || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const restaurantMap = new Map();
  restaurants.forEach((r) => { restaurantMap.set(r.id, r); });

  const enrichedItems = allItems.map((item) => ({
    ...item,
    restaurantData: restaurantMap.get(item.restaurant?.id) || item.restaurant,
  }));

  let filtered = enrichedItems.filter((item) => item.available !== false);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) => i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.restaurantData?.name?.toLowerCase().includes(q)
    );
  }
  if (selectedCategory) {
    const cat = selectedCategory.toLowerCase();
    filtered = filtered.filter(
      (i) => i.name?.toLowerCase().includes(cat) || i.description?.toLowerCase().includes(cat)
    );
  }

  if (sortBy === 'priceLow') filtered.sort((a, b) => a.price - b.price);
  else if (sortBy === 'priceHigh') filtered.sort((a, b) => b.price - a.price);
  else if (sortBy === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  else if (sortBy === 'nearby' && distances.size > 0) {
    filtered.sort((a, b) => {
      const da = distances.get(a.restaurant?.id) ?? 9999;
      const db = distances.get(b.restaurant?.id) ?? 9999;
      return da - db;
    });
  }

  const handleAdd = (item) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'USER') { toast.error('Only customers can order'); return; }
    const rest = item.restaurantData || item.restaurant;
    if (!rest) { toast.error('Restaurant info missing'); return; }
    addItem(item, rest);
  };

  return (
    <div className="w-full bg-[#fdfae9] text-[#1c1c12] overflow-x-hidden">
      
      {/* ── Hero Section ── */}
      <section className="relative min-h-[500px] sm:min-h-[600px] md:h-[700px] w-full flex items-center justify-center px-4 md:px-16 mt-16 py-12 md:py-0">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img className="w-full h-full object-cover object-center" alt="Gourmet food table spread" src={HERO_BG} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c12]/85 via-[#1c1c12]/50 to-[#1c1c12]/85"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 backdrop-blur-md px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-brand-500/30">
              <span className="material-symbols-outlined text-brand-500 text-sm md:text-base animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <span className="text-white font-label-caps text-[10px] md:text-xs tracking-wider uppercase">Express delivery in 30 mins</span>
            </div>
            {userLocation && (
              <div className="inline-flex items-center gap-2 bg-brand-500/20 backdrop-blur-md px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-brand-500/30">
                <span className="material-symbols-outlined text-brand-500 text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span className="text-white font-label-caps text-[10px] md:text-xs tracking-wider uppercase truncate max-w-[180px] sm:max-w-[250px]">{userLocation}</span>
                <span className="inline-block h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
            )}
          </div>
          <h1 className="font-display-hero text-4xl sm:text-5xl md:text-7xl lg:text-[90px] text-white mb-4 md:mb-6 uppercase tracking-tight leading-none">
            Delicious moments,<br/>
            <span className="text-brand-500 italic text-stroke-primary">delivered directly.</span>
          </h1>
          <p className="text-white/95 font-body-lg text-sm sm:text-base md:text-lg mb-8 md:mb-12 max-w-2xl mx-auto uppercase tracking-wide px-2">
            Order from local restaurants and get your cravings satisfied right at your door.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto group px-2 sm:px-0">
            <div className="absolute inset-y-0 left-6 sm:left-6 flex items-center pointer-events-none z-10">
              <Search className="text-text-primary opacity-40 h-5 w-5 md:h-6 md:w-6" />
            </div>
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-16 md:h-20 pl-14 md:pl-16 pr-28 md:pr-40 rounded-full border-2 md:border-4 border-brand-500/10 shadow-2xl focus:border-brand-500/30 focus:ring-0 text-[#1c1c12] font-body-md text-sm md:text-base bg-white/95 backdrop-blur-sm transition-all outline-none" 
              placeholder="Search for favorite dishes or restaurants..." 
              type="text"
            />
            <button className="absolute right-4 sm:right-3 top-3 bottom-3 md:top-3 md:bottom-3 bg-brand-500 text-white px-6 md:px-10 rounded-full font-label-caps text-[10px] md:text-xs tracking-wider uppercase hover:brightness-110 transition-all shadow-lg">Search</button>
          </div>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section className="pt-24 pb-8 max-w-6xl mx-auto px-4 md:px-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12 gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-brand-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <h2 className="font-headline-lg text-3xl md:text-4xl text-[#1c1c12] uppercase italic">What's on your mind?</h2>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button 
              onClick={() => scrollCategories('left')}
              className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#e6e3d2] bg-white text-[#1c1c12] hover:border-brand-500 transition-all active:scale-95 shadow-md"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => scrollCategories('right')}
              className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#e6e3d2] bg-white text-[#1c1c12] hover:border-brand-500 transition-all active:scale-95 shadow-md"
              aria-label="Scroll Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div ref={categoryScrollRef} className="flex gap-8 overflow-x-auto pb-8 category-scroll scrollbar-hide snap-x">
          {CATEGORIES.map((cat) => (
            <div 
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
              className="flex flex-col items-center gap-4 min-w-[100px] group cursor-pointer snap-start"
            >
              <div className={`w-20 h-20 rounded-2xl overflow-hidden bg-[#f1eedd] transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg border-4 ${
                selectedCategory === cat.label ? 'border-brand-500 scale-105 shadow-md' : 'border-transparent'
              }`}>
                <img className="w-full h-full object-cover" alt={cat.label} src={cat.image} />
              </div>
              <span className={`font-label-caps text-xs tracking-wider uppercase transition-colors ${
                selectedCategory === cat.label ? 'text-brand-500 font-bold' : 'text-[#5b4040] group-hover:text-brand-500'
              }`}>{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dynamic Dishes Section ── */}
      <section className="pt-8 pb-24 max-w-6xl mx-auto px-4 md:px-16 bg-[#fdfae9]">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="font-headline-lg text-3xl md:text-4xl text-[#1c1c12] uppercase">
                {selectedCategory ? `${selectedCategory} Dishes` : 'Top Dishes Near You'}
              </h2>
              <span className="bg-brand-500 text-white px-3 py-1 rounded-lg font-label-caps text-xs tracking-wider uppercase">
                {filtered.length} ITEMS
              </span>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="text-xs font-semibold text-brand-500 hover:underline">
                  Clear
                </button>
              )}
            </div>
            <p className="text-[#5b4040] font-body-lg text-base uppercase">Handpicked favorites from your neighborhood.</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-3 border-2 border-[#e6e3d2] px-6 py-3 rounded-full font-label-caps text-xs tracking-wider text-[#1c1c12] bg-white uppercase hover:bg-[#f7f4e3] transition-all"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Sort by: {SORT_OPTIONS.find(s => s.key === sortBy)?.label}
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            {showSort && (
              <div className="absolute right-0 top-full mt-2 z-40 rounded-2xl border-2 border-[#e6e3d2] shadow-xl w-52 overflow-hidden bg-white">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                    className={`block w-full text-left px-5 py-3 text-xs uppercase font-label-caps tracking-wider transition-colors hover:bg-[#fdfae9] ${
                      sortBy === opt.key ? 'text-brand-500 font-bold bg-[#f7f4e3]' : 'text-[#1c1c12]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#f1eedd] h-80 rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#f7f4e3] rounded-3xl border-4 border-dashed border-[#e6e3d2] max-w-xl mx-auto px-6">
            <span className="material-symbols-outlined text-brand-500 text-5xl mb-4">search_off</span>
            <h3 className="font-headline-md text-xl uppercase mb-2">No dishes match your filters</h3>
            <p className="font-body-md text-[#5b4040] text-sm uppercase mb-6">Try searching for something else or clearing the filters.</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory(null); }}
              className="bg-brand-500 text-white px-8 py-3 rounded-full font-label-caps text-xs tracking-wider uppercase hover:brightness-110"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((item) => (
              <FoodCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Top Restaurants Section ── */}
      <section className="py-32 max-w-6xl mx-auto px-4 md:px-16 border-t border-[#e6e3d2]/50">
        <div className="flex justify-between items-end mb-16">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-brand-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <h2 className="font-headline-lg text-3xl md:text-4xl text-[#1c1c12] uppercase italic">Top Restaurants</h2>
            </div>
            <p className="text-[#5b4040] font-body-lg text-base uppercase">The most loved dining spots in your area.</p>
          </div>
          <Link to="/restaurants" className="text-brand-500 font-label-caps text-xs tracking-wider flex items-center gap-2 group uppercase border-b-2 border-brand-500 pb-1">
            See all
            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse bg-[#f1eedd] h-80 rounded-[40px]" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xs uppercase font-label-caps tracking-wider text-[#5b4040]">No restaurants registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[...restaurants]
              .sort((a, b) => (distances.get(a.id) ?? 9999) - (distances.get(b.id) ?? 9999))
              .slice(0, 4)
              .map((r) => {
                const hasDist = distances.has(r.id);
                return (
                  <Link 
                    key={r.id}
                    to={`/restaurants/${r.id}`}
                    className="group relative bg-white rounded-[40px] overflow-hidden border-4 border-[#e6e3d2] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
                  >
                    <div className="relative h-80 overflow-hidden bg-[#f1eedd]">
                      <img 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        src={imageUrl(r.imageUrl) || PLACEHOLDER_RESTAURANT} 
                        alt={r.name}
                      />
                      <div className="absolute top-8 left-8 flex gap-3 z-20">
                        {r.open ? (
                          <span className="bg-brand-500 text-white font-label-caps text-[10px] tracking-wider px-5 py-2 rounded-lg uppercase shadow-lg">Open Now</span>
                        ) : (
                          <span className="bg-[#5b4040] text-white font-label-caps text-[10px] tracking-wider px-5 py-2 rounded-lg uppercase shadow-lg">Closed</span>
                        )}
                      </div>
                      {hasDist && (
                        <div className="absolute top-8 right-8 z-20 bg-black/60 backdrop-blur-md text-white font-label-caps text-[10px] tracking-wider px-4 py-2 rounded-full border border-white/10 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">navigation</span>
                          {formatDist(distances.get(r.id))}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500 z-10"></div>
                      <div className="absolute bottom-8 left-8 text-white z-20">
                        <div className="flex items-center gap-2 font-body-md text-xs uppercase text-white/80 tracking-wide">
                          <span className="material-symbols-outlined text-base">location_on</span>
                          {r.city || 'Local Area'}
                        </div>
                      </div>
                    </div>
                    <div className="p-10 z-20 bg-white flex justify-between items-center">
                      <h3 className="font-headline-lg text-2xl text-[#1c1c12] uppercase group-hover:text-brand-500 transition-colors">{r.name}</h3>
                      <div className="flex items-center gap-2 bg-[#e6e3d2] px-4 py-1.5 rounded-xl shrink-0">
                        <span className="material-symbols-outlined text-brand-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="font-headline-md text-sm text-[#1c1c12]">4.6</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </section>

      {/* ── Featured Collage & Story ── */}
      <section className="py-32 relative bg-[#f7f4e3] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-16">
          <div className="relative z-10 flex flex-col items-center text-center">
            
            {/* Ticker Animation */}
            <div className="flex overflow-hidden w-full whitespace-nowrap mb-16 select-none pointer-events-none">
              <div className="flex animate-ticker text-[60px] md:text-[110px] font-display-hero text-brand-500/10 uppercase italic">
                <span className="mx-10">NEW MEAL IN TOWN</span>
                <span className="mx-10">NEW MEAL IN TOWN</span>
                <span className="mx-10">NEW MEAL IN TOWN</span>
                <span className="mx-10">NEW MEAL IN TOWN</span>
              </div>
            </div>

            <div className="relative w-full max-w-4xl h-[550px] flex items-center justify-center">
              {/* Collage Images */}
              <div className="absolute top-0 left-0 w-56 h-56 rotate-[-15deg] z-10 rounded-3xl overflow-hidden border-4 border-white shadow-2xl hidden md:block transition-all hover:rotate-0 duration-300">
                <img className="w-full h-full object-cover" alt="Collage food item 1" src="/chicken_category.png" />
              </div>
              <div className="absolute bottom-10 right-0 w-64 h-64 rotate-[12deg] z-20 rounded-3xl overflow-hidden border-4 border-white shadow-2xl hidden md:block transition-all hover:rotate-0 duration-300">
                <img className="w-full h-full object-cover" alt="Collage food item 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAchT80O8wVjQYrhN8lYshizmlVFYP3waG5-8oPrPqzDJAhhxph9KHrWWQrv53-8ZWp4bNFmjyyAKwhMANuZBnRtelN6bWhdKV_zEi6D0kzKfacrvyaerIUwKzZE-zHG7_j2p5xEGZXPbVVOQ7_a9OVBRN5t4CteIDxHhuohlt3eYKm0u9myU2ABADDduTBBhQsxIPteCagltukhaOvuIpgrbrGQFrVy_UrrlNpKY1MrD7DGhGZbclJSIvkxm-ZEggjkxlkze4CCQ" />
              </div>
              <div className="absolute top-20 right-10 w-48 h-48 rotate-[5deg] z-0 rounded-3xl overflow-hidden border-4 border-white shadow-2xl grayscale opacity-50 hidden md:block transition-all hover:rotate-0 duration-300">
                <img className="w-full h-full object-cover" alt="Collage food item 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtHXuZ2dLwv9weOYXcofUY3z9ohNAm88MGgQjnNrlh3MtRNNrQ5YYS3Km0Bd-zWRzGSpp8MPCZPwjZGyth66gB7LlcbTzQQE2kSp0IjxvfKTP5z1I55ngsapHjX3UAEmaJnA0lYDnOJrtZPKyDivHumj9esJBNV21mgDNhXSNGNZUFFKG0pWgihzV6vW7fn1Lnx99KsoQfWO1RW1Fgdlfu-MC7Ckfm4Ax8Amn_OMQkROkyEs2_Y15iP5RP0IcYaf0UnCU0FfK27A" />
              </div>

              {/* Main Content Banner */}
              <div className="relative z-30 max-w-md bg-white p-10 md:p-12 rounded-[32px] shadow-2xl border-4 border-brand-500">
                <h3 className="font-headline-lg text-2xl md:text-3xl text-brand-500 uppercase mb-6">READY FOR A FLAVOR ADVENTURE?</h3>
                <p className="font-body-lg text-sm text-[#1c1c12] uppercase mb-8 leading-relaxed font-semibold">DIVE INTO BOLD TASTES AND PLAYFUL BITES CRAFTED JUST FOR YOU.</p>
                <button 
                  onClick={() => navigate('/restaurants')}
                  className="bg-brand-500 text-white px-10 py-4 rounded-full font-label-caps text-xs tracking-wider uppercase hover:scale-105 transition-all shadow-lg inline-flex items-center gap-3"
                >
                  DISCOVER NOW <span className="material-symbols-outlined text-sm">trending_flat</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section className="py-32 bg-[#fdfae9] border-t border-[#e6e3d2]/50">
        <div className="max-w-6xl mx-auto px-4 md:px-16 text-center">
          <h2 className="font-headline-lg text-3xl md:text-4xl text-[#1c1c12] uppercase italic mb-24">REAL TALK FROM REAL FOODIES</h2>
          
          {/* Mobile Stacking Testimonials */}
          <div className="flex flex-col gap-6 items-center md:hidden mt-12">
            <div className="bg-[#1c1c12] p-8 rounded-3xl w-full max-w-sm shadow-2xl border-4 border-[#28281d]">
              <div className="flex gap-1 text-brand-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-white font-body-md text-xs uppercase text-left leading-relaxed">"I LOVE HOW ZING KEEPS THINGS SIMPLE BUT SO FLAVORFUL. THE FRIES ARE CRISPY AND THE BURGERS ARE PERFECTION!"</p>
              <p className="text-brand-500 font-label-caps text-[10px] mt-6 text-left tracking-wider">— SARAH J.</p>
            </div>

            <div className="bg-brand-500 p-8 rounded-3xl w-full max-w-sm shadow-2xl border-4 border-brand-600">
              <div className="flex gap-1 text-white mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-white font-body-md text-xs uppercase text-left leading-relaxed">"ORDERING FROM ZING IS ALWAYS EASY AND THE DELIVERY IS FAST! THE TASTE IS UNBEATABLE AND THE VIBE IS GENUINE."</p>
              <p className="text-[#1c1c12] font-label-caps text-[10px] mt-6 text-left tracking-wider">— MARCUS T.</p>
            </div>

            <div className="bg-[#e6e3d2] p-8 rounded-3xl w-full max-w-sm shadow-2xl border-4 border-[#1c1c12]">
              <div className="flex gap-1 text-brand-500 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-[#1c1c12] font-headline-md text-base uppercase italic leading-snug">"ZING ALWAYS HITS THE SPOT EVERY TIME—BOLD FLAVORS, FRESH INGREDIENTS, AND FRIENDLY SERVICE."</p>
              <p className="text-brand-500 font-label-caps text-xs mt-6">— JESSICA R.</p>
            </div>
          </div>

          {/* Desktop Overlapping Layout */}
          <div className="hidden md:flex relative h-[550px] items-center justify-center mt-12">
            
            {/* Overlapping Review Cards */}
            <div className="absolute top-0 transform translate-x-[-15%] md:translate-x-[-25%] translate-y-[5%] rotate-[-6deg] bg-[#1c1c12] p-8 rounded-3xl w-full max-w-xs shadow-2xl z-10 transition-transform hover:rotate-0 hover:z-40 duration-300">
              <div className="flex gap-1 text-brand-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-white font-body-md text-xs uppercase text-left leading-relaxed">"I LOVE HOW ZING KEEPS THINGS SIMPLE BUT SO FLAVORFUL. THE FRIES ARE CRISPY AND THE BURGERS ARE PERFECTION!"</p>
              <p className="text-brand-500 font-label-caps text-[10px] mt-6 text-left tracking-wider">— SARAH J.</p>
            </div>

            <div className="absolute bottom-4 transform translate-x-[15%] md:translate-x-[25%] translate-y-[-5%] rotate-[6deg] bg-brand-500 p-8 rounded-3xl w-full max-w-xs shadow-2xl z-20 transition-transform hover:rotate-0 hover:z-40 duration-300">
              <div className="flex gap-1 text-white mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-white font-body-md text-xs uppercase text-left leading-relaxed">"ORDERING FROM ZING IS ALWAYS EASY AND THE DELIVERY IS FAST! THE TASTE IS UNBEATABLE AND THE VIBE IS GENUINE."</p>
              <p className="text-[#1c1c12] font-label-caps text-[10px] mt-6 text-left tracking-wider">— MARCUS T.</p>
            </div>

            <div className="absolute top-1/2 left-1/2 transform translate-x-[-50%] translate-y-[-50%] bg-[#e6e3d2] p-10 rounded-3xl w-full max-w-sm shadow-2xl z-30 border-4 border-[#1c1c12] transition-transform hover:scale-105 duration-300">
              <div className="flex gap-1 text-brand-500 mb-4 justify-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-[#1c1c12] font-headline-md text-base md:text-lg uppercase italic leading-snug">"ZING ALWAYS HITS THE SPOT EVERY TIME—BOLD FLAVORS, FRESH INGREDIENTS, AND FRIENDLY SERVICE."</p>
              <p className="text-brand-500 font-label-caps text-xs mt-8">— JESSICA R.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Brand Ticker Section ── */}
      <div className="bg-[#1c1c12] py-6 border-y-4 border-brand-500 overflow-hidden select-none">
        <div className="flex whitespace-nowrap w-max animate-ticker">
          <div className="flex items-center gap-12 px-6">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="flex items-center gap-12">
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Burger</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lunch_dining</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Sandwich</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bakery_dining</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Pizza</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Fries</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>fastfood</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Desserts</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>icecream</span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-12 px-6">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="flex items-center gap-12">
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Burger</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lunch_dining</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Sandwich</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bakery_dining</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Pizza</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pizza</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Fries</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>fastfood</span>
                <span className="text-white font-headline-md text-xl uppercase italic tracking-wider">Desserts</span>
                <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>icecream</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Promo/Discount Section ── */}
      <section className="py-20 bg-brand-500 overflow-hidden relative">
        <div className="max-w-6xl mx-auto px-4 md:px-16 grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <div className="relative col-span-1">
            <h2 className="font-display-hero text-4xl sm:text-[50px] md:text-[90px] text-white uppercase leading-none mb-8">25% <br />DISCOUNT</h2>
            <p className="text-white font-headline-md text-2xl uppercase mb-10 tracking-wider">
              DOWNLOAD THE APP AND <span className="block text-[#fdfae9]">ORDER NOW</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-black px-5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-white/10 shadow-md">
                <svg className="h-6 w-6 text-white fill-current shrink-0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.3-60.7-60.7 60.7-60.7 58 33.3c15 8.6 24.8 24.2 24.8 42.2 0 17.9-9.8 33.5-24.8 42.1zM325.3 277.7L424.2 376.5 104.6 499l220.7-221.3z" />
                </svg>
                <div className="flex flex-col text-left font-sans">
                  <span className="text-white/60 text-[8px] font-bold uppercase tracking-wider leading-none mb-0.5">GET IT ON</span>
                  <span className="text-white font-bold text-sm tracking-tight leading-none">Google Play</span>
                </div>
              </div>
              <div className="bg-black px-5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-white/10 shadow-md">
                <svg className="h-6 w-6 text-white fill-current shrink-0" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 47.5-24.4 76.5 26.9 2.4 51.2-16 68.3-38.9z" />
                </svg>
                <div className="flex flex-col text-left font-sans">
                  <span className="text-white/60 text-[8px] font-bold uppercase tracking-wider leading-none mb-0.5">DOWNLOAD ON THE</span>
                  <span className="text-white font-bold text-sm tracking-tight leading-none">App Store</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center col-span-1">
            <div className="w-full max-w-sm aspect-[4/5] bg-white rounded-3xl border-8 border-black shadow-2xl flex flex-col items-center justify-center p-8 text-center rotate-0 md:rotate-3 relative overflow-hidden hover:rotate-0 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl"></div>
              <span className="font-headline-lg text-brand-500 text-5xl mb-4">ZING!</span>
              <div className="w-full h-1 bg-brand-500 mb-6"></div>
              <p className="font-body-lg text-[#1c1c12] text-sm uppercase mb-8 font-semibold tracking-wide">YOUR FAVORITE FOOD IS JUST ONE CLICK AWAY</p>
              <div className="border-2 border-dashed border-brand-500 px-6 py-3 rounded-xl">
                <span className="font-headline-md text-brand-500 text-lg tracking-wider">ZING NOW</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sharp Ticket-Punch Zigzag Divider */}
      <div className="relative h-4 w-full z-30 pointer-events-none overflow-hidden -mt-[1px] bg-[#1c1c12]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="zigzag-bottom" width="24" height="16" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 24 0 L 24 4 L 12 16 L 0 4 Z" fill="#c41e3a" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zigzag-bottom)" />
        </svg>
      </div>

    </div>
  );
}

function FoodCard({ item, onAdd }) {
  const img = imageUrl(item.imageUrl) || PLACEHOLDER_FOOD;
  const restName = item.restaurantData?.name || item.restaurant?.name || 'Local Restaurant';

  return (
    <div className="bg-white rounded-[32px] overflow-hidden group hover:shadow-[0_20px_50px_rgba(196,30,58,0.12)] transition-all duration-500 border-4 border-transparent hover:border-brand-500 flex flex-col">
      <div className="relative h-72 overflow-hidden bg-[#f1eedd]">
        <img 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt={item.name} 
          src={img}
        />
        <div className="absolute top-6 left-6 bg-brand-500 text-white px-5 py-2 rounded-full font-label-caps text-xs tracking-wider uppercase shadow-xl z-10">
          ₹{item.price?.toFixed(0)}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-8 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4 gap-4">
            <h3 className="font-headline-md text-xl text-[#1c1c12] uppercase leading-tight line-clamp-2">{item.name}</h3>
            <button 
              onClick={onAdd}
              className="bg-brand-500 text-white p-3 rounded-2xl hover:scale-110 transition-transform shadow-md shrink-0 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </button>
          </div>
          <p className="text-[#5b4040] font-body-md text-xs uppercase opacity-85 leading-relaxed line-clamp-3 mb-6">
            {item.description || 'A delicious and freshly prepared meal full of authentic flavors.'}
          </p>
        </div>

        <div className="pt-4 border-t border-[#e6e3d2] flex items-center justify-between">
          <Link 
            to={`/restaurants/${item.restaurant?.id || item.restaurantData?.id}`} 
            className="text-xs uppercase font-label-caps text-brand-500 flex items-center gap-1 hover:underline truncate max-w-[200px]"
          >
            <span className="material-symbols-outlined text-xs">restaurant</span>
            {restName}
          </Link>
        </div>
      </div>
    </div>
  );
}
