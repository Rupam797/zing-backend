import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { imageUrl } from '../api/upload';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowRight, Search, SlidersHorizontal, ChevronDown,
  Plus, Star, TrendingUp, Flame,
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

  // Build restaurant lookup
  const restaurantMap = {};
  restaurants.forEach((r) => { restaurantMap[r.id] = r; });

  // Enrich items with restaurant info
  const enrichedItems = allItems.map((item) => ({
    ...item,
    restaurantData: restaurantMap[item.restaurant?.id] || item.restaurant,
  }));

  // Filter
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

  // Sort
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
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-12">

      {/* Hero */}
      <section className="text-center py-8">
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
          What would you like to <span className="text-brand-500">eat</span> today?
        </h1>
        <p className="mt-2 text-sm max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
          Order from the best restaurants around you
        </p>
        {/* Search bar */}
        <div className="mt-5 max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Search for food, restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </section>

      {/* What's on your mind? */}
      <section className="mt-2 mb-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <Flame className="h-4 w-4 text-brand-500" /> What's on your mind?
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
              className={`flex flex-col items-center gap-1.5 min-w-[64px] rounded-xl py-2.5 px-2 border transition-all text-center ${
                selectedCategory === cat.label
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                  : 'hover:border-brand-300'
              }`}
              style={{
                borderColor: selectedCategory === cat.label ? undefined : 'var(--border-color)',
                backgroundColor: selectedCategory === cat.label ? undefined : 'var(--bg-card)',
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[10px] font-medium" style={{ color: selectedCategory === cat.label ? 'var(--color-brand-500)' : 'var(--text-secondary)' }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Filters & Sort */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {selectedCategory ? selectedCategory : 'All Food Items'}
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            {filtered.length}
          </span>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-[10px] text-brand-500 underline">Clear</button>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
          >
            <SlidersHorizontal className="h-3 w-3" /> {SORT_OPTIONS.find((s) => s.key === sortBy)?.label} <ChevronDown className="h-3 w-3" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 z-30 rounded-lg border shadow-lg w-44" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                  className={`block w-full text-left px-3 py-2 text-[11px] transition-colors ${sortBy === opt.key ? 'text-brand-500 font-medium' : ''}`}
                  style={{ color: sortBy === opt.key ? undefined : 'var(--text-secondary)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Food Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No items found</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Try a different search or category</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <FoodCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
          ))}
        </div>
      )}

      {/* Popular Restaurants */}
      {restaurants.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp className="h-4 w-4 text-brand-500" /> Popular Restaurants
            </h2>
            <Link to="/restaurants" className="text-[11px] text-brand-500 flex items-center gap-0.5 font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.slice(0, 4).map((r) => (
              <Link key={r.id} to={`/restaurants/${r.id}`}
                className="rounded-lg border overflow-hidden transition-colors hover:border-brand-400"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="h-24 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-input)' }}>
                  {imageUrl(r.imageUrl) ? (
                    <img src={imageUrl(r.imageUrl)} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl">🏪</span>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.name}</h3>
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
    <div className="rounded-lg border overflow-hidden transition-colors hover:border-brand-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      {/* Image */}
      <div className="h-32 flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: 'var(--bg-input)' }}>
        {img ? (
          <img src={img} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl">🍕</span>
        )}
        {/* Price badge */}
        <span className="absolute top-2 right-2 rounded-md bg-black/70 text-white text-[11px] font-bold px-2 py-0.5">
          ₹{item.price?.toFixed(0)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</h3>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{item.description || 'Delicious food item'}</p>
            <Link to={`/restaurants/${item.restaurant?.id}`} className="text-[10px] text-brand-500 mt-1 inline-block hover:underline">
              {restName}
            </Link>
          </div>
          <button
            onClick={onAdd}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
