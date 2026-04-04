import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowRight, Search, SlidersHorizontal, ChevronDown,
  Plus, TrendingUp, Zap, MapPin, SearchX, Flame
} from 'lucide-react';

const CATEGORIES = [
  { key: 'biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80', label: 'Biryani' },
  { key: 'pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80', label: 'Pizza' },
  { key: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80', label: 'Burgers' },
  { key: 'noodles', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80', label: 'Noodles' },
  { key: 'chicken', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&q=80', label: 'Chicken' },
  { key: 'thali', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80', label: 'Thali' },
  { key: 'dosa', image: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=200&q=80', label: 'Dosa' },
  { key: 'rolls', image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&q=80', label: 'Rolls' },
  { key: 'cake', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80', label: 'Cakes' },
  { key: 'ice', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80', label: 'Ice Cream' },
  { key: 'sandwich', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&q=80', label: 'Sandwich' },
  { key: 'momos', image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=200&q=80', label: 'Momos' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'priceLow', label: 'Price: Low to High' },
  { key: 'priceHigh', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A-Z' },
];

const BANNER_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
const PLACEHOLDER_FOOD = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
const PLACEHOLDER_RESTAURANT = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80";

export default function HomePage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [allItems, setAllItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/menus/all'), api.get('/restaurants')])
      .then(([mRes, rRes]) => {
        setAllItems(mRes.data || []);
        setRestaurants(rRes.data || []);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const restaurantMap = {};
  restaurants.forEach((r) => { restaurantMap[r.id] = r; });

  const enrichedItems = allItems.map((item) => ({
    ...item,
    restaurantData: restaurantMap[item.restaurant?.id] || item.restaurant,
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

  const handleAdd = (item) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'USER') { toast.error('Only customers can order'); return; }
    const rest = item.restaurantData || item.restaurant;
    if (!rest) { toast.error('Restaurant info missing'); return; }
    addItem(item, rest);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent shadow-sm" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">

      {/* ── Hero Banner ────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl mt-20 mb-8 shadow-lg">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={BANNER_IMAGE} 
          alt="Banner food" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 px-6 py-12 sm:py-16 max-w-lg flex flex-col justify-center h-full">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-md mb-4 w-fit border border-white/30">
            <Zap className="h-3 w-3 text-yellow-400" fill="currentColor" /> Express delivery in 30 mins
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Delicious moments,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              delivered directly.
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-200 max-w-sm drop-shadow-md">
            Order from {restaurants.length > 0 ? `${restaurants.length}+` : 'top-rated'} local restaurants and get your cravings satisfied right at your door.
          </p>

          {/* Search bar */}
          <div className="mt-6 w-full max-w-md relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <Search className="h-4 w-4 text-gray-500 group-focus-within:text-brand-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search for your favorite dishes or restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 rounded-xl border-0 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white shadow-lg focus:ring-2 focus:ring-inset focus:ring-brand-500 text-sm backdrop-blur-sm transition-all outline-none"
            />
          </div>
        </div>
      </section>

      {/* ── What's on your mind? ─────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
             <Flame className="h-4 w-4 text-brand-500" /> What's on your mind?
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
              className={`snap-start flex flex-col items-center gap-2 min-w-[64px] sm:min-w-[72px] group transition-all duration-200`}
            >
              <div 
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-sm transition-all duration-200 ${
                  selectedCategory === cat.label 
                    ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-950 scale-105' 
                    : 'group-hover:shadow-md group-hover:scale-105 ring-1 ring-gray-200 dark:ring-gray-800'
                }`}
              >
                <img 
                  src={cat.image} 
                  alt={cat.label} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${
                selectedCategory === cat.label ? 'text-brand-500' : 'text-gray-700 dark:text-gray-300 group-hover:text-brand-500'
              }`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Filters & Sort ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {selectedCategory ? `${selectedCategory} near you` : 'Top Dishes Near You'}
          </h2>
          <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
            {filtered.length}
          </span>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-[10px] font-medium text-brand-600 hover:text-brand-500 underline underline-offset-2">
              Clear
            </button>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-brand-500" />
            Sort by: <span className="font-semibold">{SORT_OPTIONS.find((s) => s.key === sortBy)?.label}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-0.5 text-gray-500" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 z-30 rounded-xl border shadow-xl w-44 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                  className={`block w-full text-left px-3 py-2 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${sortBy === opt.key ? 'text-brand-500 font-bold bg-brand-50/50 dark:bg-brand-500/10' : ''}`}
                  style={{ color: sortBy === opt.key ? undefined : 'var(--text-primary)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Food Grid ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <SearchX className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">No items found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">We couldn't find anything matching your search. Try adjusting filters.</p>
          {(search || selectedCategory) && (
            <button 
              onClick={() => { setSearch(''); setSelectedCategory(null); }}
              className="mt-3 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-md hover:bg-brand-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <FoodCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
          ))}
        </div>
      )}

      {/* ── Popular Restaurants ─────────────────────── */}
      {restaurants.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp className="h-4 w-4 text-brand-500" /> Top Rated Restaurants
            </h2>
            <Link to="/restaurants" className="text-[11px] text-brand-600 dark:text-brand-400 flex items-center gap-1 font-semibold hover:text-brand-500 transition-colors group">
              See all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.slice(0, 4).map((r) => (
              <Link key={r.id} to={`/restaurants/${r.id}`}
                className="group flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900 border"
                style={{ borderColor: 'var(--border-color)' }}>
                <div className="h-28 w-full overflow-hidden relative">
                  <img 
                    src={imageUrl(r.imageUrl) || PLACEHOLDER_RESTAURANT} 
                    alt={r.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {r.open && (
                    <span className="absolute top-2 left-2 rounded bg-emerald-500 shadow-sm px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      Open Now
                    </span>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-xs font-bold truncate text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">{r.name}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0" /> {r.city || 'Local Area'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FoodCard({ item, onAdd }) {
  const img = imageUrl(item.imageUrl) || PLACEHOLDER_FOOD;
  const restName = item.restaurantData?.name || item.restaurant?.name || 'Local Restaurant';

  return (
    <div className="group flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ring-1 ring-gray-200 dark:ring-gray-800 border"
      style={{ borderColor: 'var(--border-color)' }}>
      {/* Image */}
      <div className="h-36 w-full overflow-hidden relative bg-gray-100 dark:bg-gray-800">
        <img 
          src={img} 
          alt={item.name} 
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"/>
        <div className="absolute bottom-2 left-2 rounded-md bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white text-xs font-bold px-2 py-1 shadow-sm backdrop-blur-sm border border-gray-100 dark:border-gray-800">
          ₹{item.price?.toFixed(0)}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start gap-1.5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">{item.name}</h3>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 min-h-[28px]">
            {item.description || 'A delicious and freshly prepared meal full of authentic flavors.'}
          </p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <Link to={`/restaurants/${item.restaurant?.id}`}
            className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-brand-500 dark:hover:text-brand-400 transition-colors truncate max-w-[120px]">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{restName}</span>
          </Link>
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-1 rounded bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-1.5 text-[10px] font-bold hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 dark:hover:text-white transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

