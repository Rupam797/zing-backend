import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Search, SlidersHorizontal, ChevronDown,
  Plus, TrendingUp, MapPin, ChevronRight,
  Clock, Flame, Star, Zap,
} from 'lucide-react';

/* ── Real food images — Unsplash CDN, no API key needed ─── */
const CAT_IMGS = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=160&q=80',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&q=80',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=160&q=80',
  chicken: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=160&q=80',
  thali: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=160&q=80',
  dosa: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=160&q=80',
  rolls: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=160&q=80',
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=160&q=80',
  ice: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=160&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=160&q=80',
  momos: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=160&q=80',
};

const FOOD_FALLBACKS = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=480&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=480&q=80',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=480&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=480&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&q=80',
  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=480&q=80',
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=480&q=80',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=480&q=80',
];

const HERO_BG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=85';
const REST_FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=480&q=80';

const CATEGORIES = [
  { key: 'biryani', label: 'Biryani' },
  { key: 'pizza', label: 'Pizza' },
  { key: 'burger', label: 'Burgers' },
  { key: 'noodles', label: 'Noodles' },
  { key: 'chicken', label: 'Chicken' },
  { key: 'thali', label: 'Thali' },
  { key: 'dosa', label: 'Dosa' },
  { key: 'rolls', label: 'Rolls' },
  { key: 'cake', label: 'Cakes' },
  { key: 'ice', label: 'Ice Cream' },
  { key: 'sandwich', label: 'Sandwich' },
  { key: 'momos', label: 'Momos' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'priceLow', label: 'Price: Low to High' },
  { key: 'priceHigh', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A–Z' },
];

function getFallback(id) {
  const i = Math.abs((id?.charCodeAt?.(0) || 0) + (id?.charCodeAt?.(1) || 0)) % FOOD_FALLBACKS.length;
  return FOOD_FALLBACKS[i];
}

function getDelivery(id) {
  return 18 + Math.abs((id?.charCodeAt?.(0) || 5) % 22);
}

function getRating(id) {
  return (3.8 + ((id?.charCodeAt?.(0) || 5) % 12) * 0.1).toFixed(1);
}

export default function HomePage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [allItems, setAllItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);

  /* Close sort dropdown on outside click */
  useEffect(() => {
    const fn = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    Promise.all([api.get('/menus/all'), api.get('/restaurants')])
      .then(([m, r]) => { setAllItems(m.data || []); setRestaurants(r.data || []); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const restMap = {};
  restaurants.forEach((r) => { restMap[r.id] = r; });

  const enriched = allItems.map((i) => ({
    ...i,
    restaurantData: restMap[i.restaurant?.id] || i.restaurant,
  }));

  let filtered = enriched.filter((i) => i.available !== false);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((i) =>
      i.name?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.restaurantData?.name?.toLowerCase().includes(q)
    );
  }

  if (selectedCat) {
    const c = selectedCat.toLowerCase();
    filtered = filtered.filter((i) =>
      i.name?.toLowerCase().includes(c) ||
      i.description?.toLowerCase().includes(c)
    );
  }

  if (sortBy === 'priceLow') filtered.sort((a, b) => a.price - b.price);
  else if (sortBy === 'priceHigh') filtered.sort((a, b) => b.price - a.price);
  else if (sortBy === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const handleAdd = (item) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'USER') { toast.error('Only customers can order'); return; }
    const rest = item.restaurantData || item.restaurant;
    if (!rest) { toast.error('Restaurant info missing'); return; }
    addItem(item, rest);
    toast.success(`${item.name} added!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-orange-500 animate-spin" />
        <p className="text-sm text-gray-400">Loading your feed…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div className="relative mt-20 mb-10 rounded-3xl overflow-hidden min-h-[360px] flex items-end">
        {/* Background photo */}
        <img
          src={HERO_BG}
          alt="Food"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark scrim — left heavy so text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />

        {/* Content */}
        <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14 max-w-xl">
          {/* Pill tag */}
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full mb-5">
            <Zap size={10} fill="currentColor" />
            Free delivery on first order
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Hungry?<br />
            <span className="text-amber-400">Order in minutes.</span>
          </h1>

          <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-sm">
            {restaurants.length > 0 ? `${restaurants.length}+ restaurants` : 'Hundreds of restaurants'} near you.
            Hot food delivered to your door.
          </p>

          {/* Search */}
          <div className="mt-6 flex gap-2 max-w-md">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-4 focus-within:border-orange-500/70 transition-colors">
              <Search size={15} className="text-white/40 shrink-0" />
              <input
                type="text"
                placeholder="Search food or restaurants…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm py-3.5 placeholder-white/30"
              />
            </div>
            <button
              onClick={() => { }}
              className="hidden sm:block bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 rounded-2xl transition-colors shadow-lg shadow-orange-500/30"
            >
              Search
            </button>
          </div>

          {/* Stats */}
          <div className="mt-7 flex gap-8">
            {[
              { n: `${restaurants.length || '50'}+`, l: 'Restaurants' },
              { n: `${allItems.length || '500'}+`, l: 'Dishes' },
              { n: '30 min', l: 'Avg. Delivery' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-black text-white tracking-tight">{s.n}</p>
                <p className="text-[11px] text-white/40 font-medium mt-0.5 tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          CATEGORIES — real photos like Swiggy
      ══════════════════════════════════════ */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-5">
          <Flame size={18} className="text-orange-500" />
          What's on your mind?
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const active = selectedCat === cat.label;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCat(active ? null : cat.label)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200
                  ${active
                    ? 'border-orange-500 shadow-lg shadow-orange-500/25 scale-105'
                    : 'border-transparent hover:border-orange-300 hover:scale-105'
                  }`}
                >
                  <img
                    src={CAT_IMGS[cat.key]}
                    alt={cat.label}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs font-semibold transition-colors ${active ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          TOOLBAR
      ══════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            {selectedCat || 'All Items'}
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-500">
            {filtered.length}
          </span>
          {selectedCat && (
            <button
              onClick={() => setSelectedCat(null)}
              className="text-xs font-semibold text-orange-500 hover:opacity-70 transition-opacity"
            >
              × Clear
            </button>
          )}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-orange-400 transition-colors"
          >
            <SlidersHorizontal size={13} />
            {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            <ChevronDown
              size={13}
              className="transition-transform duration-200"
              style={{ transform: showSort ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {showSort && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl w-48 overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                  className={`block w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                    ${sortBy === opt.key ? 'text-orange-500 font-bold' : 'text-gray-600 dark:text-gray-300 font-medium'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOOD GRID
      ══════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=60"
            alt="Empty"
            className="w-44 h-32 object-cover rounded-2xl mx-auto mb-5 opacity-40"
          />
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">Nothing found</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <FoodCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          POPULAR RESTAURANTS
      ══════════════════════════════════════ */}
      {restaurants.length > 0 && (
        <>
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-12" />
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 tracking-tight">
                <TrendingUp size={18} className="text-orange-500" />
                Popular Restaurants
              </h2>
              <Link
                to="/restaurants"
                className="flex items-center gap-1 text-sm font-semibold text-orange-500 hover:underline underline-offset-2"
              >
                See all <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {restaurants.slice(0, 4).map((r) => (
                <RestCard key={r.id} r={r} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ── Food Card ─────────────────────────────────────────────── */
function FoodCard({ item, onAdd }) {
  const src = imageUrl(item.imageUrl) || getFallback(item.id);
  const restName = item.restaurantData?.name || item.restaurant?.name || 'Restaurant';
  const mins = getDelivery(item.id);

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient over image bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Price on image */}
        <span className="absolute bottom-2.5 left-3 text-white text-base font-black tracking-tight drop-shadow-md">
          ₹{item.price?.toFixed(0)}
        </span>

        {/* Veg indicator */}
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded bg-white border-2 border-green-500 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 block" />
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{item.name}</p>
        <p className="text-xs text-gray-400 mt-1 truncate leading-relaxed">
          {item.description || 'Freshly prepared with care'}
        </p>
        <Link
          to={`/restaurants/${item.restaurant?.id}`}
          className="inline-block text-xs font-semibold text-orange-500 mt-2 hover:opacity-75 transition-opacity"
        >
          {restName}
        </Link>

        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-gray-100 dark:border-gray-700">
          <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Clock size={12} />
            {mins} min
          </span>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/25 hover:shadow-orange-500/40"
          >
            <Plus size={13} strokeWidth={2.5} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Restaurant Card ───────────────────────────────────────── */
function RestCard({ r }) {
  const src = imageUrl(r.imageUrl) || REST_FALLBACK;
  const mins = getDelivery(r.id);
  const rating = getRating(r.id);

  return (
    <Link
      to={`/restaurants/${r.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={src}
          alt={r.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {r.open ? (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full">
            OPEN
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full">
            CLOSED
          </span>
        )}
      </div>

      <div className="p-3.5">
        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{r.name}</p>
        <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5 font-medium">
          <MapPin size={11} />
          {r.city}
        </p>
        <div className="flex items-center justify-between mt-2.5">
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Clock size={11} />
            {mins} min
          </span>
          <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 text-[11px] font-bold px-2 py-0.5 rounded-lg">
            <Star size={10} fill="currentColor" />
            {rating}
          </span>
        </div>
      </div>
    </Link>
  );
}