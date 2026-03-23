import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Truck, Package, Check, MapPin, Clock, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' },
  PREPARING: { label: 'Preparing', color: 'bg-amber-500/20 text-amber-400 ring-amber-500/30' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-purple-500/20 text-purple-400 ring-purple-500/30' },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30' },
};

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('available'); // available | active

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/delivery/orders');
      setOrders(res.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const res = await api.put(`/delivery/orders/${orderId}/accept`);
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      toast.success('Delivery accepted! 🚀');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      const res = await api.put(`/delivery/orders/${orderId}/deliver`);
      setOrders(orders.map((o) => (o.id === orderId ? res.data : o)));
      toast.success('Delivery completed! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark delivered');
    }
  };

  const availableOrders = orders.filter(
    (o) => o.status === 'ACCEPTED' || o.status === 'PREPARING'
  );
  const activeOrders = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY');
  const displayedOrders = tab === 'available' ? availableOrders : activeOrders;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Delivery <span className="text-brand-500">Dashboard</span>
          </h1>
          <p className="mt-1 text-surface-400">Manage your deliveries</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 rounded-xl border border-surface-700 px-4 py-2.5 text-sm font-medium text-surface-300 transition hover:bg-surface-800/60 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Available"
          value={availableOrders.length}
          accent="amber"
        />
        <StatCard
          icon={<Truck className="h-5 w-5" />}
          label="Active Deliveries"
          value={activeOrders.length}
          accent="purple"
        />
        <StatCard
          icon={<Check className="h-5 w-5" />}
          label="Total Orders"
          value={orders.length}
          accent="brand"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-surface-900/60 p-1 w-fit border border-surface-800/60">
        <TabButton
          active={tab === 'available'}
          onClick={() => setTab('available')}
          count={availableOrders.length}
        >
          Available
        </TabButton>
        <TabButton
          active={tab === 'active'}
          onClick={() => setTab('active')}
          count={activeOrders.length}
        >
          My Active
        </TabButton>
      </div>

      {/* Orders */}
      {displayedOrders.length === 0 ? (
        <div className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-20 text-center">
          <Truck className="mx-auto h-12 w-12 text-surface-700 mb-3" />
          <p className="text-surface-400">
            {tab === 'available' ? 'No orders available for pickup' : 'No active deliveries'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || {};
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5 transition hover:border-surface-700"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">Order #{order.id}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusCfg.color}`}>
                        {statusCfg.label || order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-surface-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-brand-400" />
                        {order.restaurant?.name || 'Unknown restaurant'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-brand-400" />
                        {order.createdAt?.split('T')[0] || '—'}
                      </span>
                    </div>

                    <p className="text-base font-semibold text-brand-400">
                      ₹{order.totalAmount?.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                      <button
                        onClick={() => handleAccept(order.id)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:shadow-brand-500/40 hover:brightness-110"
                      >
                        <Truck className="h-4 w-4" />
                        Pick Up
                      </button>
                    )}
                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => handleDeliver(order.id)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:brightness-110"
                      >
                        <Check className="h-4 w-4" />
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  const accentColors = {
    brand: 'bg-brand-500/10 text-brand-400',
    amber: 'bg-amber-500/10 text-amber-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accentColors[accent] || accentColors.brand}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-surface-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, count, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-500/20 text-brand-400'
          : 'text-surface-400 hover:text-surface-200'
      }`}
    >
      {children}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        active ? 'bg-brand-500/30 text-brand-300' : 'bg-surface-800 text-surface-500'
      }`}>
        {count}
      </span>
    </button>
  );
}
