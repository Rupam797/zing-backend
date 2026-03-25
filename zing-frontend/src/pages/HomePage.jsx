import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowRight, Search, SlidersHorizontal, ChevronDown,
  Plus, Star, TrendingUp, Flame, Zap,
} from 'lucide-react';

const CATEGORIES = [
  { key: 'biryani',  emoji: '🍛', label: 'Biryani' },
  { key: 'pizza',    emoji: '🍕', label: 'Pizza' },
  { key: 'burger',   emoji: '🍔', label: 'Burgers' },
  { key: 'noodles',  emoji: '🍜', label: 'Noodles' },
  { key: 'chicken',  emoji: '🍗', label: 'Chicken' },
  { key: 'thali',    emoji: '🍱', label: 'Thali' },
  { key: 'dosa',     emoji: '🥞', label: 'Dosa' },
  { key: 'rolls',    emoji: '🌯', label: 'Rolls' },
  { key: 'cake',     emoji: '🍰', label: 'Cakes' },
  { key: 'ice',      emoji: '🍦', label: 'Ice Cream' },
  { key: 'sandwich', emoji: '🥪', label: 'Sandwich' },
  { key: 'momos',    emoji: '🥟', label: 'Momos' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'priceLow',  label: 'Price: Low to High' },
  { key: 'priceHigh', label: 'Price: High to Low' },
  { key: 'name',      label: 'Name A-Z' },
];

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">

      {/* ── Hero Banner ────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl mt-20 mb-8 px-8 py-12 sm:py-16"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 45%, #fbbf24 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm mb-4">
            <Zap className="h-3 w-3" fill="white" /> Fast delivery in 30 mins
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Craving something<br />
            <span className="text-yellow-300">delicious?</span>
          </h1>
          <p className="mt-3 text-sm text-white/80 max-w-sm">
            Order from {restaurants.length > 0 ? `${restaurants.length}+` : 'your favourite'} restaurants and get it delivered hot to your door.
          </p>

          {/* Search bar */}
          <div className="mt-6 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for food, restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-white pl-11 pr-4 py-3.5 text-sm shadow-xl outline-none focus:ring-2 focus:ring-yellow-300 text-gray-800 font-medium placeholder-gray-400"
            />
          </div>
        </div>

        {/* Floating emoji decoration */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-end gap-3 select-none pointer-events-none">
          {['🍕', '🍔', '🍛', '🌯'].map((e, i) => (
            <span key={i} className="text-4xl opacity-80"
              style={{ transform: `rotate(${-15 + i * 10}deg)`, animationDelay: `${i * 0.1}s` }}>
              {e}
            </span>
          ))}
        </div>
      </section>

      {/* ── What's on your mind? ─────────────────────── */}
      <section className="mb-6">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <Flame className="h-4 w-4 text-brand-500" /> What's on your mind?
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
              className={`flex flex-col items-center gap-1.5 min-w-[68px] rounded-2xl py-3 px-2 border-2 transition-all text-center ${
                selectedCategory === cat.label
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-105 shadow-sm'
                  : 'hover:border-brand-300 dark:hover:border-brand-600'
              }`}
              style={{
                borderColor: selectedCategory === cat.label ? undefined : 'var(--border-color)',
                backgroundColor: selectedCategory === cat.label ? undefined : 'var(--bg-card)',
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[10px] font-semibold"
                style={{ color: selectedCategory === cat.label ? '#f97316' : 'var(--text-secondary)' }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Filters & Sort ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {selectedCategory ? selectedCategory : 'All Food Items'}
          </h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {filtered.length}
          </span>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-[10px] text-brand-500 hover:underline">
              Clear
            </button>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-colors hover:border-brand-300"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
          >
            <SlidersHorizontal className="h-3 w-3" />
            {SORT_OPTIONS.find((s) => s.key === sortBy)?.label}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 z-30 rounded-xl border shadow-xl w-44 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-[11px] transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${sortBy === opt.key ? 'text-brand-500 font-semibold' : ''}`}
                  style={{ color: sortBy === opt.key ? undefined : 'var(--text-secondary)' }}
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
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No items found</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try a different search or category</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <FoodCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
          ))}
        </div>
      )}

      {/* ── Popular Restaurants ─────────────────────── */}
      {restaurants.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp className="h-4 w-4 text-brand-500" /> Popular Restaurants
            </h2>
            <Link to="/restaurants" className="text-xs text-brand-500 flex items-center gap-0.5 font-semibold hover:underline underline-offset-2">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.slice(0, 4).map((r) => (
              <Link key={r.id} to={`/restaurants/${r.id}`}
                className="group rounded-2xl border overflow-hidden transition-all hover:border-brand-400 hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="h-28 flex items-center justify-center overflow-hidden relative"
                  style={{ backgroundColor: 'var(--bg-input)' }}>
                  {imageUrl(r.imageUrl) ? (
                    <img src={imageUrl(r.imageUrl)} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-4xl">🏪</span>
                  )}
                  {r.open && (
                    <span className="absolute top-2 left-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
                      OPEN
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.city}</p>
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
  const img = imageUrl(item.imageUrl);
  const restName = item.restaurantData?.name || item.restaurant?.name || 'Restaurant';

  return (
    <div className="group rounded-2xl border overflow-hidden transition-all hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      {/* Image */}
      <div className="h-36 flex items-center justify-center overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-input)' }}>
        {img ? (
          <img src={img} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-5xl select-none">🍕</span>
        )}
        <span className="absolute top-2 right-2 rounded-xl bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 backdrop-blur-sm">
          ₹{item.price?.toFixed(0)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {item.description || 'Delicious food item'}
            </p>
            <Link to={`/restaurants/${item.restaurant?.id}`}
              className="text-[10px] text-brand-500 mt-1 inline-block hover:underline underline-offset-1 font-medium">
              {restName}
            </Link>
          </div>
          <button
            onClick={onAdd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-all hover:scale-110 active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
