import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { uploadImage, imageUrl } from '../api/upload';
import toast from 'react-hot-toast';
import {
  Store, Package, PlusCircle, ChevronDown, ChevronUp,
  Check, X, ChefHat, RefreshCw, Camera, Image, MapPin, Loader2,
} from 'lucide-react';
import useGeolocation from '../hooks/useGeolocation';
import useReverseGeocode from '../hooks/useReverseGeocode';

export default function DashboardPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: '', address: '', city: '', open: true });
  const [restaurantImage, setRestaurantImage] = useState(null);
  const [creating, setCreating] = useState(false);
  const [openMenuFormId, setOpenMenuFormId] = useState(null);
  const restaurantFileRef = useRef(null);

  // GPS for auto-locating restaurant
  const geo = useGeolocation({ enabled: showCreateForm, highAccuracy: true });
  const reverseGeo = useReverseGeocode(geo.lat, geo.lng);
  const geoFilledRef = useRef(false);

  // Auto-fill address & city when GPS resolves
  useEffect(() => {
    if (geoFilledRef.current || !reverseGeo.address) return;
    setNewRestaurant((prev) => ({
      ...prev,
      address: prev.address || reverseGeo.address,
      city: prev.city || reverseGeo.city,
    }));
    geoFilledRef.current = true;
  }, [reverseGeo.address, reverseGeo.city]);

  // Reset auto-fill flag when form is reopened
  useEffect(() => {
    if (!showCreateForm) geoFilledRef.current = false;
  }, [showCreateForm]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, oRes] = await Promise.all([api.get('/restaurants/my'), api.get('/orders/restaurant')]);
      setRestaurants(rRes.data); setOrders(oRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      let imgUrl = null;
      if (restaurantImage) {
        imgUrl = await uploadImage(restaurantImage);
      }
      await api.post('/restaurants', {
        ...newRestaurant,
        imageUrl: imgUrl,
        latitude: geo.lat || null,
        longitude: geo.lng || null,
      });
      toast.success('Restaurant created!');
      setNewRestaurant({ name: '', address: '', city: '', open: true });
      setRestaurantImage(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const handleUploadRestaurantImage = async (restaurantId, file) => {
    try {
      const url = await uploadImage(file);
      const r = restaurants.find((r) => r.id === restaurantId);
      await api.post('/restaurants', { ...r, imageUrl: url, owner: undefined });
      toast.success('Image updated!');
      loadData();
    } catch { toast.error('Upload failed'); }
  };



  const updateOrder = async (id, action, successMsg) => {
    try { const res = await api.put(`/orders/restaurant/${id}/${action}`); setOrders(orders.map((o) => (o.id === id ? res.data : o))); toast.success(successMsg); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColor = (s) => ({
    PLACED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ACCEPTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    PREPARING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[s] || 'bg-gray-100 text-gray-600');

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  const inputCls = "w-full rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500";
  const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', caretColor: 'var(--text-primary)' };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-20 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Welcome, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
            <PlusCircle className="h-3 w-3" /> Add Restaurant
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 rounded-lg border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>New Restaurant</h3>
          <form onSubmit={handleCreateRestaurant} className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input placeholder="Name" required value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} className={inputCls} style={inputStyle} />
              <input placeholder="City" required value={newRestaurant.city} onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })} className={inputCls} style={inputStyle} />
              <input placeholder="Address" value={newRestaurant.address} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })} className={`${inputCls} sm:col-span-2`} style={inputStyle} />
            </div>
            {/* Image upload */}
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Restaurant Photo</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" ref={restaurantFileRef} onChange={(e) => setRestaurantImage(e.target.files[0])} className="hidden" />
                <button type="button" onClick={() => restaurantFileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  <Camera className="h-3 w-3" />
                  {restaurantImage ? restaurantImage.name : 'Choose image'}
                </button>
                {restaurantImage && (
                  <img src={URL.createObjectURL(restaurantImage)} alt="Preview" className="h-10 w-10 rounded-md object-cover" />
                )}
              </div>
            </div>
            {/* GPS location indicator */}
            <div className="rounded-md border p-2.5 flex items-center gap-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <MapPin className="h-4 w-4 shrink-0" style={{ color: geo.lat ? '#22c55e' : 'var(--text-faint)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  {reverseGeo.address
                    ? `📍 ${reverseGeo.address}${reverseGeo.city ? `, ${reverseGeo.city}` : ''}`
                    : geo.lat
                      ? (reverseGeo.loading ? '📍 Detecting address…' : '📍 Location detected')
                      : geo.loading
                        ? 'Detecting your location…'
                        : 'Location unavailable'}
                </p>
                {geo.lat && (
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} • Accuracy: {geo.accuracy ? `${Math.round(geo.accuracy)}m` : '—'}
                    {reverseGeo.address && ' • Address auto-filled ✓'}
                  </p>
                )}
                {geo.error && (
                  <p className="text-[10px] text-amber-500">
                    {geo.error.includes('denied') ? 'Enable location to auto-fill address' : 'GPS unavailable — enter address manually'}
                  </p>
                )}
              </div>
              {(geo.loading || reverseGeo.loading) && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--text-faint)' }} />}
              {geo.lat && !reverseGeo.loading && <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-md border px-3 py-1.5 text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>Cancel</button>
              <button type="submit" disabled={creating} className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">{creating ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Stat icon={<Store className="h-4 w-4" />} label="Restaurants" value={restaurants.length} />
        <Stat icon={<Package className="h-4 w-4" />} label="Orders" value={orders.length} />
        <Stat icon={<span className="text-sm">₹</span>} label="Revenue" value={`₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toFixed(0)}`} />
      </div>

      {/* Restaurants */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: 'var(--text-primary)' }}><Store className="h-3.5 w-3.5 text-brand-500" /> My Restaurants</h2>
        {restaurants.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No restaurants yet</p> : (
          <div className="space-y-2">
            {restaurants.map((r) => (
              <div key={r.id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  {/* Restaurant image */}
                  <div className="relative group">
                    <div className="h-14 w-14 shrink-0 rounded-md overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--bg-input)' }}>
                      {imageUrl(r.imageUrl) ? <img src={imageUrl(r.imageUrl)} alt={r.name} className="h-full w-full object-cover" /> : <span className="text-xl">🍽️</span>}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md">
                      <Camera className="h-4 w-4 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUploadRestaurantImage(r.id, e.target.files[0])} />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</h3>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.address || r.city}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${r.open ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{r.open ? 'Open' : 'Closed'}</span>
                        <button onClick={() => setOpenMenuFormId(openMenuFormId === r.id ? null : r.id)}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                          <PlusCircle className="h-3 w-3" /> Add Item {openMenuFormId === r.id ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {openMenuFormId === r.id && (
                  <AddMenuItemForm
                    restaurantId={r.id}
                    onDone={() => setOpenMenuFormId(null)}
                    inputCls={inputCls}
                    inputStyle={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section>
        <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: 'var(--text-primary)' }}><Package className="h-3.5 w-3.5 text-brand-500" /> Orders</h2>
        {orders.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No orders yet</p> : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>#{o.id}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColor(o.status)}`}>{o.status?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{o.restaurant?.name} • {o.createdAt?.split('T')[0]}</p>
                    <p className="text-xs font-semibold text-brand-500 mt-0.5">₹{o.totalAmount?.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {o.status === 'PLACED' && (
                      <>
                        <button onClick={() => updateOrder(o.id, 'accept', 'Accepted ✅')}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">
                          <Check className="h-3 w-3" /> Accept
                        </button>
                        <button onClick={() => { if (confirm('Reject this order?')) updateOrder(o.id, 'reject', 'Rejected'); }}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors">
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button onClick={() => updateOrder(o.id, 'prepare', 'Preparing 🍳')}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition-colors">
                        <ChefHat className="h-3 w-3" /> Prepare
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{icon}</div>
      <div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function AddMenuItemForm({ restaurantId, onDone, inputCls, inputStyle }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !price) { toast.error('Name and price required'); return; }
    setSaving(true);
    try {
      let imgUrl = null;
      if (image) {
        imgUrl = await uploadImage(image);
      }
      await api.post(`/menus/${restaurantId}`, {
        name, description, price: Number(price), available: true, imageUrl: imgUrl,
      });
      toast.success('Item added!');
      onDone();
    } catch {
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border p-3 space-y-2 relative z-10" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px] gap-2">
        <input
          placeholder="Item name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          style={inputStyle}
          autoFocus
        />
        <input
          placeholder="Description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          style={inputStyle}
        />
        <input
          placeholder="Price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          style={inputStyle}
        />
      </div>
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" id={`menu-img-${restaurantId}`} className="hidden"
          onChange={(e) => setImage(e.target.files[0])} />
        <label htmlFor={`menu-img-${restaurantId}`}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] cursor-pointer"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          <Image className="h-3 w-3" />
          {image ? image.name : 'Food photo'}
        </label>
        {image && <img src={URL.createObjectURL(image)} alt="Preview" className="h-8 w-8 rounded object-cover" />}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="ml-auto rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}
