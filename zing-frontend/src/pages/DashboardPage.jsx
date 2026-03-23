import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Store, Package, PlusCircle, ChevronDown, ChevronUp,
  Check, X, ChefHat, RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create restaurant form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: '', address: '', city: '', open: true });
  const [creating, setCreating] = useState(false);

  // Add menu item
  const [menuForms, setMenuForms] = useState({});
  const [openMenuFormId, setOpenMenuFormId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, oRes] = await Promise.all([
        api.get('/restaurants/my'),
        api.get('/orders/restaurant'),
      ]);
      setRestaurants(rRes.data);
      setOrders(oRes.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/restaurants', newRestaurant);
      toast.success('Restaurant created!');
      setNewRestaurant({ name: '', address: '', city: '', open: true });
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create restaurant');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMenuItem = async (restaurantId) => {
    const form = menuForms[restaurantId];
    if (!form?.name || !form?.price) {
      toast.error('Name and price are required');
      return;
    }
    try {
      await api.post(`/menus/${restaurantId}`, {
        name: form.name,
        description: form.description || '',
        price: Number(form.price),
        available: true,
      });
      toast.success('Menu item added!');
      setMenuForms({ ...menuForms, [restaurantId]: { name: '', description: '', price: '' } });
      setOpenMenuFormId(null);
    } catch (err) {
      toast.error('Failed to add item');
    }
  };

  // ✅ Accept order
  const handleAcceptOrder = async (orderId) => {
    try {
      const res = await api.put(`/orders/restaurant/${orderId}/accept`);
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      toast.success('Order accepted! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order');
    }
  };

  // ❌ Reject order
  const handleRejectOrder = async (orderId) => {
    if (!confirm('Reject this order? The customer will be notified.')) return;
    try {
      const res = await api.put(`/orders/restaurant/${orderId}/reject`);
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      toast.success('Order rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    }
  };

  // 🍳 Mark as preparing
  const handlePrepareOrder = async (orderId) => {
    try {
      const res = await api.put(`/orders/restaurant/${orderId}/prepare`);
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      toast.success('Order marked as preparing 🍳');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    }
  };

  const getStatusColor = (status) => {
    const map = {
      PLACED: 'bg-blue-500/20 text-blue-400',
      ACCEPTED: 'bg-emerald-500/20 text-emerald-400',
      PREPARING: 'bg-amber-500/20 text-amber-400',
      OUT_FOR_DELIVERY: 'bg-purple-500/20 text-purple-400',
      DELIVERED: 'bg-emerald-500/20 text-emerald-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    };
    return map[status] || 'bg-surface-700 text-surface-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Owner <span className="text-brand-500">Dashboard</span>
          </h1>
          <p className="mt-1 text-surface-400">Welcome, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-surface-700 px-4 py-3 text-sm font-medium text-surface-300 transition hover:bg-surface-800/60 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
          >
            <PlusCircle className="h-4 w-4" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Create Restaurant Form */}
      {showCreateForm && (
        <div className="mb-10 rounded-2xl border border-brand-500/30 bg-surface-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold">New Restaurant</h3>
          <form onSubmit={handleCreateRestaurant} className="grid gap-4 sm:grid-cols-2">
            <input
              placeholder="Restaurant Name"
              required
              value={newRestaurant.name}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
              className="rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500"
            />
            <input
              placeholder="City"
              required
              value={newRestaurant.city}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
              className="rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500"
            />
            <input
              placeholder="Address"
              value={newRestaurant.address}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
              className="rounded-xl border border-surface-700 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500 sm:col-span-2"
            />
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-xl border border-surface-700 px-5 py-2.5 text-sm text-surface-300 hover:bg-surface-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Store className="h-5 w-5" />} label="Restaurants" value={restaurants.length} />
        <StatCard icon={<Package className="h-5 w-5" />} label="Total Orders" value={orders.length} />
        <StatCard
          icon={<span className="text-lg">₹</span>}
          label="Revenue"
          value={`₹${orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toFixed(0)}`}
        />
      </div>

      {/* My Restaurants */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
          <Store className="h-5 w-5 text-brand-400" /> My Restaurants
        </h2>
        {restaurants.length === 0 ? (
          <div className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-16 text-center">
            <p className="text-surface-400">No restaurants yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{r.name}</h3>
                    <p className="text-sm text-surface-400">{r.address || r.city}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        r.open
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {r.open ? 'Open' : 'Closed'}
                    </span>
                    <button
                      onClick={() =>
                        setOpenMenuFormId(openMenuFormId === r.id ? null : r.id)
                      }
                      className="flex items-center gap-1 rounded-lg border border-surface-700 px-3 py-1.5 text-xs text-surface-300 hover:bg-surface-800"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Add Item
                      {openMenuFormId === r.id ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Add menu item inline form */}
                {openMenuFormId === r.id && (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-surface-700 bg-surface-800/40 p-4 sm:flex-row sm:items-end">
                    <input
                      placeholder="Item name"
                      value={menuForms[r.id]?.name || ''}
                      onChange={(e) =>
                        setMenuForms({ ...menuForms, [r.id]: { ...menuForms[r.id], name: e.target.value } })
                      }
                      className="flex-1 rounded-lg border border-surface-700 bg-surface-900/60 px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500"
                    />
                    <input
                      placeholder="Description"
                      value={menuForms[r.id]?.description || ''}
                      onChange={(e) =>
                        setMenuForms({ ...menuForms, [r.id]: { ...menuForms[r.id], description: e.target.value } })
                      }
                      className="flex-1 rounded-lg border border-surface-700 bg-surface-900/60 px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500"
                    />
                    <input
                      placeholder="Price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={menuForms[r.id]?.price || ''}
                      onChange={(e) =>
                        setMenuForms({ ...menuForms, [r.id]: { ...menuForms[r.id], price: e.target.value } })
                      }
                      className="w-28 rounded-lg border border-surface-700 bg-surface-900/60 px-3 py-2 text-sm text-white placeholder-surface-500 outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={() => handleAddMenuItem(r.id)}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Orders */}
      <section>
        <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-400" /> Recent Orders
        </h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-16 text-center">
            <p className="text-surface-400">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5 transition hover:border-surface-700"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  {/* Order info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">Order #{o.id}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(o.status)}`}>
                        {o.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-surface-400">
                      {o.restaurant?.name || '—'} • {o.createdAt?.split('T')[0] || '—'}
                    </p>
                    <p className="text-base font-bold text-brand-400">₹{o.totalAmount?.toFixed(2)}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {o.status === 'PLACED' && (
                      <>
                        <button
                          onClick={() => handleAcceptOrder(o.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/25"
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectOrder(o.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/25"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handlePrepareOrder(o.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-400 ring-1 ring-amber-500/30 transition hover:bg-amber-500 hover:text-white hover:shadow-lg hover:shadow-amber-500/25"
                      >
                        <ChefHat className="h-4 w-4" />
                        Start Preparing
                      </button>
                    )}
                    {(o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY') && (
                      <span className="text-xs text-surface-500 italic">
                        {o.status === 'PREPARING' ? 'Being prepared…' : 'On the way…'}
                      </span>
                    )}
                    {o.status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-400">✅ Completed</span>
                    )}
                    {o.status === 'CANCELLED' && (
                      <span className="text-xs text-red-400">❌ Cancelled</span>
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

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
        {icon}
      </div>
      <div>
        <p className="text-sm text-surface-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
