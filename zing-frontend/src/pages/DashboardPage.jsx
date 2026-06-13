import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { uploadImage, imageUrl } from '../api/upload';
import toast from 'react-hot-toast';
import {
  Store, Package, PlusCircle, ChevronDown, ChevronUp,
  Check, X, ChefHat, RefreshCw, Camera, Image, MapPin, Loader2, Utensils,
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
    PLACED: 'bg-blue-100 text-blue-800 border-2 border-blue-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200',
    PREPARING: 'bg-amber-100 text-amber-800 border-2 border-amber-200',
    OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 border-2 border-purple-200',
    DELIVERED: 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200',
    CANCELLED: 'bg-red-100 text-red-800 border-2 border-red-200',
  }[s] || 'bg-[#e6e3d2] text-[#1c1c12] border-2 border-[#e6e3d2]');

  if (loading) return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
    </div>
  );

  const inputCls = "w-full rounded-2xl border-4 border-[#e6e3d2] focus:border-brand-500 bg-white px-4 py-3 text-xs outline-none transition-all text-[#1c1c12]";

  return (
    <div className="w-full min-h-screen bg-[#fdfae9] text-[#1c1c12] pt-24 pb-20 px-4 md:px-16 page-enter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#e6e3d2] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-brand-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              <h1 className="font-headline-lg text-3xl text-[#1c1c12] uppercase italic">Dashboard</h1>
            </div>
            <p className="text-sm font-body-lg text-[#5b4040] uppercase tracking-wide">Welcome, {user?.name || 'Partner'}</p>
          </div>
          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            <button onClick={loadData} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full border-4 border-[#e6e3d2] px-5 py-2.5 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] bg-white shadow-md hover:bg-[#f7f4e3] transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-full bg-brand-500 text-white px-5 py-3 text-xs font-label-caps uppercase tracking-wider hover:brightness-110 shadow-lg transition-transform hover:scale-105 whitespace-nowrap">
              <PlusCircle className="h-3.5 w-3.5" /> Add Spot
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-8 border-4 border-[#e6e3d2] rounded-[32px] p-8 bg-white shadow-xl">
            <h3 className="font-headline-lg text-lg uppercase mb-4 text-[#1c1c12]">New Restaurant Spot</h3>
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Restaurant Name</label>
                  <input placeholder="Name" required value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">City</label>
                  <input placeholder="City" required value={newRestaurant.city} onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Full Address</label>
                  <input placeholder="Address" value={newRestaurant.address} onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Upload Cover Image</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" ref={restaurantFileRef} onChange={(e) => setRestaurantImage(e.target.files[0])} className="hidden" />
                  <button type="button" onClick={() => restaurantFileRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border-4 border-[#e6e3d2] px-4 py-2 text-xs font-label-caps uppercase tracking-wider bg-white hover:bg-[#f7f4e3] shadow-sm text-[#1c1c12] transition-colors">
                    <Camera className="h-4 w-4" />
                    {restaurantImage ? 'Replace Photo' : 'Choose image'}
                  </button>
                  {restaurantImage && (
                    <img src={URL.createObjectURL(restaurantImage)} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-[#e6e3d2]" />
                  )}
                </div>
              </div>

              {/* GPS location indicator */}
              <div className="rounded-2xl border-4 border-[#e6e3d2] p-4 flex items-center gap-3 bg-[#f7f4e3]/50">
                <MapPin className="h-5 w-5 shrink-0 text-brand-500 animate-bounce" />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-label-caps uppercase tracking-wider text-[#1c1c12]">
                    {reverseGeo.address
                      ? `${reverseGeo.address}${reverseGeo.city ? `, ${reverseGeo.city}` : ''}`
                      : geo.lat
                        ? (reverseGeo.loading ? 'Detecting address…' : 'Location coordinates detected')
                        : geo.loading
                          ? 'Locating coordinates via GPS…'
                          : 'Location unavailable'}
                  </p>
                  {geo.lat && (
                    <p className="text-[10px] font-mono text-[#5b4040] mt-1">
                      {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} • Accuracy: {geo.accuracy ? `${Math.round(geo.accuracy)}m` : '—'}
                      {reverseGeo.address && ' • Auto-filled'}
                    </p>
                  )}
                </div>
                {(geo.loading || reverseGeo.loading) && <Loader2 className="h-4 w-4 animate-spin text-brand-500" />}
                {geo.lat && !reverseGeo.loading && <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="rounded-full border-4 border-[#e6e3d2] px-6 py-2.5 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] bg-white transition-all shadow-md">Cancel</button>
                <button type="submit" disabled={creating} className="rounded-full bg-brand-500 text-white px-8 py-3.5 text-xs font-label-caps uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-lg">{creating ? 'Creating…' : 'Create Restaurant'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3 mb-10">
          <Stat icon={<Store className="h-5 w-5" />} label="Total Spots" value={restaurants.length} />
          <Stat icon={<Package className="h-5 w-5" />} label="Total Orders" value={orders.length} />
          <Stat icon={<span className="font-bold text-base">₹</span>} label="Earnings Revenue" value={`₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toFixed(0)}`} />
        </div>

        {/* Restaurants */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>store</span>
            <h2 className="font-headline-lg text-2xl text-[#1c1c12] uppercase italic">My Restaurants</h2>
          </div>
          {restaurants.length === 0 ? (
            <div className="text-center py-12 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2]">
              <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">You have not registered any restaurants yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurants.map((r) => (
                <div key={r.id} className="rounded-[32px] border-4 border-[#e6e3d2] p-6 bg-white shadow-md">
                  <div className="flex items-center flex-wrap gap-4">
                    {/* Restaurant image */}
                    <div className="relative group shrink-0">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[#e6e3d2] bg-[#f1eedd]">
                        {imageUrl(r.imageUrl) ? <img src={imageUrl(r.imageUrl)} alt={r.name} className="h-full w-full object-cover" /> : <Utensils className="h-6 w-6 text-[#5b4040]" />}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                        <Camera className="h-4.5 w-4.5 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUploadRestaurantImage(r.id, e.target.files[0])} />
                      </label>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-headline-md text-base text-[#1c1c12] uppercase">{r.name}</h3>
                          <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040] mt-1">{r.address || r.city}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-[10px] font-label-caps uppercase tracking-wider px-3 py-1.5 rounded-lg border-2 ${
                            r.open ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
                          }`}>{r.open ? 'Open' : 'Closed'}</span>
                          <button onClick={() => setOpenMenuFormId(openMenuFormId === r.id ? null : r.id)}
                            className="flex items-center gap-1.5 rounded-xl border-4 border-[#e6e3d2] px-4 py-2 text-xs font-label-caps uppercase tracking-wider text-[#1c1c12] hover:bg-[#f7f4e3] bg-white transition-colors shadow-sm">
                            <PlusCircle className="h-4 w-4" /> Menu {openMenuFormId === r.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
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
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Orders */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-brand-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
            <h2 className="font-headline-lg text-2xl text-[#1c1c12] uppercase italic">Orders Queue</h2>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-[#f7f4e3] rounded-[32px] border-4 border-dashed border-[#e6e3d2]">
              <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">No orders in queue yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.sort((a,b)=>b.id-a.id).map((o) => (
                <div key={o.id} className="rounded-[32px] border-4 border-[#e6e3d2] p-6 bg-white shadow-md">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-headline-md text-base text-[#1c1c12]">Order #{o.id}</span>
                        <span className={`text-[10px] font-label-caps uppercase tracking-wider px-3 py-1 rounded-lg shadow-sm ${statusColor(o.status)}`}>{o.status?.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">{o.restaurant?.name} • {o.createdAt?.split('T')[0]}</p>
                      <p className="text-sm font-headline-md text-brand-500 mt-2">₹{o.totalAmount?.toFixed(0)}</p>
                    </div>
                    <div className="flex gap-3">
                      {o.status === 'PLACED' && (
                        <>
                          <button onClick={() => updateOrder(o.id, 'accept', 'Accepted ✅')}
                            className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-label-caps uppercase tracking-wider bg-emerald-500 hover:brightness-110 text-white shadow-md transition-all">
                            <Check className="h-4 w-4" /> Accept
                          </button>
                          <button onClick={() => { if (confirm('Reject this order?')) updateOrder(o.id, 'reject', 'Rejected'); }}
                            className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-label-caps uppercase tracking-wider bg-red-500 hover:brightness-110 text-white shadow-md transition-all">
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </>
                      )}
                      {o.status === 'ACCEPTED' && (
                        <button onClick={() => updateOrder(o.id, 'prepare', 'Preparing 🍳')}
                          className="flex items-center gap-1.5 rounded-full px-6 py-3 text-xs font-label-caps uppercase tracking-wider bg-brand-500 hover:brightness-110 text-white shadow-md transition-all">
                          <ChefHat className="h-4 w-4" /> Start Cooking
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
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] border-4 border-[#e6e3d2] p-5 bg-white shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 border-2 border-brand-500/20">{icon}</div>
      <div>
        <p className="text-xs font-label-caps uppercase tracking-wider text-[#5b4040]">{label}</p>
        <p className="text-xl font-headline-md text-[#1c1c12] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function AddMenuItemForm({ restaurantId, onDone, inputCls }) {
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
    <div className="mt-6 rounded-[24px] border-4 border-[#e6e3d2] p-6 bg-[#f7f4e3]/30 space-y-4">
      <h4 className="font-headline-md text-sm uppercase text-[#1c1c12]">Add Menu Item</h4>
      <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_2fr_1fr] gap-4">
        <div>
          <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Item Name</label>
          <input
            placeholder="Item name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Description</label>
          <input
            placeholder="Short description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-[10px] font-label-caps uppercase tracking-wider text-[#5b4040] mb-2">Price (₹)</label>
          <input
            placeholder="Price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap pt-2">
        <input type="file" accept="image/*" id={`menu-img-${restaurantId}`} className="hidden"
          onChange={(e) => setImage(e.target.files[0])} />
        <label htmlFor={`menu-img-${restaurantId}`}
          className="flex items-center gap-2 rounded-xl border-4 border-[#e6e3d2] px-4 py-2 text-xs font-label-caps uppercase tracking-wider bg-white cursor-pointer hover:bg-[#f7f4e3] shadow-sm text-[#1c1c12] transition-colors">
          <Image className="h-4 w-4" />
          {image ? 'Change Photo' : 'Upload Food Photo'}
        </label>
        {image && <img src={URL.createObjectURL(image)} alt="Preview" className="h-10 w-10 rounded-xl object-cover border-2 border-[#e6e3d2]" />}
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="ml-auto rounded-full bg-brand-500 text-white px-8 py-3.5 text-xs font-label-caps uppercase tracking-wider hover:brightness-110 disabled:opacity-50 shadow-lg"
        >
          {saving ? 'Adding…' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}
